const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');
const User = require('../models/user.model');
const { toMajorUnit } = require('../utils/currency');
const { NotFoundError } = require('../errors');
const messages = require('../utils/messages');

// Builds a MongoDB match filter for the authenticated user with optional
// category and date range constraints.
const buildMatchFilter = (userId, { category, startDate, endDate } = {}) => {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };

    if (category) filter.category = category.toLowerCase();

    if (startDate || endDate) {
        filter.transactionDate = {};
        if (startDate) filter.transactionDate.$gte = new Date(startDate);
        if (endDate)   filter.transactionDate.$lte = new Date(endDate);
    }

    return filter;
};

const getSummary = async (userId, filters = {}) => {
    const user = await User.findById(userId).select('currency');
    if (!user) throw new NotFoundError(messages.USER_NOT_FOUND);

    const match = buildMatchFilter(userId, filters);

    const [result] = await Transaction.aggregate([
        // 1st filter transactions by user and optional criteria (category, date range)
        { $match: match },
        // 2nd group all matched transactions to calculate total income and expense
        {
            $group: {
                // _id is not needed for summary, so we can set it to null
                _id: null,
                // transaction.type === 'income' ? transaction.amount : 0
                income:  { $sum: { $cond: [{ $eq: ['$type', 'income']  }, '$amount', 0] } },
                // transaction.type === 'expense' ? transaction.amount : 0
                expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
            },
        },
    ]);

    const incomeSubunits = result?.income ?? 0;
    const expenseSubunits = result?.expense ?? 0;

    const income = toMajorUnit(incomeSubunits, user.currency);
    const expense = toMajorUnit(expenseSubunits, user.currency);

    return {
        income,
        expense,
        balance: parseFloat((income - expense).toFixed(2)),
        currency: user.currency,
    };
};

const getTrends = async (userId) => {
    const user = await User.findById(userId).select('currency');
    if (!user) throw new NotFoundError(messages.USER_NOT_FOUND);

    const rows = await Transaction.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
                income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } },
                expense: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    return rows.map((row) => {
        const income = toMajorUnit(row.income, user.currency);
        const expense = toMajorUnit(row.expense, user.currency);
        return {
            month: row._id,
            income,
            expense,
            balance: parseFloat((income - expense).toFixed(2)),
            currency: user.currency,
        };
    });
};

module.exports = { getSummary, getTrends };
