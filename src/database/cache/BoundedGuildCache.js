const DEFAULT_MAX_SIZE = 1000;
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fixes the audit's unbounded-cache finding: the old `database.guilds`
 * Collection grew forever and was never evicted on guildDelete. This is a
 * plain Map used as an insertion-ordered LRU (re-inserting on access moves
 * an entry to the "most recent" end) with a hard size cap and a TTL.
 */
export default class BoundedGuildCache {
  /**
   * @param {object} [options]
   * @param {number} [options.maxSize] - Maximum cached entries before the least-recently-
   *        used one is evicted. Defaults to 1000.
   * @param {number} [options.ttlMs] - Milliseconds an entry stays valid after being
   *        set/accessed. Defaults to 10 minutes.
   */
  constructor({ maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    /** @type {Map<string, {value: object, expiresAt: number}>} */
    this.store = new Map();
  }

  /**
   * @param {string} guildId
   * @returns {object|undefined} The cached value, or `undefined` if absent/expired.
   *          A hit refreshes both the TTL-adjacent recency ordering and moves the entry
   *          to the "most recently used" end.
   */
  get(guildId) {
    const entry = this.store.get(guildId);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(guildId);
      return undefined;
    }

    // Refresh recency for LRU purposes.
    this.store.delete(guildId);
    this.store.set(guildId, entry);
    return entry.value;
  }

  /**
   * Inserts or updates an entry, resetting its TTL. Evicts the least-recently-used entry
   * first if the cache is at `maxSize` and this is a new key.
   * @param {string} guildId
   * @param {object} value
   * @returns {void}
   */
  set(guildId, value) {
    if (this.store.has(guildId)) {
      this.store.delete(guildId);
    } else if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }

    this.store.set(guildId, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * @param {string} guildId
   * @returns {void}
   */
  delete(guildId) {
    this.store.delete(guildId);
  }
}
