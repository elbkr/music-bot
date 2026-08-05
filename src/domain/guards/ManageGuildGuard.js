import { PermissionFlagsBits } from "discord.js";
import Guard from "./Guard.js";

/**
 * Strict admin-only gate for configuration commands (/roles, /voice,
 * /announce). Unlike DjRoleGuard, there is no DJ-role or
 * "alone in the channel" bypass — Manage Guild only.
 *
 * A single .has(ManageGuild) check is sufficient: discord.js's
 * PermissionsBitField.has() checks for Administrator by default (its
 * `checkAdmin` parameter defaults to true), so server admins already pass
 * this without a separate explicit Administrator check.
 */
export default class ManageGuildGuard extends Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction) {
    if (interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return { ok: true };
    }

    return {
      ok: false,
      message: "You don't have the required permissions to do this!",
    };
  }
}
