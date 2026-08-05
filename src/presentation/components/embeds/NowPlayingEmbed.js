import { EmbedBuilder } from "discord.js";
import { formatDuration } from "../../../shared/format/duration.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";
import Emojis from "../../../domain/constants/Emojis.js";

const BAR_LENGTH = 18;
const UNPLAYED_SEGMENT = "▬";

/**
 * Lavalink/Kazagumo has no built-in progress-bar renderer (discord-player
 * did), so it's drawn here from the player's reported position. Both values
 * are milliseconds.
 *
 * Only the PLAYED segment (before the slider) uses the custom "line" emoji;
 * the remaining/unplayed segment (after the slider) is always the plain
 * "▬" literal, not looked up via EmoteService. That's deliberate, not an
 * oversight: using the same "line" value on both sides made the bar look
 * uniform with no visual distinction between played and remaining once a
 * custom emoji was configured. With no custom emoji configured,
 * `client.emoteService.get(Emojis.LINE)` itself falls back to "▬", so the
 * played segment matches the unplayed one automatically — same look as
 * before this feature existed. The "slider" playhead still goes through
 * EmoteService normally (custom emoji or its 🔘 fallback).
 * @param {import("../../../client/Bot.js").default} client
 * @param {number} positionMs - Current playback position.
 * @param {number} lengthMs - Total track length. Returns `""` when falsy (e.g. live streams).
 * @returns {string}
 */
function renderProgressBar(client, positionMs, lengthMs) {
  if (!lengthMs) return "";

  const playedLine = client.emoteService.get(Emojis.LINE);
  const slider = client.emoteService.get(Emojis.SLIDER);

  const ratio = Math.min(Math.max(positionMs / lengthMs, 0), 1);
  const filled = Math.round(ratio * BAR_LENGTH);

  return `${playedLine.repeat(filled)}${slider}${UNPLAYED_SEGMENT.repeat(Math.max(BAR_LENGTH - filled, 0))}`;
}

/**
 * `/nowplaying`'s embed: title + artist, thumbnail, and a rendered progress bar (or a
 * "🔴 Live" description for streams).
 * @param {import("../../../client/Bot.js").default} client
 * @param {object} track - The currently playing Kazagumo track.
 * @param {number} positionMs - Current playback position, in milliseconds.
 * @returns {import("discord.js").EmbedBuilder}
 */
export default function buildNowPlayingEmbed(client, track, positionMs) {
  // Deliberately title + artist only, no source icon — unlike SongAddedEmbed,
  // which still shows one.
  const embed = new EmbedBuilder().setTitle(formatTrackTitle(track)).setColor(PRIMARY_COLOR);

  if (track.uri) embed.setURL(track.uri);
  if (track.thumbnail) embed.setThumbnail(track.thumbnail);

  if (track.requester) {
    embed.setAuthor({
      name: track.requester.username,
      iconURL: track.requester.displayAvatarURL(),
    });
  }

  if (track.isStream) {
    return embed.setDescription("🔴 Live");
  }

  return embed.setDescription(
    `${renderProgressBar(client, positionMs, track.length)} ${formatDuration(positionMs)}/${formatDuration(track.length)}`
  );
}
