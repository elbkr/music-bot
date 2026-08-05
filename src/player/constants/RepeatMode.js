/**
 * Our own repeat-mode vocabulary, deliberately NOT the audio engine's.
 *
 * The previous iteration had LoopCommand importing `QueueRepeatMode` straight
 * from "discord-player", which meant swapping the audio engine broke a
 * presentation-layer file. Commands speak this enum; QueueService is the only
 * place that translates it into whatever the current engine expects.
 * @readonly
 * @enum {string}
 */
const RepeatMode = Object.freeze({
  OFF: "off",
  TRACK: "track",
  QUEUE: "queue",
});

export default RepeatMode;
