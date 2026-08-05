import { ApplicationCommandOptionType } from "discord.js";
import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import { formatTrackTitle } from "../../../shared/format/track.js";

const djRoleGuard = new DjRoleGuard();

/**
 * `/jump <position>` — drops every track before `position` and skips to it. DJ-gated,
 * since it reorders/skips the queue for everyone, the same category of action as
 * skip/stop.
 * @extends MusicCommand
 */
export default class JumpCommand extends MusicCommand {
  constructor() {
    super({
      name: "jump",
      description: "Jumps to a specific track in the queue",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "position",
          description: "The position of the track in the queue",
          required: true,
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
    const position = interaction.options.getInteger("position", true);

    const track = this.client.queueService.jump(interaction.guildId, position);

    if (!track) {
      return interaction.editReply({ content: "There is no track at that position!" });
    }

    return interaction.editReply({ content: `Jumped to **${formatTrackTitle(track)}**!` });
  }
}
