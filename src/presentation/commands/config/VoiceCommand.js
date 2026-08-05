import { ApplicationCommandOptionType, ChannelType, EmbedBuilder } from "discord.js";
import Command from "../base/Command.js";
import ManageGuildGuard from "../../../domain/guards/ManageGuildGuard.js";
import buildAuditLogEmbed from "../../components/embeds/AuditLogEmbed.js";
import buildConfigReplyEmbed from "../../components/embeds/ConfigReplyEmbed.js";
import { PRIMARY_COLOR, SUCCESS_COLOR, WARNING_COLOR } from "../../../domain/constants/Theme.js";

const manageGuildGuard = new ManageGuildGuard();

const VOICE_CHANNEL_TYPES = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];

/**
 * `/voice add|remove|list` — manages the guild's allowed-voice-channels allow-list. An
 * empty list means "no restriction," matching `AllowedVoiceChannelGuard`'s semantics.
 * Manage Guild only.
 * @extends Command
 */
export default class VoiceCommand extends Command {
  constructor() {
    super({
      name: "voice",
      description: "Manage the allowed voice channels",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Add a voice channel to the allowed list",
          options: [
            {
              type: ApplicationCommandOptionType.Channel,
              name: "channel",
              description: "The voice channel to add",
              required: true,
              // Constrains Discord's own channel picker to voice/stage
              // channels, replacing the legacy command's manual
              // `channel.type !== ...` runtime check entirely — invalid
              // types simply aren't selectable.
              channelTypes: VOICE_CHANNEL_TYPES,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "remove",
          description: "Remove a voice channel from the allowed list",
          options: [
            {
              type: ApplicationCommandOptionType.Channel,
              name: "channel",
              description: "The voice channel to remove",
              required: true,
              channelTypes: VOICE_CHANNEL_TYPES,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "list",
          description: "List the allowed voice channels",
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
    const channel = interaction.options.getChannel("channel", true);

    const { ok } = await this.client.guildRepository.addVoiceChannel(
      interaction.guildId,
      channel.id
    );

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Channel Already Added",
            fields: [{ name: "Channel", value: `${channel}`, inline: true }],
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: "Voice channel added to allow-list",
        description: `${channel} was added to the allowed voice channels list.`,
        actor: interaction.user,
        color: SUCCESS_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "Voice Channel Added",
          fields: [{ name: "Channel", value: `${channel}`, inline: true }],
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
    const channel = interaction.options.getChannel("channel", true);

    const { ok } = await this.client.guildRepository.removeVoiceChannel(
      interaction.guildId,
      channel.id
    );

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Channel Not Found",
            description: "This channel is not in the allowed voice channels list.",
            fields: [{ name: "Channel", value: `${channel}`, inline: true }],
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: "Voice channel removed from allow-list",
        description: `${channel} was removed from the allowed voice channels list.`,
        actor: interaction.user,
        color: WARNING_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "Voice Channel Removed",
          fields: [{ name: "Channel", value: `${channel}`, inline: true }],
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
    const voiceChannels = context.guildConfig.voiceChannels;

    if (!voiceChannels.length) {
      return interaction.editReply({ content: "There are no voice channels in the allowed list!" });
    }

    const embed = new EmbedBuilder()
      .setTitle("Allowed voice channels")
      .setThumbnail(interaction.guild.iconURL({ size: 2048 }))
      .setColor(PRIMARY_COLOR)
      .setDescription(voiceChannels.map((id) => `<#${id}>`).join(" "))
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
}
