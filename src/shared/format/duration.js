/**
 * Single duration formatter for the whole app. Replaces the four competing
 * mechanisms the original audit flagged (`moment`, `seconds-formater`,
 * `pretty-ms`, and the hand-rolled `Utils.readTime`).
 *
 * Lavalink reports track lengths and positions in milliseconds.
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} `"m:ss"`, or `"h:mm:ss"` once past an hour. `"0:00"` for invalid input.
 */
export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pad = (n) => String(n).padStart(2, "0");

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/**
 * Sums an array of tracks' `length` values into a formatted total.
 * @param {Array<{length?: number}>} tracks
 * @returns {string}
 */
export function formatTotalDuration(tracks) {
  return formatDuration(tracks.reduce((total, track) => total + (track.length ?? 0), 0));
}
