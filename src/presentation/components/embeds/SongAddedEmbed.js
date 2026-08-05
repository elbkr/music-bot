import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../../../shared/format/duration.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";
import { SOURCE_EMOJI_NAMES } from "../../../domain/constants/Emojis.js";

/**
 * Reply embed shown after `/play` queues a single track.
 * @param {import("../../../client/Bot.js").default} client
 * @param {object} track - The queued Kazagumo track.
 * @param {number} position - 1-indexed position in the upcoming queue, or 0 if playing now.
 * @returns {import("discord.js").EmbedBuilder}
 */
export default function buildSongAddedEmbed(client, track, position) {
  const sourceEmojiName = SOURCE_EMOJI_NAMES[track.sourceName];
  const sourceIcon = sourceEmojiName ? `${client.emoteService.get(sourceEmojiName)} ` : "";

  const embed = new EmbedBuilder()
    .setTitle(`${sourceIcon}${formatTrackTitle(track)}`)
    .setColor(PRIMARY_COLOR)
    .addFields(
      {
        name: "Duration",
        value: track.isStream ? "Live" : formatDuration(track.length),
        inline: true,
      },
      {
        name: "Position in queue",
        value: position > 0 ? `${position}` : "Now playing",
        inline: true,
      }
    );

  if (track.uri) embed.setURL(track.uri);
  if (track.thumbnail) embed.setThumbnail(track.thumbnail);

  if (track.requester) {
    embed.setAuthor({
      name: track.requester.username,
      iconURL: track.requester.displayAvatarURL(),
    });
  }

  return embed;
}
