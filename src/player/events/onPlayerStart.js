import { notify, resetErrorStreak, resetSkipVotes } from "./support.js";
import { formatTrackTitle } from "../../shared/format/track.js";
import Emojis from "../../domain/constants/Emojis.js";

/**
 * Kazagumo `playerStart` listener factory.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer, track: object) => Promise<void>}
 */
export default function createOnPlayerStart(client) {
  return async (player, track) => {
    // A track actually started, so reset the circuit breaker — only a
    // genuine consecutive-failure streak should trip it, not isolated
    // failures scattered through a long, mostly-healthy queue.
    resetErrorStreak(player);

    // New track, fresh vote — votes cast for the previous track (whether the
    // threshold was reached or it just naturally ended) must not carry over.
    resetSkipVotes(player);

    // Respects the /announce toggle. Without this check, AnnounceCommand
    // would update the database but have no actual effect on behavior.
    const guildConfig = await client.guildRepository.findOrCreate(player.guildId);
    if (guildConfig.announcements === false) return;

    notify(
      client,
      player,
      `${client.emoteService.get(Emojis.PLAY)} Now playing **${formatTrackTitle(track)}**`
    );
  };
}
