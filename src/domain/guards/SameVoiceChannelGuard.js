import Guard from "./Guard.js";
import Emojis from "../constants/Emojis.js";

/**
 * Requires the calling member to be in the SAME voice channel the bot is
 * already connected to (a no-op if the bot isn't connected anywhere yet).
 * Prevents "voice channel hijacking" — a member in a different channel
 * skipping/stopping/adjusting a session they aren't part of.
 *
 * Must run after InVoiceChannelGuard, which resolves context.voiceChannel.
 */
export default class SameVoiceChannelGuard extends Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../client/Bot.js").default, voiceChannel?: import("discord.js").VoiceBasedChannel}} context
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction, context) {
    const botChannel = interaction.guild.members.me?.voice?.channel;
    if (!botChannel) {
      return { ok: true };
    }

    const memberChannel = context.voiceChannel ?? interaction.member?.voice?.channel;
    if (memberChannel?.id !== botChannel.id) {
      return {
        ok: false,
        message: `${context.client.emoteService.get(Emojis.NOMIC)} You must be in the same voice channel as me to use this command!`,
      };
    }

    return { ok: true };
  }
}
