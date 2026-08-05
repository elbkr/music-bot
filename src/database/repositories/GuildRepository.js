import GuildModel from "../models/Guild.model.js";
import BoundedGuildCache from "../cache/BoundedGuildCache.js";

/**
 * Fixes the audit's critical finding: the old Bot.getGuild() queried
 * `findOne({ guildID: guildId })` against a schema whose key is `_id`, so
 * the query never matched and every restart raced toward an E11000
 * duplicate-key crash on `.save()`.
 *
 * findOrCreate() here does two things differently, not just "query the
 * right field":
 *  - queries/upserts on `_id`, matching the actual schema.
 *  - uses an atomic `findOneAndUpdate(..., { upsert: true })` instead of
 *    find-then-create, which also closes the race condition where two
 *    concurrent interactions from a brand-new guild both see `null` and
 *    both attempt to create the same document.
 */
export default class GuildRepository {
  /**
   * @param {object} [options]
   * @param {BoundedGuildCache} [options.cache] - Injectable for testing; defaults to a
   *        fresh `BoundedGuildCache`.
   */
  constructor({ cache = new BoundedGuildCache() } = {}) {
    this.cache = cache;
  }

  /**
   * Returns the guild's config document, creating it (with schema defaults) on first use.
   * Cache-first; on a miss, atomically upserts via Mongo so two concurrent callers for a
   * brand-new guild can never race into a duplicate-key error.
   * @param {string} guildId
   * @returns {Promise<import("../models/Guild.model.js").GuildDocument>}
   */
  async findOrCreate(guildId) {
    const cached = this.cache.get(guildId);
    if (cached) return cached;

    const doc = await GuildModel.findOneAndUpdate(
      { _id: guildId },
      { $setOnInsert: { _id: guildId } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    this.cache.set(guildId, doc);
    return doc;
  }

  /**
   * Persists a mutated document and refreshes its cache entry.
   * @param {string} guildId
   * @param {import("mongoose").Document} doc
   * @returns {Promise<import("../models/Guild.model.js").GuildDocument>}
   */
  async save(guildId, doc) {
    await doc.save();
    this.cache.set(guildId, doc);
    return doc;
  }

  /**
   * Call from GuildDeleteEvent so the cache can't drift from Mongo state.
   * @param {string} guildId
   * @returns {void}
   */
  invalidate(guildId) {
    this.cache.delete(guildId);
  }

  /**
   * Write methods below are the only place commands' config changes touch a
   * Mongoose document. Each returns `{ ok, doc }` — `ok` is false when the
   * requested change was already the current state (already in the list,
   * already removed, already set), so commands don't need to inspect the
   * document to word their reply correctly.
   * @typedef {{ok: boolean, doc: import("../models/Guild.model.js").GuildDocument}} RepoResult
   */

  /**
   * @param {string} guildId
   * @param {string} roleId
   * @returns {Promise<RepoResult>} `ok: false` when the role was already present.
   */
  async addDjRole(guildId, roleId) {
    const doc = await this.findOrCreate(guildId);
    if (doc.djRoles.includes(roleId)) return { ok: false, doc };

    doc.djRoles.push(roleId);
    return { ok: true, doc: await this.save(guildId, doc) };
  }

  /**
   * @param {string} guildId
   * @param {string} roleId
   * @returns {Promise<RepoResult>} `ok: false` when the role wasn't present.
   */
  async removeDjRole(guildId, roleId) {
    const doc = await this.findOrCreate(guildId);
    if (!doc.djRoles.includes(roleId)) return { ok: false, doc };

    doc.djRoles = doc.djRoles.filter((id) => id !== roleId);
    return { ok: true, doc: await this.save(guildId, doc) };
  }

  /**
   * @param {string} guildId
   * @param {string} channelId
   * @returns {Promise<RepoResult>} `ok: false` when the channel was already present.
   */
  async addVoiceChannel(guildId, channelId) {
    const doc = await this.findOrCreate(guildId);
    if (doc.voiceChannels.includes(channelId)) return { ok: false, doc };

    doc.voiceChannels.push(channelId);
    return { ok: true, doc: await this.save(guildId, doc) };
  }

  /**
   * @param {string} guildId
   * @param {string} channelId
   * @returns {Promise<RepoResult>} `ok: false` when the channel wasn't present.
   */
  async removeVoiceChannel(guildId, channelId) {
    const doc = await this.findOrCreate(guildId);
    if (!doc.voiceChannels.includes(channelId)) return { ok: false, doc };

    doc.voiceChannels = doc.voiceChannels.filter((id) => id !== channelId);
    return { ok: true, doc: await this.save(guildId, doc) };
  }

  /**
   * @param {string} guildId
   * @param {boolean} enabled
   * @returns {Promise<RepoResult>} `ok: false` when the value was already set.
   */
  async setAnnouncements(guildId, enabled) {
    const doc = await this.findOrCreate(guildId);
    if (doc.announcements === enabled) return { ok: false, doc };

    doc.announcements = enabled;
    return { ok: true, doc: await this.save(guildId, doc) };
  }

  /**
   * @param {string} guildId
   * @param {?string} channelId - Pass `null` to disable audit logging.
   * @returns {Promise<RepoResult>} `ok: false` when the value was already set.
   */
  async setLogChannel(guildId, channelId) {
    const doc = await this.findOrCreate(guildId);
    if (doc.logChannelId === channelId) return { ok: false, doc };

    doc.logChannelId = channelId;
    return { ok: true, doc: await this.save(guildId, doc) };
  }
}
