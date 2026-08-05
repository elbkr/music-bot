import { ApplicationCommandOptionType } from "discord.js";
import Command from "../base/Command.js";
import LavalinkReadyGuard from "../../../domain/guards/LavalinkReadyGuard.js";
import InVoiceChannelGuard from "../../../domain/guards/InVoiceChannelGuard.js";
import SameVoiceChannelGuard from "../../../domain/guards/SameVoiceChannelGuard.js";
import buildConfigReplyEmbed from "../../components/embeds/ConfigReplyEmbed.js";
import { buildFavoritesEmbeds } from "../../components/embeds/FavoritesEmbed.js";
import { sendPaginatedEmbeds } from "../../components/buttons/PaginationButtons.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import Emojis from "../../../domain/constants/Emojis.js";

// Only /favorite play actually starts playback, so only it needs the voice
// guards — reused as plain instances (they're stateless) rather than
// extending MusicCommand, which would apply them to add/list/remove too and
// block users from managing their own favorites list while not in a channel,
// a regression from the legacy command's behavior.
const lavalinkReady = new LavalinkReadyGuard();
const inVoiceChannel = new InVoiceChannelGuard();
const sameVoiceChannel = new SameVoiceChannelGuard();
const PLAY_GUARDS = [lavalinkReady, inVoiceChannel, sameVoiceChannel];

/**
 * `/favorite add|remove|list|play` — manages the invoking user's personal favorites list.
 * Extends the base `Command`, not `MusicCommand`, since only the `play` subcommand needs
 * voice guards; `add`/`remove`/`list` must stay usable while not in a voice channel.
 * @extends Command
 */
export default class FavoriteCommand extends Command {
  constructor() {
    super({
      name: "favorite",
      description: "Manage your favorite songs",
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "add",
          description: "Add the currently playing song to your favorites",
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "remove",
          description: "Remove a song from your favorites",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "position",
              description: "The position of the song (see /favorite list)",
              required: true,
            },
          ],
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "list",
          description: "List your favorite songs",
        },
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "play",
          description: "Play one of your favorite songs",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              name: "position",
              description: "The position of the song (see /favorite list)",
              required: true,
            },
          ],
        },
      ],
    });
  }

  // Favorites are personal — every reply here is private to the invoking
  // user, including /favorite play's confirmation. The actual playback still
  // triggers the normal PUBLIC "Now playing" announcement via onPlayerStart;
  // this only makes the command's own reply private, avoiding channel spam
  // for what's fundamentally a personal-list action.
  get ephemeral() {
    return true;
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add") return this.add(interaction);
    if (subcommand === "remove") return this.remove(interaction);
    if (subcommand === "list") return this.list(interaction);
    return this.play(interaction, context);
  }

  /**
   * Handles the `add` subcommand — favorites the currently playing track.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async add(interaction) {
    const track = this.client.queueService.getCurrentTrack(interaction.guildId);

    if (!track) {
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.NOTFOUND)} There is no music playing in this guild!`,
      });
    }

    const { ok } = await this.client.userRepository.addFavorite(interaction.user.id, {
      title: track.title,
      author: track.author,
      uri: track.uri,
      source: track.sourceName,
    });

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Already a Favorite",
            fields: [{ name: "Song", value: formatTrackTitle(track) }],
          }),
        ],
      });
    }

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: `${this.client.emoteService.get(Emojis.FAV)} Added to Favorites`,
          fields: [{ name: "Song", value: formatTrackTitle(track) }],
        }),
      ],
    });
  }

  /**
   * Handles the `remove` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async remove(interaction) {
    const position = interaction.options.getInteger("position", true);

    const { ok, removed } = await this.client.userRepository.removeFavorite(
      interaction.user.id,
      position
    );

    if (!ok) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Favorite Not Found",
            description: "There is no favorite song at that position — check `/favorite list`.",
          }),
        ],
      });
    }

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: "Removed from Favorites",
          fields: [{ name: "Song", value: formatTrackTitle(removed) }],
        }),
      ],
    });
  }

  /**
   * Handles the `list` subcommand.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<import("discord.js").Message>}
   */
  async list(interaction) {
    const favorites = await this.client.userRepository.listFavorites(interaction.user.id);
    const pages = buildFavoritesEmbeds(favorites, interaction.user.displayAvatarURL());

    return sendPaginatedEmbeds(interaction, pages);
  }

  /**
   * Handles the `play` subcommand. Runs `PLAY_GUARDS` manually (rather than declaring
   * `guards`/`extraGuards`) so only this subcommand is voice-gated.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async play(interaction, context) {
    for (const guard of PLAY_GUARDS) {
      const result = await guard.check(interaction, context);
      if (!result.ok) return this.deny(interaction, result.message);
    }

    const position = interaction.options.getInteger("position", true);
    const favorites = await this.client.userRepository.listFavorites(interaction.user.id);
    const favorite = favorites[position - 1];

    if (!favorite) {
      return interaction.editReply({
        embeds: [
          buildConfigReplyEmbed({
            title: "Favorite Not Found",
            description: "There is no favorite song at that position — check `/favorite list`.",
          }),
        ],
      });
    }

    const result = await this.client.queueService.play({
      voiceChannel: context.voiceChannel,
      textChannel: interaction.channel,
      query: favorite.uri,
      requestedBy: interaction.user,
    });

    if (!result) {
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.NOTFOUND)} That favorite couldn't be played anymore — it may no longer be available.`,
      });
    }

    return interaction.editReply({
      embeds: [
        buildConfigReplyEmbed({
          title: `${this.client.emoteService.get(Emojis.PLAY)} Added from Favorites`,
          fields: [{ name: "Song", value: formatTrackTitle(favorite) }],
        }),
      ],
    });
  }
}
