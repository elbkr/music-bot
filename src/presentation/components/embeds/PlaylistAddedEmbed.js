import { EmbedBuilder } from "discord.js";
import { formatTotalDuration } from "../../../shared/format/duration.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";

/**
 * Reply embed shown after `/play` queues an entire playlist.
 * @param {object} options
 * @param {?string} options.playlistName
 * @param {object[]} options.tracks - The playlist's tracks, in queued order.
 * @param {import("discord.js").User} [options.requester]
 * @returns {import("discord.js").EmbedBuilder}
 */
export default function buildPlaylistAddedEmbed({ playlistName, tracks, requester }) {
  const firstTrack = tracks[0];

  const embed = new EmbedBuilder()
    .setTitle(playlistName || "Playlist")
    .setColor(PRIMARY_COLOR)
    .addFields(
      { name: "Duration", value: formatTotalDuration(tracks), inline: true },
      { name: "Songs", value: `${tracks.length}`, inline: true }
    );

  if (firstTrack?.thumbnail) embed.setThumbnail(firstTrack.thumbnail);

  if (requester) {
    embed.setAuthor({
      name: requester.username,
      iconURL: requester.displayAvatarURL(),
    });
  }

  return embed;
}
