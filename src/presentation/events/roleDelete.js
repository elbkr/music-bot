import Event from "./base/Event.js";
import buildAuditLogEmbed from "../components/embeds/AuditLogEmbed.js";
import { DANGER_COLOR } from "../../domain/constants/Theme.js";

/**
 * Scrubs a deleted role from djRoles. The legacy version of this listener
 * queried `getGuild({ guildID: role.guild.id })` against a schema keyed on
 * `_id` — a typo that meant `guildId` was always undefined and this handler
 * never actually worked. Using GuildRepository's correctly-keyed
 * removeDjRole(guildId, roleId) here fixes that for real, not just relocates
 * the bug.
 */
export default class RoleDeleteEvent extends Event {
  constructor() {
    super({ name: "roleDelete" });
  }

  /**
   * @param {import("discord.js").Role} role
   * @returns {Promise<void>}
   */
  async exec(role) {
    const { ok } = await this.client.guildRepository.removeDjRole(role.guild.id, role.id);
    if (!ok) return;

    this.client.logger.warn(
      `Role ${role.name} (${role.id}) deleted — removed from ${role.guild.name}'s DJ roles.`,
      { tag: "RoleDelete" }
    );

    await this.client.logService.send(
      role.guild.id,
      buildAuditLogEmbed({
        title: "DJ role removed",
        description: `**@${role.name}** was deleted in Discord and has been scrubbed from the DJ roles list.`,
        color: DANGER_COLOR,
      })
    );
  }
}
