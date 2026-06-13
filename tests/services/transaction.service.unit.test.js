jest.mock('../../src/models/transaction.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/services/cache.service', () => ({
    summaryCache: { del: jest.fn(), get: jest.fn(), set: jest.fn() },
}));

const Transaction = require('../../src/models/transaction.model');
const User = require('../../src/models/user.model');
const { summaryCache } = require('../../src/services/cache.service');
const {
    createTransaction,
    getAllTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
} = require('../../src/services/transaction.service');
const { NotFoundError } = require('../../src/errors');
const messages = require('../../src/utils/messages');

const userId = 'user-id-123';
const txId = 'tx-id-456';

const mockTx = {
    _id: txId,
    userId,
    type: 'expense',
    category: 'food',
    amount: 50000, // subunits
    currency: 'INR',
    transactionDate: new Date('2024-01-15'),
    description: 'lunch',
    createdAt: new Date(),
    updatedAt: new Date(),
};

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── createTransaction ────────────────────────────────────────────────────────

describe('createTransaction', () => {
    it('throws NotFoundError when user does not exist', async () => {
        User.findById.mockResolvedValue(null);

        await expect(createTransaction(userId, { type: 'expense', category: 'food', amount: 500, transactionDate: new Date() }))
            .rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with correct message', async () => {
        User.findById.mockResolvedValue(null);

        await expect(createTransaction(userId, { type: 'expense', category: 'food', amount: 500, transactionDate: new Date() }))
            .rejects.toThrow(messages.USER_NOT_FOUND);
    });

    it('stores amount in subunits based on user currency', async () => {
        User.findById.mockResolvedValue({ _id: userId, currency: 'INR' });
        Transaction.create.mockResolvedValue(mockTx);

        await createTransaction(userId, { type: 'expense', category: 'food', amount: 500, transactionDate: new Date() });

        expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 50000, // 500 * 100
            currency: 'INR',
        }));
    });

    it('invalidates the summary cache for the user', async () => {
        User.findById.mockResolvedValue({ _id: userId, currency: 'INR' });
        Transaction.create.mockResolvedValue(mockTx);

        await createTransaction(userId, { type: 'expense', category: 'food', amount: 500, transactionDate: new Date() });

        expect(summaryCache.del).toHaveBeenCalledWith(userId);
    });

    it('returns a formatted transaction with amount in major units', async () => {
        User.findById.mockResolvedValue({ _id: userId, currency: 'INR' });
        Transaction.create.mockResolvedValue(mockTx);

        const result = await createTransaction(userId, { type: 'expense', category: 'food', amount: 500, transactionDate: new Date() });

        expect(result.amount).toBe(500); // 50000 / 100
        expect(result.currency).toBe('INR');
    });
});

// ─── getAllTransactions ───────────────────────────────────────────────────────

describe('getAllTransactions', () => {
    it('returns transactions sorted by transactionDate descending', async () => {
        const sortMock = jest.fn().mockResolvedValue([mockTx]);
        Transaction.find.mockReturnValue({ sort: sortMock });

        await getAllTransactions(userId);

        expect(Transaction.find).toHaveBeenCalledWith({ userId });
        expect(sortMock).toHaveBeenCalledWith({ transactionDate: -1 });
    });

    it('returns an empty array when there are no transactions', async () => {
        Transaction.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

        const result = await getAllTransactions(userId);

        expect(result).toEqual([]);
    });

    it('returns formatted transactions with amount in major units', async () => {
        Transaction.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockTx]) });

        const result = await getAllTransactions(userId);

        expect(result[0].amount).toBe(500);
        expect(result[0].currency).toBe('INR');
    });
});

// ─── getTransactionById ───────────────────────────────────────────────────────

describe('getTransactionById', () => {
    it('throws NotFoundError when transaction does not exist', async () => {
        Transaction.findOne.mockResolvedValue(null);

        await expect(getTransactionById(userId, txId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with correct message', async () => {
        Transaction.findOne.mockResolvedValue(null);

        await expect(getTransactionById(userId, txId)).rejects.toThrow(messages.TRANSACTION_NOT_FOUND);
    });

    it('queries by both userId and transactionId to prevent cross-user access', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);

        await getTransactionById(userId, txId);

        expect(Transaction.findOne).toHaveBeenCalledWith({ _id: txId, userId });
    });

    it('returns a formatted transaction', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);

        const result = await getTransactionById(userId, txId);

        expect(result.amount).toBe(500);
        expect(result.id).toBe(txId);
    });
});

// ─── updateTransaction ────────────────────────────────────────────────────────

describe('updateTransaction', () => {
    it('throws NotFoundError when transaction does not exist', async () => {
        Transaction.findOne.mockResolvedValue(null);

        await expect(updateTransaction(userId, txId, { category: 'travel' })).rejects.toThrow(NotFoundError);
    });

    it('converts amount to subunits using the stored transaction currency', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);
        Transaction.findByIdAndUpdate.mockResolvedValue({ ...mockTx, amount: 20000 });

        await updateTransaction(userId, txId, { amount: 200 });

        expect(Transaction.findByIdAndUpdate).toHaveBeenCalledWith(
            txId,
            { $set: { amount: 20000 } },
            { new: true, runValidators: true },
        );
    });

    it('does not modify amount when it is not in the updates', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);
        Transaction.findByIdAndUpdate.mockResolvedValue({ ...mockTx, category: 'travel' });

        await updateTransaction(userId, txId, { category: 'travel' });

        expect(Transaction.findByIdAndUpdate).toHaveBeenCalledWith(
            txId,
            { $set: { category: 'travel' } },
            { new: true, runValidators: true },
        );
    });

    it('invalidates the summary cache for the user', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);
        Transaction.findByIdAndUpdate.mockResolvedValue(mockTx);

        await updateTransaction(userId, txId, { category: 'travel' });

        expect(summaryCache.del).toHaveBeenCalledWith(userId);
    });

    it('returns a formatted updated transaction', async () => {
        Transaction.findOne.mockResolvedValue(mockTx);
        Transaction.findByIdAndUpdate.mockResolvedValue({ ...mockTx, category: 'travel' });

        const result = await updateTransaction(userId, txId, { category: 'travel' });

        expect(result.category).toBe('travel');
        expect(result.amount).toBe(500);
    });
});

// ─── deleteTransaction ────────────────────────────────────────────────────────

describe('deleteTransaction', () => {
    it('throws NotFoundError when transaction does not exist', async () => {
        Transaction.findOneAndDelete.mockResolvedValue(null);

        await expect(deleteTransaction(userId, txId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with correct message', async () => {
        Transaction.findOneAndDelete.mockResolvedValue(null);

        await expect(deleteTransaction(userId, txId)).rejects.toThrow(messages.TRANSACTION_NOT_FOUND);
    });

    it('deletes by both userId and transactionId to prevent cross-user deletion', async () => {
        Transaction.findOneAndDelete.mockResolvedValue(mockTx);

        await deleteTransaction(userId, txId);

        expect(Transaction.findOneAndDelete).toHaveBeenCalledWith({ _id: txId, userId });
    });

    it('invalidates the summary cache for the user', async () => {
        Transaction.findOneAndDelete.mockResolvedValue(mockTx);

        await deleteTransaction(userId, txId);

        expect(summaryCache.del).toHaveBeenCalledWith(userId);
    });

    it('returns undefined on successful deletion', async () => {
        Transaction.findOneAndDelete.mockResolvedValue(mockTx);

        const result = await deleteTransaction(userId, txId);

        expect(result).toBeUndefined();
    });
});
