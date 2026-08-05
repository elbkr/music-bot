/**
 * Our own vocabulary for "where to search," kept separate from Kazagumo's
 * `engine`/`source` search options for the same reason RepeatMode is kept
 * separate from the engine's loop vocabulary — QueueService is the only
 * place that translates it, so a future engine swap doesn't ripple into the
 * presentation layer.
 * @readonly
 * @enum {string}
 */
const PlaySource = Object.freeze({
  YOUTUBE_MUSIC: "youtube_music",
  YOUTUBE: "youtube",
  SOUNDCLOUD: "soundcloud",
  SPOTIFY: "spotify",
  APPLE_MUSIC: "applemusic",
});

export default PlaySource;
