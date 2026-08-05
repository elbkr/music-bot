import MusicCommand from "../base/MusicCommand.js";
import buildNowPlayingEmbed from "../../components/embeds/NowPlayingEmbed.js";

/**
 * `/nowplaying` — displays the current track with a live-position progress bar.
 * @extends MusicCommand
 */
export default class NowPlayingCommand extends MusicCommand {
  constructor() {
    super({
      name: "nowplaying",
      description: "Displays the current playing track",
    });
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const queueService = this.client.queueService;
    const track = queueService.getCurrentTrack(interaction.guildId);

    if (!track) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    return interaction.editReply({
      embeds: [
        buildNowPlayingEmbed(
          this.client,
          track,
          queueService.getPlaybackPosition(interaction.guildId)
        ),
      ],
    });
  }
}
