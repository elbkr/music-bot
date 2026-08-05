/**
 * Kazagumo `playerClosed` — the voice websocket closed (bot disconnected,
 * moved, kicked, or the connection dropped).
 *
 * Replaces the legacy clientDisconnect.js, which was an empty stub that did
 * nothing — the "hanging voice connection" bug from the original audit.
 * Destroying the player here guarantees no orphaned queue survives a lost
 * connection, whatever the cause.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer, data: {code?: number}) => void}
 */
export default function createOnPlayerClosed(client) {
  return (player, data) => {
    client.logger.warn(
      `Voice connection closed in guild ${player.guildId} (code ${data?.code ?? "unknown"}), destroying player.`,
      { tag: "Player" }
    );

    player.queue.clear();
    Promise.resolve(player.destroy()).catch(() => {});
  };
}
