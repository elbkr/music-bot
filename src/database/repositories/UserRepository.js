import UserModel from "../models/User.model.js";

/**
 * No BoundedGuildCache-style cache here on purpose: favorites are read/written
 * far less often than guild config (once per /favorite invocation, not once
 * per interaction across every command), so the staleness/memory tradeoff a
 * cache exists to solve isn't worth it here.
 */
export default class UserRepository {
  /**
   * Returns the user's favorites document, creating it (empty) on first use. Atomically
   * upserted, same reasoning as `GuildRepository.findOrCreate`.
   * @param {string} userId
   * @returns {Promise<import("../models/User.model.js").UserDocument>}
   */
  async findOrCreate(userId) {
    return UserModel.findOneAndUpdate(
      { _id: userId },
      { $setOnInsert: { _id: userId } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  /**
   * @param {string} userId
   * @returns {Promise<import("../models/User.model.js").FavoriteTrack[]>}
   */
  async listFavorites(userId) {
    const doc = await this.findOrCreate(userId);
    return doc.favorites;
  }

  /**
   * @param {string} userId
   * @param {{title: string, author?: ?string, uri: string, source?: ?string}} track
   * @returns {Promise<{ok: boolean, doc: import("../models/User.model.js").UserDocument}>}
   *          `ok: false` when a favorite with the same `uri` already exists.
   */
  async addFavorite(userId, track) {
    const doc = await this.findOrCreate(userId);
    if (doc.favorites.some((f) => f.uri === track.uri)) return { ok: false, doc };

    doc.favorites.push({
      title: track.title,
      author: track.author ?? null,
      uri: track.uri,
      source: track.source ?? null,
      addedAt: new Date(),
    });
    await doc.save();

    return { ok: true, doc };
  }

  /**
   * @param {string} userId
   * @param {number} position - 1-indexed, matching what /favorite list displays.
   * @returns {Promise<{ok: boolean, doc: import("../models/User.model.js").UserDocument, removed?: import("../models/User.model.js").FavoriteTrack}>}
   *          `ok: false` when `position` is out of range; `removed` is only present on success.
   */
  async removeFavorite(userId, position) {
    const doc = await this.findOrCreate(userId);
    const index = position - 1;

    if (index < 0 || index >= doc.favorites.length) return { ok: false, doc };

    const [removed] = doc.favorites.splice(index, 1);
    await doc.save();

    return { ok: true, doc, removed };
  }
}
