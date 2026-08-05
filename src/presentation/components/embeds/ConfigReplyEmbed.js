import { EmbedBuilder } from "discord.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";

/**
 * Shared shape for config command replies (add/remove/toggle outcomes) —
 * PRIMARY_COLOR, a title, and optional fields. Distinct from AuditLogEmbed,
 * which is for the log channel (semantic colors, actor footer); this is the
 * direct ephemeral reply to the command's own invoker.
 * @param {object} options
 * @param {string} options.title
 * @param {string} [options.description]
 * @param {import("discord.js").APIEmbedField[]} [options.fields]
 * @returns {import("discord.js").EmbedBuilder}
 */
export default function buildConfigReplyEmbed({ title, description, fields = [] }) {
  const embed = new EmbedBuilder().setTitle(title).setColor(PRIMARY_COLOR);

  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);

  return embed;
}
