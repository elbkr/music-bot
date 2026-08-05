/**
 * Shoukaku node-level (Lavalink server connection) events.
 *
 * These have no discord-player equivalent — they're new surface introduced
 * by the Lavalink pivot, and they matter operationally: if the node is down,
 * every music command fails, and without these listeners that failure is
 * invisible in the logs. Shoukaku also throws on an unhandled 'error' event,
 * so the error listener is required, not optional.
 * @param {import("../../client/Bot.js").default} client
 * @param {import("shoukaku").Shoukaku} shoukaku
 * @returns {void}
 */
export default function registerNodeEvents(client, shoukaku) {
  shoukaku.on("ready", (name, lavalinkResume, libraryResume) => {
    client.logger.log(
      `Lavalink node "${name}" connected${lavalinkResume || libraryResume ? " (session resumed)" : ""}.`,
      { color: "green", tag: "Lavalink" }
    );
  });

  shoukaku.on("error", (name, error) => {
    client.logger.error(`Lavalink node "${name}" error: ${error?.message ?? error}`, {
      tag: "Lavalink",
    });
  });

  shoukaku.on("close", (name, code, reason) => {
    client.logger.warn(
      `Lavalink node "${name}" websocket closed (code ${code})${reason ? `: ${reason}` : ""}.`,
      { tag: "Lavalink" }
    );
  });

  shoukaku.on("disconnect", (name, count) => {
    client.logger.error(
      `Lavalink node "${name}" disconnected, ${count} player(s) affected. Music commands will fail until it reconnects — is the Lavalink server running? (see LAVALINK_SETUP.md)`,
      { tag: "Lavalink" }
    );
  });

  shoukaku.on("reconnecting", (name, reconnectsLeft, reconnectInterval) => {
    client.logger.warn(
      `Reconnecting to Lavalink node "${name}" in ${reconnectInterval}s (${reconnectsLeft} attempt(s) left).`,
      { tag: "Lavalink" }
    );
  });
}
