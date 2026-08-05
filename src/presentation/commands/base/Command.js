import { MessageFlags } from "discord.js";

/**
 * Root base class for every slash command. Owns the defer -> guard -> exec ->
 * error lifecycle so individual commands only ever implement `exec()`.
 *
 * `client` is injected onto each instance by {@link CommandRegistry} after
 * construction — commands never receive it via their own constructor.
 */
export default class Command {
  /**
   * @param {object} [options]
   * @param {string} options.name - Slash command name, as registered with Discord.
   * @param {string} [options.description] - Shown in Discord's command picker. Ignored for
   *        non-`CHATINPUT` command types (Discord requires it be `undefined` for those).
   * @param {import("discord.js").ApplicationCommandOptionData[]} [options.options] - Slash
   *        command option/subcommand tree, in `ApplicationCommandOptionData` shape.
   * @param {import("discord-api-types/v10").ApplicationCommandType} [options.type] - Discord
   *        application command type. Defaults to `1` (`CHAT_INPUT`, i.e. a slash command).
   */
  constructor({ name, description = "No description provided", options = [], type = 1 } = {}) {
    this.name = name;
    this.description = type === 1 ? description : undefined;
    this.options = options;
    this.type = type;
  }

  /**
   * Guards run, in order, after `buildContext()` and before `exec()`. The first guard whose
   * `check()` returns `{ ok: false }` short-circuits the command with `deny()`.
   * @returns {import("../../../domain/guards/Guard.js").default[]}
   */
  get guards() {
    return [];
  }

  /**
   * Whether `run()` should call `interaction.deferReply()` before guards/exec run. Almost
   * always `true` — only set `false` for commands fast enough to reply within Discord's
   * 3-second interaction window without deferring.
   * @returns {boolean}
   */
  get deferReply() {
    return true;
  }

  /**
   * Whether the deferred reply (and any `deny()` message) is only visible to the invoking
   * user. Override to `true` for commands whose output is personal (e.g. favorites) or
   * config-only noise not worth broadcasting to the channel.
   * @returns {boolean}
   */
  get ephemeral() {
    return false;
  }

  /**
   * Builds the per-invocation context passed to every guard and to `exec()`. Subclasses
   * (e.g. `MusicCommand`) may extend this — call `super.buildContext()` and add to the
   * returned object — rather than overriding it outright.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<{client: import("../../../client/Bot.js").default, guildConfig: (import("../../../database/models/Guild.model.js").default|null)}>}
   *          `guildConfig` is `null` when the interaction has no `guild` (e.g. a DM).
   */
  async buildContext(interaction) {
    const guildConfig = interaction.guild
      ? await this.client.guildRepository.findOrCreate(interaction.guild.id)
      : null;

    return { client: this.client, guildConfig };
  }

  /**
   * Command-specific logic. Every concrete command implements this. Runs only after every
   * guard in `guards` has passed.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {object} context - The object returned by `buildContext()`.
   * @returns {Promise<void>}
   * @throws {Error} Always, in the base class — subclasses must override this method.
   */
  async exec(interaction, context) {
    throw new Error(`${this.constructor.name} does not implement exec()`);
  }

  /**
   * Entry point invoked by {@link Bot}'s `interactionCreate` router. Do not override — this
   * owns the full defer -> buildContext -> guards -> exec -> catch lifecycle so individual
   * commands never have to repeat that boilerplate.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @returns {Promise<void>}
   */
  async run(interaction) {
    try {
      if (this.deferReply) {
        await interaction.deferReply(this.ephemeral ? { flags: MessageFlags.Ephemeral } : {});
      }

      const context = await this.buildContext(interaction);

      for (const guard of this.guards) {
        const result = await guard.check(interaction, context);
        if (!result.ok) {
          return this.deny(interaction, result.message);
        }
      }

      await this.exec(interaction, context);
    } catch (err) {
      await this.handleError(interaction, err);
    }
  }

  /**
   * Ephemeral rejection reply, used when a guard fails. Works whether or not the interaction
   * has already been deferred.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {string} message - User-facing explanation of why the command was denied.
   * @returns {Promise<import("discord.js").Message|import("discord.js").InteractionResponse>}
   */
  async deny(interaction, message) {
    const payload = { content: message, flags: MessageFlags.Ephemeral };
    return interaction.deferred || interaction.replied
      ? interaction.editReply(payload)
      : interaction.reply(payload);
  }

  /**
   * Last-resort handler for anything `exec()` or a guard throws. Logs the full error
   * server-side and replies with a generic, ephemeral message — never leaks internals to
   * the user. Swallows its own reply failure (e.g. an expired interaction token) since
   * there's nothing further to fall back to.
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {unknown} err
   * @returns {Promise<void>}
   */
  async handleError(interaction, err) {
    this.client?.logger?.error(
      `Unhandled error in command "${this.name}"\n${err?.stack ?? err}`,
      { tag: "Command" }
    );

    const payload = {
      content: "Oops! Something went wrong while running that command.",
      flags: MessageFlags.Ephemeral,
    };

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
    } catch {
      // Interaction token already expired/unreachable — nothing more to do.
    }
  }
}
