import { ApplicationCommandOptionType } from "discord.js";
import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import Emojis from "../../../domain/constants/Emojis.js";

const djRoleGuard = new DjRoleGuard();

/**
 * Maps a 0-200 volume value to the closest volume icon. The top bracket has no upper
 * bound, so it also covers the boosted 100-200 range correctly.
 * @param {number} volume - 0-200.
 * @returns {string} One of the `Emojis.VOL_*` keys.
 */
function volumeIcon(volume) {
  if (volume === 0) return Emojis.VOL_MUTE;
  if (volume <= 33) return Emojis.VOL_LOW;
  if (volume <= 66) return Emojis.VOL_MID;
  return Emojis.VOL_HIGH;
}

/**
 * `/volume <value>` — sets the player volume (0-200%). DJ-gated.
 * @extends MusicCommand
 */
export default class VolumeCommand extends MusicCommand {
  constructor() {
    super({
      name: "volume",
      description: "Changes the volume of the music player",
      options: [
        {
          type: ApplicationCommandOptionType.Integer,
          name: "value",
          description: "The value to set the volume to (0-200)",
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
    const value = interaction.options.getInteger("value", true);

    if (value < 0 || value > 200) {
      return interaction.editReply({ content: "The volume must be between 0 and 200!" });
    }

    if (!this.client.queueService.hasQueue(interaction.guildId)) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    await this.client.queueService.setVolume(interaction.guildId, value);

    const icon = this.client.emoteService.get(volumeIcon(value));
    return interaction.editReply({ content: `${icon} Set the volume to ${value}%!` });
  }
}
