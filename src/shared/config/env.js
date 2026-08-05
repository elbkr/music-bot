const REQUIRED_VARS = ["TOKEN", "MONGO", "CLIENT_ID"];

/**
 * Fails fast, with a clear message, instead of the old behavior of letting
 * `undefined` silently propagate into `client.login(undefined)` /
 * `mongoose.connect(undefined)` / `new REST().setToken(undefined)` and
 * surfacing as a confusing error several layers downstream.
 *
 * Lavalink settings are optional and default to a local node, matching the
 * defaults in LAVALINK_SETUP.md's application.yml. EMOJIS_GUILD_ID is also
 * optional — EmoteService falls back to Unicode emojis when it's unset.
 * @returns {{
 *   token: string,
 *   mongoUri: string,
 *   clientId: string,
 *   emojisGuildId: ?string,
 *   lavalink: {name: string, host: string, port: number, password: string, secure: boolean}
 * }}
 * @throws {Error} When any of `TOKEN`, `MONGO`, `CLIENT_ID` is missing.
 */
export default function loadEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. Check your .env file.`
    );
  }

  return {
    token: process.env.TOKEN,
    mongoUri: process.env.MONGO,
    clientId: process.env.CLIENT_ID,
    emojisGuildId: process.env.EMOJIS_GUILD_ID || null,
    lavalink: {
      name: process.env.LAVALINK_NAME || "main",
      host: process.env.LAVALINK_HOST || "localhost",
      port: Number(process.env.LAVALINK_PORT || 2333),
      password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
      secure: process.env.LAVALINK_SECURE === "true",
    },
  };
}
