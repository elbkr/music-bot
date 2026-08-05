import { EmbedBuilder } from "discord.js";
import { formatTrackTitle } from "../../../shared/format/track.js";
import { PRIMARY_COLOR } from "../../../domain/constants/Theme.js";

const FAVORITES_PER_PAGE = 10;

/**
 * Renders a single numbered favorites-list line.
 * @param {{title: string, author: ?string, uri: string}} favorite
 * @param {number} position - 1-indexed display position.
 * @returns {string}
 */
const link = (favorite, position) => `${position}. [${formatTrackTitle(favorite)}](${favorite.uri})`;

/**
 * Builds one embed per page of a user's saved favorites. Favorite
 * subdocuments carry the same {title, author} shape KazagumoTrack does, so
 * `formatTrackTitle()` works unmodified here too.
 * @param {Array<{title: string, author: ?string, uri: string}>} favorites
 * @param {?string} userIconURL
 * @returns {import("discord.js").EmbedBuilder[]}
 */
export function buildFavoritesEmbeds(favorites, userIconURL) {
  const base = () =>
    new EmbedBuilder().setTitle("Favorite Songs").setColor(PRIMARY_COLOR).setThumbnail(userIconURL);

  if (favorites.length === 0) {
    return [base().setDescription("You don't have any favorite songs yet!")];
  }

  const pages = [];

  for (let start = 0; start < favorites.length; start += FAVORITES_PER_PAGE) {
    const list = favorites
      .slice(start, start + FAVORITES_PER_PAGE)
      .map((favorite, i) => link(favorite, start + i + 1))
      .join("\n");

    pages.push(base().setDescription(list));
  }

  return pages;
}
