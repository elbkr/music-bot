/**
 * Canonical emoji names — must match both the custom emoji names uploaded to
 * the EMOJIS_GUILD_ID guild AND the filenames under resource/emojis/
 * (without extension). EmoteService looks these up by name; commands never
 * hardcode emoji strings.
 *
 * Unlike the legacy loadEmotes(), which stored lookup keys with underscores
 * replaced by hyphens (so "vol_high.png" was looked up as "vol-high") for no
 * clear reason — and hyphens aren't even legal in Discord custom emoji names
 * — this uses one consistent underscore convention everywhere: the Discord
 * emoji name, the resource filename, and the lookup key are all identical.
 */
const Emojis = Object.freeze({
  PLAY: "play",
  PAUSE: "pause",
  RESUME: "resume",
  STOP: "stop",
  SKIP: "skip",
  REPLAY: "replay",
  SHUFFLE: "shuffle",
  QUEUE: "queue",
  SEARCH: "search",
  FAV: "fav",
  NOTFOUND: "notfound",
  NOMIC: "nomic",
  LOOPED: "looped",
  NOLOOP: "noloop",
  VOL_HIGH: "vol_high",
  VOL_MID: "vol_mid",
  VOL_LOW: "vol_low",
  VOL_MUTE: "vol_mute",
  LINE: "line",
  SLIDER: "slider",
  YOUTUBE: "youtube",
  YOUTUBE_MUSIC: "youtube_music",
  SPOTIFY: "spotify",
  APPLE_MUSIC: "apple_music",
  SOUNDCLOUD: "soundcloud",
});

/**
 * Best-effort Unicode approximations, used only when a custom emoji isn't
 * configured/found. These are intentionally plain — the point of the custom
 * emoji system is to look better than this.
 */
export const DEFAULT_EMOJI_FALLBACKS = Object.freeze({
  [Emojis.PLAY]: "▶️",
  [Emojis.PAUSE]: "⏸️",
  [Emojis.RESUME]: "▶️",
  [Emojis.STOP]: "⏹️",
  [Emojis.SKIP]: "⏭️",
  [Emojis.REPLAY]: "🔂",
  [Emojis.SHUFFLE]: "🔀",
  [Emojis.QUEUE]: "📃",
  [Emojis.SEARCH]: "🔍",
  [Emojis.FAV]: "⭐",
  [Emojis.NOTFOUND]: "❌",
  [Emojis.NOMIC]: "🚫",
  [Emojis.LOOPED]: "🔁",
  [Emojis.NOLOOP]: "🚫",
  [Emojis.VOL_HIGH]: "🔊",
  [Emojis.VOL_MID]: "🔉",
  [Emojis.VOL_LOW]: "🔈",
  [Emojis.VOL_MUTE]: "🔇",
  [Emojis.LINE]: "▬",
  [Emojis.SLIDER]: "🔘",
  [Emojis.YOUTUBE]: "▶️",
  [Emojis.YOUTUBE_MUSIC]: "🎵",
  [Emojis.SPOTIFY]: "🎧",
  [Emojis.APPLE_MUSIC]: "🍎",
  [Emojis.SOUNDCLOUD]: "☁️",
});

/** Kazagumo/Lavalink track.sourceName -> Emojis key, for source icons in embeds. */
export const SOURCE_EMOJI_NAMES = Object.freeze({
  youtube: Emojis.YOUTUBE,
  ytmusic: Emojis.YOUTUBE_MUSIC,
  soundcloud: Emojis.SOUNDCLOUD,
  spotify: Emojis.SPOTIFY,
  applemusic: Emojis.APPLE_MUSIC,
});

export default Emojis;
