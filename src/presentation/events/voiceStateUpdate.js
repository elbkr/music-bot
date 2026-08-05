import Event from "./base/Event.js";

/**
 * Rebuilds the "leave when everyone leaves" behavior lost in the Lavalink
 * pivot (Lavalink has no concept of Discord voice-channel occupancy). Only
 * reacts to state changes in the bot's own voice channel — cheap to check,
 * and avoids doing work for every voice event in every channel of every
 * guild. Actual scheduling/cancellation lives in QueueService, keeping this
 * listener a thin "detect the Discord event, delegate to domain" adapter.
 */
export default class VoiceStateUpdateEvent extends Event {
  constructor() {
    super({ name: "voiceStateUpdate" });
  }

  /**
   * @param {import("discord.js").VoiceState} oldState
   * @param {import("discord.js").VoiceState} newState
   * @returns {Promise<void>}
   */
  async exec(oldState, newState) {
    const guild = oldState.guild ?? newState.guild;
    const queueService = this.client.queueService;

    const voiceChannelId = queueService.getVoiceChannelId(guild.id);
    if (!voiceChannelId) return;

    if (oldState.channelId !== voiceChannelId && newState.channelId !== voiceChannelId) {
      return;
    }

    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return;

    const hasListeners = voiceChannel.members.some((member) => !member.user.bot);

    if (hasListeners) {
      queueService.cancelEmptyChannelDisconnect(guild.id);
    } else {
      queueService.scheduleEmptyChannelDisconnect(guild.id);
    }
  }
}
