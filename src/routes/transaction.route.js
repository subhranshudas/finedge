const { Router } = require('express');
const transactionController = require('../controllers/transaction.controller');
const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const validateId = require('../middlewares/validateid.middleware');
const { createTransactionSchema, updateTransactionSchema } = require('../validators/transaction.validator');

const router = Router();

router.use(authenticate);

router.post('/',     validate(createTransactionSchema), transactionController.createTransaction);
router.get('/',      transactionController.getAllTransactions);
router.get('/:id',   validateId, transactionController.getTransactionById);
router.patch('/:id', validateId, validate(updateTransactionSchema), transactionController.updateTransaction);
router.delete('/:id',validateId, transactionController.deleteTransaction);

module.exports = router;
