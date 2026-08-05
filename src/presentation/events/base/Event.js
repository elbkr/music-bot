/**
 * Root base class for every discord.js client event listener. Mirrors
 * Command's shape (declarative constructor options, `client` injected by the
 * loader, `exec()` implemented by subclasses) for consistency across the
 * presentation layer.
 */
export default class Event {
  /**
   * @param {object} [options]
   * @param {string} options.name - discord.js `Client` event name to listen for (e.g.
   *        `"guildCreate"`, `"voiceStateUpdate"`).
   * @param {boolean} [options.once] - When `true`, registered with `client.once()` instead
   *        of `client.on()` — the listener fires at most one time for the process lifetime.
   */
  constructor({ name, once = false } = {}) {
    this.name = name;
    this.once = once;
  }

  /**
   * Event-specific logic. Every concrete event listener implements this. Arguments are
   * whatever the underlying discord.js event emits (see the discord.js `ClientEvents`
   * type for the exact signature per event name).
   * @param {...unknown} args
   * @returns {Promise<void>}
   * @throws {Error} Always, in the base class — subclasses must override this method.
   */
  async exec(...args) {
    throw new Error(`${this.constructor.name} does not implement exec()`);
  }
}
