import Event from "./base/Event.js";

/**
 * Discord `guildDelete` — bot removed from a guild (kicked, guild deleted,
 * etc). Invalidates the cached config so a later interaction never serves
 * stale data — this is the exact drift `BoundedGuildCache` was built to
 * avoid, and the bug the original audit flagged in the legacy version
 * (which deleted the Mongo document but never touched the in-memory cache).
 *
 * Deliberately does NOT delete the guild's Mongo document. A kick is often
 * accidental or temporary (a permissions audit, a moderation mistake) — if
 * the bot is re-added later, DJ roles/allowed channels/log channel should
 * still be there, not wiped. Invalidating the cache is what actually fixes
 * the drift bug; deleting the config is a separate, more destructive
 * decision this doesn't make on your behalf.
 */
export default class GuildDeleteEvent extends Event {
  constructor() {
    super({ name: "guildDelete" });
  }

  /**
   * @param {import("discord.js").Guild} guild
   * @returns {Promise<void>}
   */
  async exec(guild) {
    this.client.guildRepository.invalidate(guild.id);

    this.client.logger.log(
      `Left guild ${guild.name} (${guild.id}) — now in ${this.client.guilds.cache.size} guild(s).`,
      { tag: "Guild" }
    );
  }
}
