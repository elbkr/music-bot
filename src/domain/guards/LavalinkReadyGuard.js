import Guard from "./Guard.js";

/**
 * Audio now depends on an external Lavalink server. Without this guard,
 * every music command fails with a confusing generic error whenever that
 * server is down or still starting up. New surface introduced by the
 * Lavalink pivot — there was no equivalent failure mode when extraction
 * happened in-process.
 */
export default class LavalinkReadyGuard extends Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../client/Bot.js").default}} context
   * @returns {Promise<{ok: boolean, message?: string}>}
   */
  async check(interaction, context) {
    if (context.client.audioPlayerManager.hasAvailableNode()) {
      return { ok: true };
    }

    return {
      ok: false,
      message:
        "🔌 I can't reach my audio server right now, so playback is unavailable. If you're self-hosting, check that Lavalink is running (see LAVALINK_SETUP.md).",
    };
  }
}
