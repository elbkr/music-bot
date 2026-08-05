import { ApplicationCommandOptionType } from "discord.js";
import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import RepeatMode from "../../../player/constants/RepeatMode.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

const REPEAT_MODES = {
  track: RepeatMode.TRACK,
  queue: RepeatMode.QUEUE,
  disabled: RepeatMode.OFF,
};

const CONFIRMATIONS = {
  track: { emoji: Emojis.LOOPED, text: "Looped the current track!" },
  queue: { emoji: Emojis.LOOPED, text: "Looped the current queue!" },
  disabled: { emoji: Emojis.NOLOOP, text: "Disabled the loop mode!" },
};

/**
 * `/loop <mode>` — sets the repeat mode for the current guild's player (track, queue, or
 * off). DJ-gated.
 * @extends MusicCommand
 */
export default class LoopCommand extends MusicCommand {
  constructor() {
    super({
      name: "loop",
      description: "Changes the loop mode",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "mode",
          description: "Loop mode",
          required: true,
          choices: [
            { name: "track", value: "track" },
            { name: "queue", value: "queue" },
            { name: "disabled", value: "disabled" },
          ],
        },
      ],
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
    const mode = interaction.options.getString("mode", true);

    if (!this.client.queueService.hasQueue(interaction.guildId)) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    this.client.queueService.setRepeatMode(interaction.guildId, REPEAT_MODES[mode]);

    const { emoji, text } = CONFIRMATIONS[mode];
    return interaction.editReply({ content: `${this.client.emoteService.get(emoji)} ${text}` });
  }
}
