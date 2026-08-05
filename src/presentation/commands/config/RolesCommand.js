import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import Command from "../base/Command.js";
import ManageGuildGuard from "../../../domain/guards/ManageGuildGuard.js";
import buildAuditLogEmbed from "../../components/embeds/AuditLogEmbed.js";
import buildConfigReplyEmbed from "../../components/embeds/ConfigReplyEmbed.js";
import { PRIMARY_COLOR, SUCCESS_COLOR, WARNING_COLOR } from "../../../domain/constants/Theme.js";

const manageGuildGuard = new ManageGuildGuard();

/**
 * `/roles add|remove|list` — manages the guild's DJ role allow-list. Manage Guild only.
 * @extends Command
 */
export default class RolesCommand extends Command {
  constructor() {
    super({
      name: "roles",
      description: "Manage DJ roles",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Add a role to the DJ roles list",
          options: [
            {
              type: ApplicationCommandOptionType.Role,
              name: "role",
              description: "The role to add",
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "remove",
          description: "Remove a role from the DJ roles list",
          options: [
            {
              type: ApplicationCommandOptionType.Role,
              name: "role",
              description: "The role to remove",
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "list",
          description: "List all DJ roles",
        },
      ],
    });
  }

  /** @returns {import("../../../domain/guards/Guard.js").default[]} */
  get guards() {
    return [manageGuildGuard];
  }

  get ephemeral() {
    return true;
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default, guildConfig: import("../../../database/models/Guild.model.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") return this.add(interaction);
    if (subcommand === "remove") return this.remove(interaction);
    return this.list(interaction, context);
  }

  /**
   * Handles the `add` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async add(interaction) {
    const role = interaction.options.getRole("role", true);

    if (role.id === interaction.guild.id) {
      return interaction.editReply({ content: "The *everyone* role is not manageable!" });
    }

    const { ok } = await this.client.guildRepository.addDjRole(interaction.guildId, role.id);

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Role Already Added",
            fields: [{ name: "Role", value: `${role}`, inline: true }],
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: "DJ role added",
        description: `${role} was added to the DJ roles list.`,
        actor: interaction.user,
        color: SUCCESS_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "DJ Role Added",
          fields: [{ name: "Role", value: `${role}`, inline: true }],
        }),
      ],
    });
  }

  /**
   * Handles the `remove` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async remove(interaction) {
    const role = interaction.options.getRole("role", true);

    if (role.id === interaction.guild.id) {
      return interaction.editReply({ content: "The *everyone* role is not manageable!" });
    }

    const { ok } = await this.client.guildRepository.removeDjRole(interaction.guildId, role.id);

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Role Not Found",
            description: "This role is not in the DJ roles list.",
            fields: [{ name: "Role", value: `${role}`, inline: true }],
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: "DJ role removed",
        description: `${role} was removed from the DJ roles list.`,
        actor: interaction.user,
        color: WARNING_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "DJ Role Removed",
          fields: [{ name: "Role", value: `${role}`, inline: true }],
        }),
      ],
    });
  }

  /**
   * Handles the `list` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{guildConfig: import("../../../database/models/Guild.model.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async list(interaction, context) {
    const djRoles = context.guildConfig.djRoles;

    if (!djRoles.length) {
      return interaction.editReply({ content: "There are no DJ roles set!" });
    }

    const embed = new EmbedBuilder()
      .setTitle("DJ Roles list")
      .setThumbnail(interaction.guild.iconURL({ size: 2048 }))
      .setColor(PRIMARY_COLOR)
      .setDescription(djRoles.map((id) => `<@&${id}>`).join(" "))
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}
