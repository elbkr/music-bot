/**
 * Kazagumo `playerDestroy`. Replaces legacy queueDestroyed.js.
 *
 * Log-only: Kazagumo owns the player registry, so unlike the legacy
 * Collection-based tracking there's no parallel app-level map to clean up.
 * @param {import("../../client/Bot.js").default} client
 * @returns {(player: import("kazagumo").KazagumoPlayer) => void}
 */
export default function createOnPlayerDestroy(client) {
  return (player) => {
    client.logger.log(`Player destroyed for guild ${player.guildId}.`, { tag: "Player" });
  };
}
