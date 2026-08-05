import { handleTrackFailure } from "./support.js";

/**
 * Kazagumo `playerStuck` — Lavalink received no audio frames for the
 * configured threshold. Treated as a track failure so it feeds the same
 * circuit breaker; a stuck-loop is just as spammy as an exception-loop.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer, data: {thresholdMs?: number}) => void}
 */
export default function createOnPlayerStuck(client) {
  return (player, data) => {
    handleTrackFailure(client, player, {
      reason: `stuck for ${data?.thresholdMs ?? "?"}ms with no audio frames`,
      trackTitle: player.queue.current?.title,
    });
  };
}
