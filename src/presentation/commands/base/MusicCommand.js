import Command from "./Command.js";
import LavalinkReadyGuard from "../../../domain/guards/LavalinkReadyGuard.js";
import InVoiceChannelGuard from "../../../domain/guards/InVoiceChannelGuard.js";
import SameVoiceChannelGuard from "../../../domain/guards/SameVoiceChannelGuard.js";
import AllowedVoiceChannelGuard from "../../../domain/guards/AllowedVoiceChannelGuard.js";

const lavalinkReady = new LavalinkReadyGuard();
const inVoiceChannel = new InVoiceChannelGuard();
const sameVoiceChannel = new SameVoiceChannelGuard();
const allowedVoiceChannel = new AllowedVoiceChannelGuard();

/**
 * Base for every command that touches playback. Bakes in the four guards
 * every music command needs — the audio server must be reachable, the caller
 * must be in a voice channel, it must be the same one the bot is already in
 * (prevents voice-channel hijacking: a member in a different channel
 * skipping/stopping a session they aren't part of), and it must be on the
 * server's configured allow-list (if one is set) — and lets subclasses layer
 * on the rest (DjRoleGuard, etc.) via `extraGuards` instead of copy-pasting
 * guard arrays.
 *
 * LavalinkReadyGuard runs first on purpose: if the audio server is down,
 * "I can't reach my audio server" is a far more actionable message than
 * "there is no music playing in this guild".
 */
export default class MusicCommand extends Command {
  /** @returns {import("../../../domain/guards/Guard.js").default[]} */
  get guards() {
    return [
      lavalinkReady,
      inVoiceChannel,
      sameVoiceChannel,
      allowedVoiceChannel,
      ...this.extraGuards,
    ];
  }

  /**
   * Hook for subclasses to layer additional guards (e.g. `DjRoleGuard`) on top of the four
   * baked into every music command, without overriding `guards` and repeating them.
   * @returns {import("../../../domain/guards/Guard.js").default[]}
   */
  get extraGuards() {
    return [];
  }
}
