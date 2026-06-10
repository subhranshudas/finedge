const { toMajorUnit } = require('./currency');

// formats a transaction document for the client — converts amount back to major units
const formatTransaction = (transaction) => ({
    id:          transaction._id,
    userId:      transaction.userId,
    type:        transaction.type,
    category:    transaction.category,
    amount:      toMajorUnit(transaction.amount, transaction.currency),
    currency:    transaction.currency,
    transactionDate: transaction.transactionDate,
    description: transaction.description,
    createdAt:   transaction.createdAt,
    updatedAt:   transaction.updatedAt,
});

module.exports = { formatTransaction };
