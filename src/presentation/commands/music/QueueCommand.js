import MusicCommand from "../base/MusicCommand.js";
import { buildQueueEmbeds } from "../../components/embeds/QueueEmbed.js";
import { sendPaginatedEmbeds } from "../../components/buttons/PaginationButtons.js";

/**
 * `/queue` — displays the currently playing track and a paginated list of upcoming tracks.
 * @extends MusicCommand
 */
export default class QueueCommand extends MusicCommand {
  constructor() {
    super({
      name: "queue",
      description: "Displays the queue of songs",
    });
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const queueService = this.client.queueService;
    const currentTrack = queueService.getCurrentTrack(interaction.guildId);

    if (!currentTrack) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    const pages = buildQueueEmbeds(
      currentTrack,
      queueService.getUpcomingTracks(interaction.guildId),
      interaction.guild.iconURL()
    );

    return sendPaginatedEmbeds(interaction, pages);
  }
}
