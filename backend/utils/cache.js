/**
 * Simple in-memory TTL cache.
 * Drop-in replaceable with Redis (ioredis) by swapping get/set/del calls.
 *
 * Usage:
 *   cache.set(key, value, ttlSeconds)  // store
 *   cache.get(key)                     // retrieve or null
 *   cache.del(key)                     // remove one key
 *   cache.delByPrefix(prefix)          // remove all keys starting with prefix
 */

const store = new Map();

const cache = {
  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    store.set(key, { value, expiresAt });
  },

  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  },

  del(key) {
    store.delete(key);
  },

  /** Invalidate all cache entries whose key starts with the given prefix */
  delByPrefix(prefix) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  },

  /** Flush everything (useful in tests) */
  flush() {
    store.clear();
  }
};

module.exports = cache;
