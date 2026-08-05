import Event from "./base/Event.js";

/**
 * Discord `guildCreate` — bot added to a new guild. `GuildRepository.findOrCreate`
 * is lazy (the first interaction in a guild creates its config), so there's
 * nothing to set up here — this is operational visibility only.
 */
export default class GuildCreateEvent extends Event {
  constructor() {
    super({ name: "guildCreate" });
  }

  /**
   * @param {import("discord.js").Guild} guild
   * @returns {Promise<void>}
   */
  async exec(guild) {
    this.client.logger.log(
      `Joined guild ${guild.name} (${guild.id}) — now in ${this.client.guilds.cache.size} guild(s).`,
      { tag: "Guild" }
    );
  }
}
