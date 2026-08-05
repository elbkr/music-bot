import { Kazagumo } from "kazagumo";
import { Connectors, Constants } from "shoukaku";
import registerPlayerEvents from "./events/index.js";

/**
 * The only file in the codebase allowed to import "kazagumo"/"shoukaku"
 * directly. Everything else (QueueService, commands, event listeners)
 * reaches the engine through this manager.
 *
 * Audio is now handled by a Lavalink server (an external Java process) via
 * Kazagumo (queue layer) on top of Shoukaku (Lavalink client). Nothing is
 * extracted or transcoded inside this Node process anymore — no ffmpeg, no
 * opus binding, no YouTube cipher handling. That work moved to Lavalink and
 * its plugins, which is the whole point of the pivot: extraction breakage is
 * fixed by updating a server-side plugin rather than by shipping new bot code.
 *
 * See LAVALINK_SETUP.md — the bot cannot play audio without a reachable
 * Lavalink node.
 */
export default class AudioPlayerManager {
  /**
   * @param {import("../client/Bot.js").default} client
   * @param {object} [options]
   * @param {Array<{name: string, url: string, auth: string, secure: boolean}>} [options.nodes]
   *        Explicit Shoukaku node list. When omitted, a single node is built from `lavalink`.
   * @param {object} [options.lavalink] - Connection settings for the default single node.
   * @param {string} [options.lavalink.name]
   * @param {string} [options.lavalink.host]
   * @param {number} [options.lavalink.port]
   * @param {string} [options.lavalink.password]
   * @param {boolean} [options.lavalink.secure]
   */
  constructor(client, { nodes, lavalink } = {}) {
    this.client = client;

    const nodeList = nodes ?? [
      {
        name: lavalink?.name ?? "main",
        url: `${lavalink?.host ?? "localhost"}:${lavalink?.port ?? 2333}`,
        auth: lavalink?.password ?? "youshallnotpass",
        secure: lavalink?.secure ?? false,
      },
    ];

    this.kazagumo = new Kazagumo(
      {
        // Bridged/searched results resolve through YouTube Music where the
        // Lavalink YouTube plugin supports it — same "official audio, not
        // music videos/remixes" goal as the previous engine's ytmusic bridge
        // mode, now enforced server-side.
        defaultSearchEngine: "youtube_music",
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(client),
      nodeList
    );

    this._eventsRegistered = false;
  }

  /**
   * Wires up Kazagumo/Shoukaku event listeners and begins connecting to the configured
   * Lavalink node(s). Safe to call multiple times — only registers listeners once.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._eventsRegistered) return;

    registerPlayerEvents(this.client, this.kazagumo);
    this._eventsRegistered = true;

    this.client.logger?.log("Lavalink client initialized, connecting to node(s)...", {
      tag: "Player",
    });
  }

  /**
   * @param {string} guildId
   * @returns {import("kazagumo").KazagumoPlayer|undefined}
   */
  getPlayer(guildId) {
    return this.kazagumo.getPlayer(guildId);
  }

  /**
   * @returns {boolean} `true` once at least one Lavalink node is connected and usable.
   */
  hasAvailableNode() {
    for (const node of this.kazagumo.shoukaku.nodes.values()) {
      if (node.state === Constants.State.CONNECTED) return true;
    }
    return false;
  }
}
