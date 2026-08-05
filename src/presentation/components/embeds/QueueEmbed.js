import { EmbedBuilder } from "discord.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";

const TRACKS_PER_PAGE = 10;

/**
 * Renders a track as a Markdown link when it has a `uri`, else its plain formatted title.
 * @param {object} track - A Kazagumo track (or track-shaped object).
 * @returns {string}
 */
const link = (track) =>
  track.uri ? `[${formatTrackTitle(track)}](${track.uri})` : formatTrackTitle(track);

/**
 * Builds one embed per page of upcoming tracks. Always returns at least one
 * embed (an "empty queue" page) so callers never have to special-case zero
 * pages.
 * @param {object|null} currentTrack - The currently playing track, or `null`.
 * @param {object[]} upcomingTracks - Tracks queued after the current one.
 * @param {?string} guildIconURL
 * @returns {import("discord.js").EmbedBuilder[]}
 */
export function buildQueueEmbeds(currentTrack, upcomingTracks, guildIconURL) {
  const nowPlayingLine = currentTrack ? `**Now playing**\n${link(currentTrack)}\n\n` : "";

  const base = () =>
    new EmbedBuilder().setTitle("Songs list").setColor(PRIMARY_COLOR).setThumbnail(guildIconURL);

  if (upcomingTracks.length === 0) {
    return [base().setDescription(`${nowPlayingLine}The queue is empty.`)];
  }

  const pages = [];

  for (let start = 0; start < upcomingTracks.length; start += TRACKS_PER_PAGE) {
    const list = upcomingTracks
      .slice(start, start + TRACKS_PER_PAGE)
      .map((track, i) => `${start + i + 1}. ${link(track)}`)
      .join("\n");

    pages.push(base().setDescription(`${nowPlayingLine}${list}`));
  }

  return pages;
}
