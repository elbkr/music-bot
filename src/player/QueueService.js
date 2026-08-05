import RepeatMode from "./constants/RepeatMode.js";
import PlaySource from "./constants/PlaySource.js";
import { notify, SKIP_VOTES_KEY } from "./events/support.js";

const EMPTY_CHANNEL_TIMEOUT_MS = 3 * 60 * 1000;
const EMPTY_CHANNEL_TIMEOUT_KEY = "emptyChannelTimeout";

/** Our RepeatMode -> Kazagumo's loop vocabulary. The only place this mapping exists. */
const LOOP_MODES = {
  [RepeatMode.OFF]: "none",
  [RepeatMode.TRACK]: "track",
  [RepeatMode.QUEUE]: "queue",
};

/**
 * Our PlaySource -> Kazagumo search options. The only place this mapping
 * exists. `engine` is Kazagumo's own whitelisted option (youtube/
 * youtube_music/soundcloud only); `source` is a raw prefix override that
 * bypasses it entirely — verified against Kazagumo's actual search()
 * implementation, not assumed — which is how Spotify/Apple Music search
 * (via lavasrc-plugin's `spsearch:`/`amsearch:` prefixes) is reachable at
 * all despite not being one of Kazagumo's built-in engine choices.
 */
const SEARCH_OPTIONS_BY_SOURCE = {
  [PlaySource.YOUTUBE_MUSIC]: { engine: "youtube_music" },
  [PlaySource.YOUTUBE]: { engine: "youtube" },
  [PlaySource.SOUNDCLOUD]: { engine: "soundcloud" },
  [PlaySource.SPOTIFY]: { source: "spsearch:" },
  [PlaySource.APPLE_MUSIC]: { source: "amsearch:" },
};

/**
 * Bridge between commands and the Lavalink client. Commands never touch
 * AudioPlayerManager.kazagumo directly — they call this service, which is
 * what keeps engine imports confined to this subsystem.
 *
 * Public method names/signatures are unchanged from the discord-player
 * implementation wherever possible, so most command classes were untouched
 * by the Lavalink migration.
 */
export default class QueueService {
  /** @param {import("./AudioPlayerManager.js").default} audioPlayerManager */
  constructor(audioPlayerManager) {
    this.audioPlayerManager = audioPlayerManager;
  }

  /**
   * Searches, queues, and starts playback.
   * @param {string} [source] one of PlaySource; omit for the engine default
   *        (YouTube Music). Ignored for direct URL queries — Kazagumo routes
   *        URLs around any engine/source override automatically.
   * @param {object} options
   * @param {import("discord.js").VoiceBasedChannel} options.voiceChannel
   * @param {import("discord.js").TextBasedChannel} options.textChannel - Where playback
   *        lifecycle notifications (now playing, queue ended, errors) are sent.
   * @param {string} options.query - Search term or direct URL.
   * @param {import("discord.js").User} options.requestedBy - Attached to the track(s) as
   *        `requester`, surfaced in embeds.
   * @param {string} [options.source] - One of `PlaySource`.
   * @returns {Promise<{track, tracks, playlistName: string|null, isPlaylist: boolean}|null>}
   *          null when the query matched nothing.
   */
  async play({ voiceChannel, textChannel, query, requestedBy, source }) {
    const { kazagumo } = this.audioPlayerManager;

    const result = await kazagumo.search(query, {
      requester: requestedBy,
      ...(SEARCH_OPTIONS_BY_SOURCE[source] ?? {}),
    });
    if (!result.tracks.length) return null;

    const player = await kazagumo.createPlayer({
      guildId: voiceChannel.guild.id,
      voiceId: voiceChannel.id,
      textId: textChannel.id,
      volume: 100,
      deaf: true,
    });

    const isPlaylist = result.type === "PLAYLIST";
    const tracks = isPlaylist ? result.tracks : [result.tracks[0]];

    // KazagumoQueue.add() calls `.shift()` on the array we pass it whenever
    // the queue was empty (it uses the removed element as `queue.current`).
    // Since JS arrays are passed by reference, that silently mutates our own
    // `tracks` — emptying it entirely for a single-track play — unless we
    // hand it a throwaway copy. Confirmed against the installed library
    // source, not assumed: this is what was making `tracks[0]` (returned
    // below as `result.track`) undefined, crashing SongAddedEmbed on
    // `.title`. Playback itself was never affected, only our own reference.
    player.queue.add([...tracks]);

    if (!player.playing && !player.paused) {
      await player.play();
    }

    return {
      track: tracks[0],
      tracks,
      playlistName: isPlaylist ? (result.playlistName ?? null) : null,
      isPlaylist,
    };
  }

  /**
   * @param {string} guildId
   * @returns {import("kazagumo").KazagumoPlayer|undefined}
   */
  getPlayer(guildId) {
    return this.audioPlayerManager.getPlayer(guildId);
  }

  /**
   * @param {string} guildId
   * @returns {boolean} Whether a player currently exists for this guild.
   */
  hasQueue(guildId) {
    return Boolean(this.getPlayer(guildId));
  }

  /**
   * Presentation never reaches into the player itself.
   * @param {string} guildId
   * @returns {object|null} The currently playing track, or `null`.
   */
  getCurrentTrack(guildId) {
    return this.getPlayer(guildId)?.queue.current ?? null;
  }

  /**
   * @param {string} guildId
   * @returns {object[]} Upcoming tracks (excludes the current one).
   */
  getUpcomingTracks(guildId) {
    const player = this.getPlayer(guildId);
    return player ? [...player.queue] : [];
  }

  /**
   * @param {string} guildId
   * @returns {number} Playback position of the current track, in milliseconds.
   */
  getPlaybackPosition(guildId) {
    return this.getPlayer(guildId)?.position ?? 0;
  }

  /**
   * Immediately skips the current track, bypassing any vote.
   * @param {string} guildId
   * @returns {object|null} The skipped track, or `null` if nothing was playing.
   */
  skip(guildId) {
    const player = this.getPlayer(guildId);
    if (!player?.queue.current) return null;

    const skipped = player.queue.current;
    player.skip();
    return skipped;
  }

  /**
   * Registers a majority vote-to-skip. Bypassing the vote entirely (DJ role,
   * Manage Guild, or being alone in the channel) is DjRoleGuard's job, called
   * directly by SkipCommand before this — this method is only reached for
   * members who actually need to vote.
   *
   * Threshold is a simple majority: `ceil(nonBotMembers / 2)`, so 2 members
   * needs 1 vote (50%), 3 needs 2 (~67%), matching "50%+" — a raw `> 50%`
   * would require ceil(n/2 + 1) and make 2-person channels unskippable by
   * vote at all. Votes live on `player.data` (a Set of user IDs, one vote
   * per user no matter how many times they run /skip) and are cleared by
   * onPlayerStart on every track change, not just after a successful vote.
   *
   * @param {string} guildId
   * @param {string} userId - The voting member's user ID.
   * @param {import("discord.js").VoiceBasedChannel} voiceChannel - The member's current
   *        voice channel, used to compute the required majority.
   * @returns {{ok: boolean, skipped: boolean, alreadyVoted: boolean, votes: number, required: number, track: object|null}}
   */
  registerSkipVote(guildId, userId, voiceChannel) {
    const player = this.getPlayer(guildId);
    if (!player?.queue.current) return { ok: false };

    let votes = player.data.get(SKIP_VOTES_KEY);
    if (!votes) {
      votes = new Set();
      player.data.set(SKIP_VOTES_KEY, votes);
    }

    const alreadyVoted = votes.has(userId);
    votes.add(userId);

    const nonBotMembers = voiceChannel.members.filter((member) => !member.user.bot).size;
    const required = Math.max(1, Math.ceil(nonBotMembers / 2));
    const voteCount = votes.size;

    if (voteCount >= required) {
      const skipped = player.queue.current;
      player.data.delete(SKIP_VOTES_KEY);
      player.skip();
      return { ok: true, skipped: true, alreadyVoted, votes: voteCount, required, track: skipped };
    }

    return { ok: true, skipped: false, alreadyVoted, votes: voteCount, required, track: null };
  }

  /**
   * @param {string} guildId
   * @param {number} volume - 0-200.
   * @returns {Promise<number|null>} The applied volume, or `null` if no player exists.
   */
  async setVolume(guildId, volume) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    await player.setVolume(volume);
    return volume;
  }

  /**
   * @param {string} guildId
   * @param {string} mode - One of `RepeatMode`.
   * @returns {string|null} The applied mode, or `null` if no player exists.
   */
  setRepeatMode(guildId, mode) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    player.setLoop(LOOP_MODES[mode] ?? "none");
    return mode;
  }

  /**
   * @param {string} guildId
   * @param {number} ms position in milliseconds. Kazagumo's JSDoc claims
   * seconds, but its implementation clamps against `track.length` and calls
   * Shoukaku's `seekTo`, both of which are milliseconds — verified in the
   * installed source, not the docs.
   * @returns {Promise<boolean>} `false` if there's no player or no current track.
   */
  async seek(guildId, ms) {
    const player = this.getPlayer(guildId);
    if (!player?.queue.current) return false;

    await player.seek(ms);
    return true;
  }

  /**
   * Replays the previously played track.
   * @param {string} guildId
   * @returns {Promise<object|null>} The track that's now playing again, or `null` if
   *          there's no player or no previous track.
   */
  async previous(guildId) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    const previous = player.getPrevious(true);
    if (!previous) return null;

    await player.play(previous, { replaceCurrent: true });
    return previous;
  }

  /**
   * @param {string} guildId
   * @returns {boolean|null} `true` on success, `null` if no player exists.
   */
  pause(guildId) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    player.pause(true);
    return true;
  }

  /**
   * @param {string} guildId
   * @returns {boolean|null} `true` on success, `null` if no player exists.
   */
  resume(guildId) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    player.pause(false);
    return true;
  }

  /**
   * @param {string} guildId
   * @returns {boolean}
   */
  isPaused(guildId) {
    return Boolean(this.getPlayer(guildId)?.paused);
  }

  /**
   * @param {string} guildId
   * @returns {string|null} Voice channel id the player is currently connected to, or null.
   */
  getVoiceChannelId(guildId) {
    return this.getPlayer(guildId)?.voiceId ?? null;
  }

  /**
   * Lavalink has no concept of Discord voice-channel occupancy — that's a
   * discord.js `voiceStateUpdate` concern, so the presentation layer detects
   * "channel is empty" and calls these two methods. The timeout handle lives
   * on `player.data` (Kazagumo's own per-player store) rather than a
   * module-level map, so it's automatically discarded whenever the player
   * itself is destroyed — no separate cleanup path to forget, unlike the
   * legacy `clientDisconnect.js` empty stub the original audit flagged.
   * @param {string} guildId
   * @returns {void}
   */
  scheduleEmptyChannelDisconnect(guildId) {
    const player = this.getPlayer(guildId);
    if (!player || player.data.get(EMPTY_CHANNEL_TIMEOUT_KEY)) return;

    const client = this.audioPlayerManager.client;

    const handle = setTimeout(async () => {
      player.data.delete(EMPTY_CHANNEL_TIMEOUT_KEY);

      client.logger.log(
        `Voice channel empty for ${EMPTY_CHANNEL_TIMEOUT_MS / 1000}s in guild ${guildId}, disconnecting.`,
        { tag: "Player" }
      );

      notify(client, player, "👋 Left the voice channel — no one was around.");

      player.queue.clear();
      await player.destroy().catch(() => {});
    }, EMPTY_CHANNEL_TIMEOUT_MS);

    player.data.set(EMPTY_CHANNEL_TIMEOUT_KEY, handle);
  }

  /**
   * @param {string} guildId
   * @returns {void}
   */
  cancelEmptyChannelDisconnect(guildId) {
    const player = this.getPlayer(guildId);
    const handle = player?.data.get(EMPTY_CHANNEL_TIMEOUT_KEY);
    if (!handle) return;

    clearTimeout(handle);
    player.data.delete(EMPTY_CHANNEL_TIMEOUT_KEY);
  }

  /**
   * @param {string} guildId
   * @returns {boolean} `false` if no player exists.
   */
  shuffle(guildId) {
    const player = this.getPlayer(guildId);
    if (!player) return false;

    player.queue.shuffle();
    return true;
  }

  /**
   * Jumps to the track at 1-indexed `position` in the upcoming queue.
   * @param {string} guildId
   * @param {number} position - 1-indexed position in the upcoming queue.
   * @returns {object|null} The track jumped to, or `null` if `position` is out of range or
   *          no player exists.
   */
  jump(guildId, position) {
    const player = this.getPlayer(guildId);
    if (!player) return null;

    const track = player.queue[position - 1];
    if (!track) return null;

    // Drop everything before the target via the queue's own remove() so its
    // change events still fire, then end the current track so the target
    // becomes next.
    for (let i = 0; i < position - 1; i += 1) {
      player.queue.remove(0);
    }
    player.skip();

    return track;
  }

  /**
   * Clears the queue and destroys the player, disconnecting from voice.
   * @param {string} guildId
   * @returns {Promise<boolean>} `false` if no player existed.
   */
  async stop(guildId) {
    const player = this.getPlayer(guildId);
    if (!player) return false;

    player.queue.clear();
    await player.destroy();
    return true;
  }
}
