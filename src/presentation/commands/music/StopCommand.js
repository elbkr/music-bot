import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

/**
 * `/stop` — clears the queue and destroys the player for the current guild. DJ-gated.
 * @extends MusicCommand
 */
export default class StopCommand extends MusicCommand {
  constructor() {
    super({
      name: "stop",
      description: "Stops the music and clears the queue",
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
    const stopped = await this.client.queueService.stop(interaction.guildId);

    if (!stopped) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    return interaction.editReply({
      content: `${this.client.emoteService.get(Emojis.STOP)} Stopped the music and cleared the queue!`,
    });
  }
}
