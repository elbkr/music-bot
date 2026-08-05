import { ApplicationCommandOptionType } from "discord.js";
import MusicCommand from "../base/MusicCommand.js";
import buildSongAddedEmbed from "../../components/embeds/SongAddedEmbed.js";
import buildPlaylistAddedEmbed from "../../components/embeds/PlaylistAddedEmbed.js";
import PlaySource from "../../../player/constants/PlaySource.js";
import Emojis from "../../../domain/constants/Emojis.js";

/**
 * `/play <input> [source]` — searches for and queues a track or playlist, starting
 * playback immediately if nothing is currently playing.
 * @extends MusicCommand
 */
export default class PlayCommand extends MusicCommand {
  constructor() {
    super({
      name: "play",
      description: "Adds a song to the queue",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: "input",
          description: "The search term or a link",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.String,
          name: "source",
          description: "Where to search (defaults to YouTube Music). Ignored for direct links.",
          required: false,
          choices: [
            { name: "YouTube Music", value: PlaySource.YOUTUBE_MUSIC },
            { name: "YouTube", value: PlaySource.YOUTUBE },
            { name: "SoundCloud", value: PlaySource.SOUNDCLOUD },
            { name: "Spotify", value: PlaySource.SPOTIFY },
            { name: "Apple Music", value: PlaySource.APPLE_MUSIC },
          ],
        },
      ],
    });
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default, voiceChannel: import("discord.js").VoiceBasedChannel}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const query = interaction.options.getString("input", true);
    const source = interaction.options.getString("source") ?? undefined;

    try {
      const result = await this.client.queueService.play({
        voiceChannel: context.voiceChannel,
        textChannel: interaction.channel,
        query,
        requestedBy: interaction.user,
        source,
      });

      if (!result) {
        return interaction.editReply({
          content: `${this.client.emoteService.get(Emojis.NOTFOUND)} I couldn't find anything for that query.`,
        });
      }

      // Kazagumo has no per-track "added to queue" event with the right
      // semantics (its `queueUpdate` fires on every mutation, including
      // removals and shuffles), so these embeds are rendered here on the
      // path that actually knows what was added. This also removes the
      // duplicate "added" message the old event-driven version produced
      // alongside the command's own reply.
      if (result.isPlaylist) {
        return interaction.editReply({
          embeds: [
            buildPlaylistAddedEmbed({
              playlistName: result.playlistName,
              tracks: result.tracks,
              requester: interaction.user,
            }),
          ],
        });
      }

      const position = this.client.queueService
        .getUpcomingTracks(interaction.guildId)
        .findIndex((track) => track === result.track);

      return interaction.editReply({
        embeds: [buildSongAddedEmbed(this.client, result.track, position + 1)],
      });
    } catch (err) {
      this.client.logger.error(`Failed to play "${query}"\n${err?.message ?? err}`, {
        tag: "Player",
      });
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.NOTFOUND)} I couldn't find or play that track.`,
      });
    }
  }
}
