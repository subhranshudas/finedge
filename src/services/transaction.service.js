const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const { toSubunits } = require('../utils/currency');
const { formatTransaction } = require('../utils/transaction');
const { NotFoundError } = require('../errors');
const messages = require('../utils/messages');
const { summaryCache } = require('./cache.service');

const createTransaction = async (userId, { type, category, amount, transactionDate, description }) => {
    // fetch user to get their currency preference — stored on the transaction document
    // so future operations (GET, PATCH, DELETE) don't need another DB call.
    // in production this would be served from a Redis cache instead.
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError(messages.USER_NOT_FOUND);

    const transaction = await Transaction.create({
        userId,
        type,
        category,
        amount: toSubunits(amount, user.currency),
        currency: user.currency,
        transactionDate,
        description,
    });

    summaryCache.del(userId);
    return formatTransaction(transaction);
};

const getAllTransactions = async (userId) => {
    const transactions = await Transaction.find({ userId }).sort({ transactionDate: -1 });
    return transactions.map(formatTransaction);
};

const getTransactionById = async (userId, transactionId) => {
    const transaction = await Transaction.findOne({ _id: transactionId, userId });
    if (!transaction) throw new NotFoundError(messages.TRANSACTION_NOT_FOUND);
    return formatTransaction(transaction);
};

const updateTransaction = async (userId, transactionId, updates) => {
    const transaction = await Transaction.findOne({ _id: transactionId, userId });
    if (!transaction) throw new NotFoundError(messages.TRANSACTION_NOT_FOUND);

    if (updates.amount !== undefined) {
        updates.amount = toSubunits(updates.amount, transaction.currency);
    }

    const updated = await Transaction.findByIdAndUpdate(
        transactionId,
        { $set: updates },
        { new: true, runValidators: true }
    );

    summaryCache.del(userId);
    return formatTransaction(updated);
};

const deleteTransaction = async (userId, transactionId) => {
    const transaction = await Transaction.findOneAndDelete({ _id: transactionId, userId });
    if (!transaction) throw new NotFoundError(messages.TRANSACTION_NOT_FOUND);
    summaryCache.del(userId);
};

module.exports = { createTransaction, getAllTransactions, getTransactionById, updateTransaction, deleteTransaction };
