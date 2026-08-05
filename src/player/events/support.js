const CONSECUTIVE_ERRORS_KEY = "consecutiveErrors";
export const MAX_CONSECUTIVE_ERRORS = 3;

// Single source of truth for the skip-vote player.data key, shared between
// QueueService (which reads/writes votes) and onPlayerStart (which clears
// them on track change) — same pattern as CONSECUTIVE_ERRORS_KEY above.
export const SKIP_VOTES_KEY = "skipVotes";

/**
 * @param {import("kazagumo").KazagumoPlayer} player
 * @returns {void}
 */
export function resetSkipVotes(player) {
  player?.data?.delete(SKIP_VOTES_KEY);
}

/**
 * Kazagumo players only carry a `textId`, not a channel object, so text
 * channels are resolved lazily from the client cache. Returns null when the
 * channel was deleted or is no longer visible.
 * @param {import("../../client/Bot.js").default} client
 * @param {import("kazagumo").KazagumoPlayer} player
 * @returns {import("discord.js").TextBasedChannel|null}
 */
export function resolveTextChannel(client, player) {
  if (!player?.textId) return null;
  const channel = client.channels.cache.get(player.textId);
  return channel?.isTextBased?.() ? channel : null;
}

/**
 * Fire-and-forget channel send; never let a failed notification break a handler.
 * @param {import("../../client/Bot.js").default} client
 * @param {import("kazagumo").KazagumoPlayer} player
 * @param {string|import("discord.js").MessagePayload|import("discord.js").MessageCreateOptions} payload
 * @returns {void}
 */
export function notify(client, player, payload) {
  const channel = resolveTextChannel(client, player);
  if (!channel) return;
  Promise.resolve(channel.send(payload)).catch(() => {});
}

/**
 * @param {import("kazagumo").KazagumoPlayer} player
 * @returns {void}
 */
export function resetErrorStreak(player) {
  player?.data?.set(CONSECUTIVE_ERRORS_KEY, 0);
}

/**
 * @param {import("kazagumo").KazagumoPlayer} player
 * @returns {{count: number, tripped: boolean}} `tripped` is `true` once `count` reaches
 *          `MAX_CONSECUTIVE_ERRORS`.
 */
export function recordErrorAndCheckStreak(player) {
  const next = (player?.data?.get(CONSECUTIVE_ERRORS_KEY) ?? 0) + 1;
  player?.data?.set(CONSECUTIVE_ERRORS_KEY, next);
  return { count: next, tripped: next >= MAX_CONSECUTIVE_ERRORS };
}

/**
 * Shared failure path for every "this track couldn't play" event
 * (exception / stuck / resolve error).
 *
 * The circuit breaker is carried over from the discord-player era on
 * purpose: Lavalink also advances to the next track on a failed load, so a
 * systemic problem (an outdated YouTube plugin, an expired token, a dead
 * source) can still cannon-fire through an entire playlist and spam the
 * channel. This bounds that blast radius regardless of engine.
 * @param {import("../../client/Bot.js").default} client
 * @param {import("kazagumo").KazagumoPlayer} player
 * @param {object} details
 * @param {string} details.reason - Human-readable failure cause, logged and not shown to users.
 * @param {?string} [details.trackTitle]
 * @param {string} [details.logTag]
 * @returns {void}
 */
export function handleTrackFailure(client, player, { reason, trackTitle, logTag = "Player" }) {
  client.logger.error(
    `Playback failure in guild ${player.guildId} on "${trackTitle ?? "unknown track"}": ${reason}`,
    { tag: logTag }
  );

  const { count, tripped } = recordErrorAndCheckStreak(player);

  if (!tripped) {
    notify(client, player, `⚠️ Couldn't play **${trackTitle ?? "that track"}**, skipping...`);
    return;
  }

  client.logger.error(
    `${count} consecutive playback failures in guild ${player.guildId}, stopping playback to prevent a skip storm.`,
    { tag: logTag }
  );

  notify(
    client,
    player,
    `⚠️ ${count} tracks in a row failed to play — stopping playback so I don't spam the channel. This usually means the Lavalink server or one of its source plugins needs attention.`
  );

  player.queue.clear();
  Promise.resolve(player.destroy()).catch(() => {});
}
