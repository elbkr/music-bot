import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import Command from "../base/Command.js";
import ManageGuildGuard from "../../../domain/guards/ManageGuildGuard.js";
import buildAuditLogEmbed from "../../components/embeds/AuditLogEmbed.js";
import buildConfigReplyEmbed from "../../components/embeds/ConfigReplyEmbed.js";
import { SUCCESS_COLOR } from "../../../domain/constants/Theme.js";

const manageGuildGuard = new ManageGuildGuard();

/**
 * `/log set|disable` — configures the text channel that receives audit-log embeds for
 * configuration changes ({@link LogService}). Manage Guild only.
 * @extends Command
 */
export default class LogCommand extends Command {
  constructor() {
    super({
      name: "log",
      description: "Configure the channel used for configuration audit logs",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "set",
          description: "Set the audit log channel",
          options: [
            {
              type: ApplicationCommandOptionType.Channel,
              name: "channel",
              description: "The text channel to send audit logs to",
              required: true,
              channelTypes: [ChannelType.GuildText],
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "disable",
          description: "Stop sending configuration audit logs",
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
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "disable") return this.disable(interaction);
    return this.set(interaction);
  }

  /**
   * Handles the `set` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async set(interaction) {
    const channel = interaction.options.getChannel("channel", true);

    const { ok } = await this.client.guildRepository.setLogChannel(
      interaction.guildId,
      channel.id
    );

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "No Change",
            description: "This is already the audit log channel.",
            fields: [{ name: "Channel", value: `${channel}`, inline: true }],
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: "Audit log enabled",
        description: "Configuration changes will now be logged to this channel.",
        actor: interaction.user,
        color: SUCCESS_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "Audit Log Channel Set",
          fields: [{ name: "Channel", value: `${channel}`, inline: true }],
        }),
      ],
    });
  }

  /**
   * Handles the `disable` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async disable(interaction) {
    const { ok } = await this.client.guildRepository.setLogChannel(interaction.guildId, null);

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "No Change",
            description: "Audit logging is already disabled.",
          }),
        ],
      });
    }

    return interaction.editReply({
      embeds: [buildConfigReplyEmbed({ title: "Audit Logging Disabled" })],
    });
  }
}
