const summaryService = require('../services/summary.service');
const { summaryCache } = require('../services/cache.service');

const getSummary = async (req, res, next) => {
    try {
        const { category, startDate, endDate } = req.query;
        const summary = await summaryService.getSummary(req.user.userId, { category, startDate, endDate });

        if (res.locals.cache?.isCacheable) {
            summaryCache.set(req.user.userId, summary);
        }

        res.status(200).json({ summary });
    } catch (err) {
        next(err);
    }
};

const getTrends = async (req, res, next) => {
    try {
        const trends = await summaryService.getTrends(req.user.userId);
        res.status(200).json({ trends });
    } catch (err) {
        next(err);
    }
};

module.exports = { getSummary, getTrends };
