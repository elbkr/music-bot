import { PermissionFlagsBits } from "discord.js";
import Guard from "./Guard.js";

/**
 * Requires the member to be a DJ (per guildConfig.djRoles), a server manager,
 * or — optionally — alone in the voice channel with the bot.
 *
 * Fixes two audit findings at once:
 *  - uses PermissionFlagsBits.ManageGuild instead of the v13 string
 *    "MANAGE_GUILD", which throws under discord.js v14's permission resolver.
 *  - reads member.roles.cache instead of the private, underscore-prefixed
 *    member._roles internal.
 */
export default class DjRoleGuard extends Guard {
  /**
   * @param {object} [options]
   * @param {boolean} [options.allowIfAlone] - When `true` (default), a member alone with
   *        the bot in the voice channel also passes, even without the DJ role/permission.
   */
  constructor({ allowIfAlone = true } = {}) {
    super();
    this.allowIfAlone = allowIfAlone;
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{guildConfig: import("../../database/models/Guild.model.js").default, voiceChannel: import("discord.js").VoiceBasedChannel}} context
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction, context) {
    const member = interaction.member;

    if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return { ok: true };
    }

    const djRoles = context.guildConfig?.djRoles ?? [];
    const isDJ = djRoles.some((roleId) => member.roles.cache.has(roleId));
    if (isDJ) {
      return { ok: true };
    }

    if (this.allowIfAlone) {
      const channel = context.voiceChannel ?? member.voice.channel;
      const humanMembers = channel?.members.filter((m) => !m.user.bot);
      if (humanMembers && humanMembers.size <= 1) {
        return { ok: true };
      }
    }

    return {
      ok: false,
      message:
        "You must be a DJ, a server manager, or alone in the voice channel to use this command!",
    };
  }
}
