const env = require('../config/env');

const createCache = (ns, ttlMs) => {
    const store = new Map();
    const prefixedKey = (key) => `${ns}:${key}`;

    return {
        get: (key) => {
            const entry = store.get(prefixedKey(key));
            if (!entry) return null;
            if (Date.now() > entry.expiresAt) {
                store.delete(prefixedKey(key));
                return null;
            }
            return entry.value;
        },
        set: (key, value) => {
            store.set(prefixedKey(key), { value, expiresAt: Date.now() + ttlMs });
        },
        del: (key) => store.delete(prefixedKey(key)),
    };
};

module.exports = {
    summaryCache: createCache('summary', env.SUMMARY_CACHE_TTL_MS),
};
