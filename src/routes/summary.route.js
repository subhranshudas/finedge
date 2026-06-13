const { Router } = require('express');
const summaryController = require('../controllers/summary.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validateQuery = require('../middlewares/validate-query.middleware');
const summaryCache = require('../middlewares/summary.cache.middleware');
const { summaryQuerySchema } = require('../validators/summary.validator');

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(summaryQuerySchema), summaryCache, summaryController.getSummary);
router.get('/trends', summaryController.getTrends);

module.exports = router;
