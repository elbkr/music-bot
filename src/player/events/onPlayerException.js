import { handleTrackFailure } from "./support.js";

/**
 * Kazagumo `playerException` — Lavalink failed to play the current track.
 * Logs only the exception message, not the whole payload: Lavalink
 * exceptions carry nested cause/stack data that floods the console.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer, data: {exception?: {message?: string, cause?: string}}) => void}
 */
export default function createOnPlayerException(client) {
  return (player, data) => {
    handleTrackFailure(client, player, {
      reason: data?.exception?.message ?? data?.exception?.cause ?? "unknown exception",
      trackTitle: player.queue.current?.title,
    });
  };
}
