import mongoose from "mongoose";
import Logger from "../shared/logger/Logger.js";

let shutdownPromise = null;

/**
 * Establishes the Mongoose connection, wires up connection-state logging,
 * and registers SIGINT/SIGTERM handlers that tear the whole process down in
 * order: stop audio -> destroy the Discord client -> close the Mongo pool.
 *
 * `client` and `audioPlayerManager` are passed in rather than imported, so
 * this module never has a static dependency on discord.js Client or
 * AudioPlayerManager types — it only needs them to expose `.destroy()` /
 * `.player.queues`. That keeps it decoupled even though, per your call,
 * connection setup and shutdown orchestration live in one file. See the
 * chat response for the tradeoff discussion.
 * @param {string} uri - MongoDB connection string.
 * @param {object} [options]
 * @param {import("discord.js").Client} [options.client] - Destroyed on graceful shutdown.
 * @param {import("../player/AudioPlayerManager.js").default} [options.audioPlayerManager] -
 *        Its active Kazagumo players are destroyed on graceful shutdown.
 * @returns {Promise<import("mongoose").Connection>}
 */
export default async function connect(uri, { client, audioPlayerManager } = {}) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("connected", async () => {
    Logger.log(`Connected to MongoDB (latency: ${Math.round(await ping())}ms)`, {
      color: "green",
      tag: "Database",
    });
  });

  mongoose.connection.on("disconnected", () => {
    Logger.error("Disconnected from MongoDB!", { tag: "Database" });
  });

  mongoose.connection.on("error", (err) => {
    Logger.error(`MongoDB connection error\n${err?.stack ?? err}`, { tag: "Database" });
  });

  mongoose.connection.on("reconnected", async () => {
    Logger.log(`Reconnected to MongoDB (latency: ${Math.round(await ping())}ms)`, {
      color: "green",
      tag: "Database",
    });
  });

  await mongoose.connect(uri);

  registerGracefulShutdown({ client, audioPlayerManager });

  return mongoose.connection;
}

/**
 * @returns {Promise<number>} Round-trip latency to MongoDB, in milliseconds.
 */
async function ping() {
  const start = process.hrtime();
  await mongoose.connection.db.command({ ping: 1 });
  const [seconds, nanoseconds] = process.hrtime(start);
  return seconds * 1e3 + nanoseconds / 1e6;
}

/**
 * Registers `SIGINT`/`SIGTERM` handlers that tear the process down in order: destroy
 * active audio players -> destroy the Discord client -> close the Mongo connection pool.
 * Idempotent — a second signal while shutdown is already in flight reuses the same promise
 * rather than starting a second shutdown.
 * @param {object} options
 * @param {import("discord.js").Client} [options.client]
 * @param {import("../player/AudioPlayerManager.js").default} [options.audioPlayerManager]
 * @returns {void}
 */
function registerGracefulShutdown({ client, audioPlayerManager }) {
  const shutdown = (signal) => {
    if (shutdownPromise) return shutdownPromise;

    Logger.warn(`Received ${signal}, starting graceful shutdown...`, { tag: "Process" });

    shutdownPromise = (async () => {
      try {
        // Destroying Kazagumo players also tells Lavalink to tear down its
        // side of each session, so the external server doesn't keep orphaned
        // players alive after this process exits.
        const players = audioPlayerManager?.kazagumo?.players;
        if (players?.size) {
          const count = players.size;
          await Promise.allSettled([...players.values()].map((player) => player.destroy()));
          Logger.warn(`Destroyed ${count} active player(s).`, { tag: "Process" });
        }

        if (client) {
          client.destroy();
          Logger.warn("Discord client destroyed.", { tag: "Process" });
        }

        await mongoose.connection.close(false);
        Logger.warn("Disconnected from MongoDB.", { tag: "Process" });

        Logger.warn("Graceful shutdown complete.", { tag: "Process" });
        process.exit(0);
      } catch (err) {
        Logger.error(`Error during graceful shutdown\n${err?.stack ?? err}`, {
          tag: "Process",
        });
        process.exit(1);
      }
    })();

    return shutdownPromise;
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
