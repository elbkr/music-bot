import Event from "./base/Event.js";
import buildAuditLogEmbed from "../components/embeds/AuditLogEmbed.js";
import { DANGER_COLOR } from "../../domain/constants/Theme.js";

/**
 * Scrubs a deleted voice channel from the allow-list. Direct Discord edits
 * (deleting the channel in server settings) bypass /voice entirely, so
 * without this listener the guild config accumulates ghost channel IDs
 * forever — the same class of drift-vs-Discord-reality bug the original
 * audit flagged for guild config generally.
 */
export default class ChannelDeleteEvent extends Event {
  constructor() {
    super({ name: "channelDelete" });
  }

  /**
   * @param {import("discord.js").DMChannel|import("discord.js").GuildChannel} channel
   * @returns {Promise<void>}
   */
  async exec(channel) {
    if (!channel.guild) return; // DM channel, no guild config to touch

    const { ok } = await this.client.guildRepository.removeVoiceChannel(
      channel.guild.id,
      channel.id
    );
    if (!ok) return; // wasn't on the allow-list, nothing to scrub

    this.client.logger.warn(
      `Voice channel ${channel.name} (${channel.id}) deleted — removed from ${channel.guild.name}'s allowed list.`,
      { tag: "ChannelDelete" }
    );

    await this.client.logService.send(
      channel.guild.id,
      buildAuditLogEmbed({
        title: "Voice channel removed from allow-list",
        description: `**#${channel.name}** was deleted in Discord and has been scrubbed from the allowed voice channels list.`,
        color: DANGER_COLOR,
      })
    );
  }
}
