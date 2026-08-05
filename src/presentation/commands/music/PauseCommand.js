import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

/**
 * Toggles pause/resume — matches the legacy repo, which only ever had a
 * single pause.js command and no separate resume command.
 */
/**
 * `/pause` — toggles pause/resume on the current guild's player. DJ-gated.
 * @extends MusicCommand
 */
export default class PauseCommand extends MusicCommand {
  constructor() {
    super({
      name: "pause",
      description: "Pauses or resumes the current track",
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
    const queueService = this.client.queueService;

    if (!queueService.hasQueue(interaction.guildId)) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    if (queueService.isPaused(interaction.guildId)) {
      queueService.resume(interaction.guildId);
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.RESUME)} Resumed the track!`,
      });
    }

    queueService.pause(interaction.guildId);
    return interaction.editReply({
      content: `${this.client.emoteService.get(Emojis.PAUSE)} Paused the track!`,
    });
  }
}
