import MusicCommand from "../base/MusicCommand.js";
import DjRoleGuard from "../../../domain/guards/DjRoleGuard.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import Emojis from "../../../domain/constants/Emojis.js";

// NOT in extraGuards on purpose. As a blocking guard, DjRoleGuard would
// reject non-DJ members outright before exec() ever runs, which makes a
// vote impossible — there'd be no code path left for a non-DJ to even
// register one. Instead it's called directly, as a plain bypass check: DJ /
// Manage Guild / alone-in-channel skips instantly (same as before), anyone
// else falls through to the vote.
const djRoleGuard = new DjRoleGuard();

/**
 * `/skip` — DJs, server managers, and members alone with the bot skip instantly; anyone
 * else registers a majority vote via {@link QueueService#registerSkipVote}.
 * @extends MusicCommand
 */
export default class SkipCommand extends MusicCommand {
  constructor() {
    super({
      name: "skip",
      description: "Skips the current track (majority vote if you're not a DJ)",
    });
  }

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {{client: import("../../../client/Bot.js").default, voiceChannel: import("discord.js").VoiceBasedChannel}} context
   * @returns {Promise<import("discord.js").Message>}
   */
  async exec(interaction, context) {
    const queueService = this.client.queueService;

    if (!queueService.hasQueue(interaction.guildId)) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    const bypass = await djRoleGuard.check(interaction, context);

    if (bypass.ok) {
      const skipped = queueService.skip(interaction.guildId);
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.SKIP)} Skipped **${formatTrackTitle(skipped)}**!`,
      });
    }

    const result = queueService.registerSkipVote(
      interaction.guildId,
      interaction.user.id,
      context.voiceChannel
    );

    if (!result.ok) {
      return interaction.editReply({ content: "There is no music playing in this guild!" });
    }

    if (result.skipped) {
      return interaction.editReply({
        content: `${this.client.emoteService.get(Emojis.SKIP)} Vote passed (${result.votes}/${result.required}) — skipped **${formatTrackTitle(result.track)}**!`,
      });
    }

    if (result.alreadyVoted) {
      return interaction.editReply({
        content: `🗳️ You've already voted to skip (${result.votes}/${result.required} needed).`,
      });
    }

    return interaction.editReply({
      content: `🗳️ Vote to skip registered (${result.votes}/${result.required} needed). Ask ${result.required - result.votes} more member(s) to run \`/skip\`, or a DJ can skip it instantly.`,
    });
  }
}
