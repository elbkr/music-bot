import Guard from "./Guard.js";
import Emojis from "../constants/Emojis.js";

/**
 * Enforces guildConfig.voiceChannels as an allow-list, matching legacy
 * semantics: an empty list means no restriction is configured (open to any
 * channel), not "no channels allowed."
 */
export default class AllowedVoiceChannelGuard extends Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../client/Bot.js").default, guildConfig: import("../../database/models/Guild.model.js").default, voiceChannel?: import("discord.js").VoiceBasedChannel}} context
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction, context) {
    const allowedChannels = context.guildConfig?.voiceChannels ?? [];
    if (allowedChannels.length === 0) return { ok: true };

    const channel = context.voiceChannel ?? interaction.member?.voice?.channel;
    if (channel && allowedChannels.includes(channel.id)) return { ok: true };

    return {
      ok: false,
      message: `${context.client.emoteService.get(Emojis.NOMIC)} You must be in one of the allowed voice channels to use this command!`,
    };
  }
}
