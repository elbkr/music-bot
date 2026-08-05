import { ActivityType, Client, GatewayIntentBits, Partials } from "discord.js";
import connect from "../database/connect.js";
import GuildRepository from "../database/repositories/GuildRepository.js";
import UserRepository from "../database/repositories/UserRepository.js";
import AudioPlayerManager from "../player/AudioPlayerManager.js";
import QueueService from "../player/QueueService.js";
import LogService from "../domain/services/LogService.js";
import EmoteService from "../domain/services/EmoteService.js";
import CommandRegistry from "../presentation/commands/CommandRegistry.js";
import EventRegistry from "../presentation/events/EventRegistry.js";
import Logger from "../shared/logger/Logger.js";

/**
 * The bot's composition root. Extends discord.js's `Client` and wires up every subsystem
 * (database repositories, the audio engine, presentation-layer registries) as properties
 * on the instance, so any command/event/guard can reach them via `this.client.<service>`.
 * @extends Client
 */
export default class Bot extends Client {
  /**
   * @param {object} [options]
   * @param {object} [options.lavalink] - Passed through to `AudioPlayerManager`.
   * @param {?string} [options.emojisGuildId] - Passed through to `EmoteService`.
   */
  constructor({ lavalink, emojisGuildId } = {}) {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Message, Partials.Reaction],
      allowedMentions: { parse: ["roles", "users"], repliedUser: false },
    });

    this.logger = Logger;
    this.guildRepository = new GuildRepository();
    this.userRepository = new UserRepository();
    this.audioPlayerManager = new AudioPlayerManager(this, { lavalink });
    this.queueService = new QueueService(this.audioPlayerManager);
    this.logService = new LogService(this);
    this.emoteService = new EmoteService(this, { guildId: emojisGuildId });
    this.commandRegistry = new CommandRegistry(this);
    this.eventRegistry = new EventRegistry(this);

    this.on("interactionCreate", (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commandRegistry.commands.get(interaction.commandName);
      if (!command) return;

      command.run(interaction);
    });
  }

  /**
   * Connects to MongoDB, initializes the audio engine, loads commands/events, and logs
   * into Discord. Call once at process startup.
   * @param {object} options
   * @param {string} options.token - Discord bot token.
   * @param {string} options.mongoUri - MongoDB connection string.
   * @returns {Promise<string>} The login token, per discord.js's `Client#login`.
   */
  async start({ token, mongoUri }) {
    await connect(mongoUri, {
      client: this,
      audioPlayerManager: this.audioPlayerManager,
    });

    await this.audioPlayerManager.initialize();
    await this.commandRegistry.loadAll();
    await this.eventRegistry.loadAll();

    this.once("clientReady", async () => {
      this.logger.log(`Connected as ${this.user.tag}`, { color: "green", tag: "Ready" });

      this.user.setActivity(`${this.guilds.cache.size} servers`, {
        type: ActivityType.Watching,
      });

      await this.emoteService.initialize();
      await this.commandRegistry.registerGlobalCommands();
    });

    return this.login(token);
  }
}
