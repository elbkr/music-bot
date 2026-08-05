import { EmbedBuilder } from "discord.js";
import { INFO_COLOR } from "../../../domain/constants/Theme.js";

/**
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.description
 * @param {import("discord.js").User} [options.actor] who made the change; omitted for
 *        changes synced from a direct Discord edit (e.g. a role/channel deletion)
 * @param {number} [options.color]
 * @returns {import("discord.js").EmbedBuilder}
 */
export default function buildAuditLogEmbed({ title, description, actor, color = INFO_COLOR }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp();

  if (actor) {
    embed.setFooter({ text: `By ${actor.tag}`, iconURL: actor.displayAvatarURL() });
  }

  return embed;
}
