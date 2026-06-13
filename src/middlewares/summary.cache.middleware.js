const { summaryCache } = require('../services/cache.service');

// Intercepts GET /summary with no query params.
// Filtered requests (category / date range) always bypass the cache.
const summaryCacheMiddleware = (req, res, next) => {
    const hasFilters = Object.keys(req.query).length > 0;

    if (hasFilters) {
        res.locals.cache = { isCacheable: false };
        return next();
    }

    const cached = summaryCache.get(req.user.userId);

    if (cached) {
        return res.status(200).json({ summary: cached, fromCache: true });
    }

    res.locals.cache = { isCacheable: true };
    next();
};

module.exports = summaryCacheMiddleware;
