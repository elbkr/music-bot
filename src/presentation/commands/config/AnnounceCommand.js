import { ApplicationCommandOptionType } from "discord.js";
import Command from "../base/Command.js";
import ManageGuildGuard from "../../../domain/guards/ManageGuildGuard.js";
import buildAuditLogEmbed from "../../components/embeds/AuditLogEmbed.js";
import buildConfigReplyEmbed from "../../components/embeds/ConfigReplyEmbed.js";
import { SUCCESS_COLOR, WARNING_COLOR } from "../../../domain/constants/Theme.js";

const manageGuildGuard = new ManageGuildGuard();

/**
 * `/announce <mode>` — toggles whether `onPlayerStart` posts a "Now playing" message.
 * Manage Guild only.
 * @extends Command
 */
export default class AnnounceCommand extends Command {
  constructor() {
    super({
      name: "announce",
      description: "Toggles whether to send the started playing message",
      options: [
        {
          type: ApplicationCommandOptionType.Boolean,
          name: "mode",
          description: "Whether to send the started playing message",
          required: true,
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
    const mode = interaction.options.getBoolean("mode", true);
    const state = mode ? "Enabled" : "Disabled";

    const { ok } = await this.client.guildRepository.setAnnouncements(interaction.guildId, mode);

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "No Change",
            description: `Announcements are already ${state.toLowerCase()}.`,
          }),
        ],
      });
    }

    await this.client.logService.send(
      interaction.guildId,
      buildAuditLogEmbed({
        title: `Announcements ${state.toLowerCase()}`,
        description: `"Now playing" messages are now ${state.toLowerCase()}.`,
        actor: interaction.user,
        color: mode ? SUCCESS_COLOR : WARNING_COLOR,
      })
    );

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: `Announcements ${state}`,
          description: `"Now playing" messages are now ${state.toLowerCase()}.`,
        }),
      ],
    });
  }
}
