import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Event from "./base/Event.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Loads every Event subclass under presentation/events/** and binds it to
 * the client. Mirrors CommandRegistry's directory-walk + instanceof-filter
 * pattern exactly.
 */
export default class EventRegistry {
  /** @param {import("../../client/Bot.js").default} client */
  constructor(client) {
    this.client = client;
  }

  /**
   * Recursively walks `presentation/events/**`, dynamically imports every file, instantiates
   * each exported `Event` subclass, and binds it to the client via `client.on`/`client.once`.
   * Every listener's `exec()` is wrapped so a rejected promise is logged instead of becoming
   * an unhandled rejection.
   * @returns {Promise<void>}
   */
  async loadAll() {
    const files = await collectEventFiles(__dirname);
    let count = 0;

    for (const filePath of files) {
      const { default: EventClass } = await import(pathToFileURL(filePath));
      if (!EventClass || !(EventClass.prototype instanceof Event)) continue;

      const event = new EventClass();
      event.client = this.client;

      this.client[event.once ? "once" : "on"](event.name, (...args) => {
        Promise.resolve(event.exec(...args)).catch((err) => {
          this.client.logger?.error(
            `Unhandled error in event "${event.name}"\n${err?.stack ?? err}`,
            { tag: "Event" }
          );
        });
      });

      count += 1;
    }

    this.client.logger?.log(`Loaded ${count} event listener(s).`, { tag: "Events" });
  }
}

/**
 * Recursively lists every `.js` file under `dir`, skipping the `base/` folder (the abstract
 * `Event` class, not a loadable listener) and this registry's own file.
 * @param {string} dir - Absolute directory path to walk.
 * @returns {Promise<string[]>} Absolute paths of every event file found.
 */
async function collectEventFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "base") continue;
    if (entry.name === "EventRegistry.js") continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectEventFiles(fullPath)));
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}
