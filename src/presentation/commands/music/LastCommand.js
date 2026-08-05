import MusicCommand from "../base/MusicCommand.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import Emojis from "../../../domain/constants/Emojis.js";

/**
 * `/last` — replays the previously played track. No DJ gate: adding a track back to
 * playback is additive like `/play`, not disruptive to other listeners the way
 * skip/stop/volume are.
 * @extends MusicCommand
 */
export default class LastCommand extends MusicCommand {
  constructor() {
    super({
      name: "last",
      description: "Plays the previous track again",
    });
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const track = await this.client.queueService.previous(interaction.guildId);

    if (!track) {
      return interaction.editReply({ content: "There is no previous track to play!" });
    }

    return interaction.editReply({
      content: `${this.client.emoteService.get(Emojis.REPLAY)} Playing **${formatTrackTitle(track)}** again!`,
    });
  }
}
