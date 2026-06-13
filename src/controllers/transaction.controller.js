const transactionService = require('../services/transaction.service');
const messages = require('../utils/messages');

const createTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.createTransaction(req.user.userId, req.body);
        res.status(201).json({ message: messages.TRANSACTION_CREATED, transaction });
    } catch (err) {
        next(err);
    }
};

const getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await transactionService.getAllTransactions(req.user.userId);
        res.status(200).json({ transactions });
    } catch (err) {
        next(err);
    }
};

const getTransactionById = async (req, res, next) => {
    try {
        const transaction = await transactionService.getTransactionById(req.user.userId, req.params.id);
        res.status(200).json({ transaction });
    } catch (err) {
        next(err);
    }
};

const updateTransaction = async (req, res, next) => {
    try {
        const transaction = await transactionService.updateTransaction(req.user.userId, req.params.id, req.body);
        res.status(200).json({ message: messages.TRANSACTION_UPDATED, transaction });
    } catch (err) {
        next(err);
    }
};

const deleteTransaction = async (req, res, next) => {
    try {
        await transactionService.deleteTransaction(req.user.userId, req.params.id);
        res.status(200).json({ message: messages.TRANSACTION_DELETED });
    } catch (err) {
        next(err);
    }
};

module.exports = { createTransaction, getAllTransactions, getTransactionById, updateTransaction, deleteTransaction };
