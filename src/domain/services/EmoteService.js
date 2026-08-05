import Emojis, { DEFAULT_EMOJI_FALLBACKS } from "../constants/Emojis.js";

// Assumes the upstream public repo layout for auto-uploading missing emojis
// (matches package.json's repository field). If this project is forked or
// renamed, update this to point at wherever resource/emojis/ actually lives
// publicly — or just add the emojis to the guild by hand and this path is
// never used.
const EMOJI_ASSET_BASE_URL =
  "https://github.com/elbkr/music-bot/blob/main/resource/emojis/";

/**
 * Loads custom emojis by name from a designated "emoji guild" (EMOJIS_GUILD_ID),
 * falling back to a Unicode approximation when unconfigured, unreachable, or a
 * specific emoji hasn't been uploaded there yet. Structure/behavior restores
 * what the legacy Bot.loadEmotes() did, ported to this architecture: no
 * global `client.emotes` Collection, no hyphen/underscore key-mangling, and
 * every step is defensive enough that a missing guild or a single failed
 * upload never blocks bot startup — it just falls back for that name.
 */
export default class EmoteService {
  /**
   * @param {import("../../client/Bot.js").default} client
   * @param {object} [options]
   * @param {?string} [options.guildId] - The "emoji guild" custom emojis are loaded from
   *        and uploaded to. When omitted, `get()` always returns Unicode fallbacks.
   */
  constructor(client, { guildId } = {}) {
    this.client = client;
    this.guildId = guildId ?? null;
    /** @type {Map<string, string>} emoji name -> `<:name:id>` / `<a:name:id>` markup */
    this.emotes = new Map();
    this._initialized = false;
  }

  /**
   * Loads every custom emoji from the configured emoji guild and uploads any from
   * `Emojis` that are missing. Safe to call multiple times — only runs once. Never
   * throws: an unreachable guild, missing `guildId`, or a failed upload all fall back to
   * Unicode emoji for the affected name(s) instead of blocking startup.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) return;
    this._initialized = true;

    if (!this.guildId) {
      this.client.logger?.warn(
        "EMOJIS_GUILD_ID not set — using default Unicode emojis. See README's 'Setting up emojis' section.",
        { tag: "Emotes" }
      );
      return;
    }

    let guild;
    try {
      guild = await this.client.guilds.fetch(this.guildId);
    } catch (err) {
      this.client.logger.error(
        `Couldn't reach the emoji guild (${this.guildId})\n${err?.message ?? err}`,
        { tag: "Emotes" }
      );
      return;
    }

    const emojis = await guild.emojis.fetch();
    for (const emoji of emojis.values()) {
      this.emotes.set(emoji.name, emoji.toString());
    }

    await this._registerMissing(guild);

    this.client.logger.log(`Loaded ${this.emotes.size} custom emote(s).`, { tag: "Emotes" });
  }

  /**
   * @param {string} name - One of the `Emojis` constant values.
   * @returns {string} Custom emoji markup if loaded, else a Unicode fallback, else `""`.
   */
  get(name) {
    return this.emotes.get(name) ?? DEFAULT_EMOJI_FALLBACKS[name] ?? "";
  }

  /**
   * Uploads any `Emojis` entries not already present in the emoji guild, sourcing each
   * from `resource/emojis/<name>.<png|gif>` in the public repo. Per-emoji failures are
   * caught and logged individually so one bad upload doesn't block the rest.
   * @param {import("discord.js").Guild} guild - The fetched emoji guild.
   * @returns {Promise<void>}
   */
  async _registerMissing(guild) {
    const missing = Object.values(Emojis).filter((name) => !this.emotes.has(name));
    if (!missing.length) return;

    this.client.logger.warn(
      `${missing.length} emote(s) not found in the emoji guild — attempting to upload from resource/emojis/. Falling back to defaults for any that fail.`,
      { tag: "Emotes" }
    );

    for (const name of missing) {
      const extension = name === Emojis.SLIDER ? "gif" : "png";
      const url = `${EMOJI_ASSET_BASE_URL}${name}.${extension}?raw=true`;

      try {
        const emoji = await guild.emojis.create({ attachment: url, name });
        this.emotes.set(name, emoji.toString());
        this.client.logger.log(`Uploaded emote "${name}".`, { tag: "Emotes" });
      } catch (err) {
        this.client.logger.error(
          `Couldn't upload emote "${name}", using the default fallback for it\n${err?.message ?? err}`,
          { tag: "Emotes" }
        );
      }
    }
  }
}
