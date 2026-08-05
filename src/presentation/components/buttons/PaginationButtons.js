import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";

const PREVIOUS_ID = "pagination:previous";
const NEXT_ID = "pagination:next";

/**
 * Builds the Previous/Next button row.
 * @param {boolean} [disabled] - `true` once the collector has ended, so the buttons render
 *        visibly inert instead of silently failing on the next click.
 * @returns {import("discord.js").ActionRowBuilder}
 */
function buildRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(PREVIOUS_ID)
      .setLabel("Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(NEXT_ID)
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled)
  );
}

/**
 * Clones an embed with a "Page X / Y" footer applied.
 * @param {import("discord.js").EmbedBuilder} embed
 * @param {number} index - 0-indexed current page.
 * @param {number} total - Total page count.
 * @returns {import("discord.js").EmbedBuilder}
 */
function withFooter(embed, index, total) {
  return EmbedBuilder.from(embed).setFooter({ text: `Page ${index + 1} / ${total}` });
}

/**
 * Complete rewrite of the old, broken src/utils/Pagination.js, which built
 * its button row with `new ActionRow()` — the read-only, received-message
 * class — instead of `ActionRowBuilder`, the mutable builder. Uses proper
 * v14 Builders throughout.
 *
 * Two behavioral fixes over the old version, not just the ActionRow bug:
 *  - the button collector is now filtered to the command's original caller;
 *    the old version had no filter, so anyone could page through anyone
 *    else's queue/favorites view.
 *  - single-page results skip the button row entirely instead of always
 *    requiring exactly two buttons.
 * @param {import("discord.js").ChatInputCommandInteraction} interaction - Must already be
 *        deferred; this sends the deferred reply.
 * @param {import("discord.js").EmbedBuilder[]} pages - Non-empty array of pre-built pages.
 * @param {object} [options]
 * @param {number} [options.timeout] - Milliseconds the button collector stays active before
 *        auto-disabling the buttons. Defaults to 120000 (2 minutes).
 * @returns {Promise<import("discord.js").Message>}
 * @throws {Error} If `pages` is empty or nullish.
 */
export async function sendPaginatedEmbeds(interaction, pages, { timeout = 120_000 } = {}) {
  if (!pages?.length) throw new Error("pages must be a non-empty array");

  if (pages.length === 1) {
    return interaction.editReply({ embeds: [pages[0]], components: [] });
  }

  let page = 0;

  const message = await interaction.editReply({
    embeds: [withFooter(pages[page], page, pages.length)],
    components: [buildRow()],
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => [PREVIOUS_ID, NEXT_ID].includes(i.customId) && i.user.id === interaction.user.id,
    time: timeout,
  });

  collector.on("collect", async (i) => {
    page =
      i.customId === PREVIOUS_ID
        ? page > 0
          ? page - 1
          : pages.length - 1
        : page + 1 < pages.length
          ? page + 1
          : 0;

    await i.update({
      embeds: [withFooter(pages[page], page, pages.length)],
      components: [buildRow()],
    });
    collector.resetTimer();
  });

  collector.on("end", () => {
    interaction.editReply({ components: [buildRow(true)] }).catch(() => {
      // message may already be deleted/unreachable — nothing more to do.
    });
  });

  return message;
}
