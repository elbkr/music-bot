import { handleTrackFailure } from "./support.js";

/**
 * Kazagumo `playerResolveError` — a queued track (typically a Spotify/Apple
 * Music entry that must be bridged to a playable source) could not be
 * resolved. This is the Lavalink-era equivalent of the old ERR_NO_RESULT
 * bridging failures, and the most likely symptom of an outdated or
 * misconfigured YouTube source plugin.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer, track: object, message?: string) => void}
 */
export default function createOnPlayerResolveError(client) {
  return (player, track, message) => {
    handleTrackFailure(client, player, {
      reason: message ?? "could not resolve a playable source",
      trackTitle: track?.title,
    });
  };
}
