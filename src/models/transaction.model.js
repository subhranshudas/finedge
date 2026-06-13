const mongoose = require('mongoose');

const TRANSACTION_TYPES = Object.freeze({
    INCOME: 'income',
    EXPENSE: 'expense',
});

const transactionSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:        { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
    category:    { type: String, required: true, trim: true, lowercase: true },
    amount:      { type: Number, required: true, min: 1 }, // stored in subunits (e.g. paisa, cents)
    currency:    { type: String, required: true, trim: true, uppercase: true },
    transactionDate: { type: Date, required: true },
    description: { type: String, trim: true, lowercase: true },
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
