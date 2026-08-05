import "dotenv/config";
import loadEnv from "./src/shared/config/env.js";
import Bot from "./src/client/Bot.js";

/**
 * Process entry point: loads and validates environment variables, constructs the bot, and
 * starts it. See `LAVALINK_SETUP.md` for the required companion processes (MongoDB,
 * Lavalink) this depends on.
 */
const env = loadEnv();

export const client = new Bot({ lavalink: env.lavalink, emojisGuildId: env.emojisGuildId });

(async () => await client.start(env))();
