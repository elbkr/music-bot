import Guard from "./Guard.js";
import Emojis from "../constants/Emojis.js";

/**
 * Single responsibility: the calling member must be in a voice channel.
 * Stores the resolved channel on `context` so downstream guards/commands
 * don't re-derive it from the interaction.
 */
export default class InVoiceChannelGuard extends Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../client/Bot.js").default, voiceChannel?: import("discord.js").VoiceBasedChannel}} context
   *        Mutated: sets `context.voiceChannel` to the member's current voice channel on
   *        success, for downstream guards/`exec()` to reuse.
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction, context) {
    const channel = interaction.member?.voice?.channel;

    if (!channel) {
      return {
        ok: false,
        message: `${context.client.emoteService.get(Emojis.NOMIC)} You must be in a voice channel to use this command!`,
      };
    }

    context.voiceChannel = channel;
    return { ok: true };
  }
}
