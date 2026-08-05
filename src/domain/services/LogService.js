/**
 * Sends audit-log embeds to a guild's configured log channel. Silently
 * no-ops when unconfigured or when the channel is gone — this is a
 * best-effort convenience feature, not something that should ever throw and
 * take down the command that triggered it.
 */
export default class LogService {
  /** @param {import("../../client/Bot.js").default} client */
  constructor(client) {
    this.client = client;
  }

  /**
   * @param {string} guildId
   * @param {import("discord.js").EmbedBuilder} embed
   * @returns {Promise<void>} Resolves whether or not the send succeeds — failures are
   *          logged, never thrown, since this is a best-effort convenience feature.
   */
  async send(guildId, embed) {
    const guildConfig = await this.client.guildRepository.findOrCreate(guildId);
    if (!guildConfig.logChannelId) return;

    const channel = this.client.channels.cache.get(guildConfig.logChannelId);
    if (!channel?.isTextBased?.()) return;

    try {
      await channel.send({ embeds: [embed] });
    } catch (err) {
      this.client.logger.error(
        `Failed to send audit log in guild ${guildId}\n${err?.message ?? err}`,
        { tag: "Log" }
      );
    }
  }
}
