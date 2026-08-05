/**
 * "Author - Title" display format, used everywhere a track name is shown to
 * the user (embeds and plain-text replies alike) for consistency. Falls back
 * to the bare title when no author is known, and avoids a redundant "Unknown
 * - Title" when the source didn't provide one.
 * @param {{title: string, author?: ?string}} track
 * @returns {string}
 */
export function formatTrackTitle(track) {
  return track.author ? `${track.author} - ${track.title}` : track.title;
}
