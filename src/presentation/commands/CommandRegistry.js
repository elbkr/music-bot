import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { REST, Routes } from "discord.js";
import Command from "./base/Command.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads every Command subclass under presentation/commands/** and registers
 * them as GLOBAL slash commands exactly once.
 *
 * Fixes the audit's per-guild boot loop (the old ready.js looped over every
 * cached guild and did a blocking glob + REST PUT for each one, on every
 * restart). This does one glob-free async directory walk and one REST call
 * for the whole bot, diffed against what's already registered so a restart
 * with no command changes touches the API zero times.
 */
export default class CommandRegistry {
  /** @param {import("../../client/Bot.js").default} client */
  constructor(client) {
    this.client = client;
    this.commands = new Map();
  }

  /**
   * Recursively walks `presentation/commands/**`, dynamically imports every file, and
   * instantiates each exported `Command` subclass. Populates `this.commands` (keyed by
   * command name) but does not talk to the Discord API — see `registerGlobalCommands()`
   * for that.
   * @returns {Promise<Map<string, import("./base/Command.js").default>>}
   */
  async loadAll() {
    const files = await collectCommandFiles(__dirname);

    for (const filePath of files) {
      const { default: CommandClass } = await import(pathToFileURL(filePath));
      if (!CommandClass || !(CommandClass.prototype instanceof Command)) continue;

      const command = new CommandClass();
      command.client = this.client;
      this.commands.set(command.name, command);
    }

    this.client.logger?.log(`Loaded ${this.commands.size} command(s).`, {
      tag: "Commands",
    });

    return this.commands;
  }

  /**
   * Shapes every loaded command into the payload Discord's bulk-overwrite REST endpoint
   * expects.
   * @returns {import("discord.js").RESTPostAPIChatInputApplicationCommandsJSONBody[]}
   */
  toApiPayload() {
    return [...this.commands.values()].map((c) => ({
      name: c.name,
      description: c.description,
      type: c.type,
      options: c.options,
    }));
  }

  /**
   * Diffs the desired command set (from loaded `Command` instances) against what Discord
   * already has registered, and only issues a bulk-overwrite PUT when they differ — so a
   * restart with no command changes touches the Discord API zero times.
   * @returns {Promise<import("discord.js").RESTGetAPIApplicationCommandsResult>} The
   *          resulting (possibly unchanged) list of registered commands.
   */
  async registerGlobalCommands() {
    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
    const route = Routes.applicationCommands(process.env.CLIENT_ID);
    const desired = this.toApiPayload();

    const existing = await rest.get(route);

    if (isSameCommandSet(existing, desired)) {
      this.client.logger?.log("Global commands already up to date, skipping registration.", {
        tag: "Commands",
      });
      return existing;
    }

    const result = await rest.put(route, { body: desired });
    this.client.logger?.log(`Registered ${result.length} global command(s).`, {
      tag: "Commands",
    });
    return result;
  }
}

/**
 * Recursively lists every `.js` file under `dir`, skipping the `base/` folder (abstract
 * classes, not loadable commands) and this registry's own file.
 * @param {string} dir - Absolute directory path to walk.
 * @returns {Promise<string[]>} Absolute paths of every command file found.
 */
async function collectCommandFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "base") continue; // Command.js / MusicCommand.js are not loadable commands
    if (entry.name === "CommandRegistry.js") continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectCommandFiles(fullPath)));
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Order-independent structural comparison of two command payloads (name, description,
 * options), used to skip a redundant Discord API write when nothing has actually changed.
 * @param {Array<object>} a
 * @param {Array<object>} b
 * @returns {boolean}
 */
function isSameCommandSet(a, b) {
  if (a.length !== b.length) return false;

  const normalize = (commands) =>
    JSON.stringify(
      [...commands]
        .map((c) => ({
          name: c.name,
          description: c.description ?? null,
          options: c.options ?? [],
        }))
        .sort((x, y) => x.name.localeCompare(y.name))
    );

  return normalize(a) === normalize(b);
}
