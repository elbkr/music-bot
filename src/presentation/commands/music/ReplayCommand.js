import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

/**
 * `/replay` — seeks the current track back to `0:00`. DJ-gated.
 * @extends MusicCommand
 */
export default class ReplayCommand extends MusicCommand {
  constructor() {
    super({
      name: "replay",
      description: "Replays the current track",
    });
  }

  /** @returns {import("../../../domain/guards/Guard.js").default[]} */
  get extraGuards() {
    return [djRoleGuard];
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const track = this.client.queueService.getCurrentTrack(interaction.guildId);

    if (!track) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    await this.client.queueService.seek(interaction.guildId, 0);

    return interaction.editReply({
      content: `${this.client.emoteService.get(Emojis.REPLAY)} Replaying **${formatTrackTitle(track)}**!`,
    });
  }
}
