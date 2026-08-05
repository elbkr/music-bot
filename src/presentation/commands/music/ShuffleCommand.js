import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

/**
 * `/shuffle` — randomizes the order of the upcoming queue. DJ-gated.
 * @extends MusicCommand
 */
export default class ShuffleCommand extends MusicCommand {
  constructor() {
    super({
      name: "shuffle",
      description: "Shuffles the queue",
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
    const shuffled = this.client.queueService.shuffle(interaction.guildId);

    if (!shuffled) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    return interaction.editReply({
      content: `${this.client.emoteService.get(Emojis.SHUFFLE)} Shuffled the queue!`,
    });
  }
}
