/**
 * Base class for every access-control check used by commands. A guard is a single-
 * responsibility class: it inspects the interaction/context and either passes or denies,
 * optionally attaching resolved data (e.g. `context.voiceChannel`) for downstream guards
 * and `exec()` to reuse.
 *
 * Guards can be used two ways:
 *  - as a blocking gate, listed in a command's `guards`/`extraGuards` — `Command.run()`
 *    calls `check()` on each in order and denies the interaction on the first failure.
 *  - called directly, `await guard.check(interaction, context)`, as a plain bypass check
 *    inside `exec()` — used where guard *logic* is needed without guard *blocking* (see
 *    `SkipCommand`'s DJ-bypass-or-vote branch).
 */
export default class Guard {
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {object} context - mutable per-invocation context built by Command.buildContext()
   * @returns {Promise<{ok: boolean, message?: string}>} `message` is required when `ok` is
   *          `false` — it's shown to the user as the denial reason.
   * @throws {Error} Always, in the base class — subclasses must override this method.
   */
  async check(interaction, context) {
    throw new Error(`${this.constructor.name} must implement check()`);
  }
}
