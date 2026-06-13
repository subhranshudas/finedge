jest.mock('../../src/models/transaction.model');
jest.mock('../../src/models/user.model');

const mongoose = require('mongoose');
const Transaction = require('../../src/models/transaction.model');
const User = require('../../src/models/user.model');
const { getSummary, getTrends } = require('../../src/services/summary.service');
const { NotFoundError } = require('../../src/errors');
const messages = require('../../src/utils/messages');

const userId = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── getSummary ───────────────────────────────────────────────────────────────

describe('getSummary', () => {
    it('throws NotFoundError when user does not exist', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await expect(getSummary(userId)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with correct message', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await expect(getSummary(userId)).rejects.toThrow(messages.USER_NOT_FOUND);
    });

    it('returns zeroed summary when there are no transactions', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([]);

        const result = await getSummary(userId);

        expect(result).toEqual({ income: 0, expense: 0, balance: 0, currency: 'INR' });
    });

    it('converts aggregated subunit amounts to major units', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([{ _id: null, income: 50000, expense: 20000 }]);

        const result = await getSummary(userId);

        expect(result.income).toBe(500);
        expect(result.expense).toBe(200);
        expect(result.balance).toBe(300);
        expect(result.currency).toBe('INR');
    });

    it('applies category filter in the aggregation match stage', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([]);

        await getSummary(userId, { category: 'Food' });

        const [pipeline] = Transaction.aggregate.mock.calls;
        const matchStage = pipeline[0][0].$match;
        expect(matchStage.category).toBe('food');
    });

    it('applies startDate and endDate filters in the match stage', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([]);

        await getSummary(userId, { startDate: '2024-01-01', endDate: '2024-01-31' });

        const [pipeline] = Transaction.aggregate.mock.calls;
        const matchStage = pipeline[0][0].$match;
        expect(matchStage.transactionDate.$gte).toEqual(new Date('2024-01-01'));
        expect(matchStage.transactionDate.$lte).toEqual(new Date('2024-01-31'));
    });
});

// ─── getTrends ────────────────────────────────────────────────────────────────

describe('getTrends', () => {
    it('throws NotFoundError when user does not exist', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

        await expect(getTrends(userId)).rejects.toThrow(NotFoundError);
    });

    it('returns an empty array when there are no transactions', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([]);

        const result = await getTrends(userId);

        expect(result).toEqual([]);
    });

    it('returns monthly breakdown with amounts in major units', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'INR' }) });
        Transaction.aggregate.mockResolvedValue([
            { _id: '2024-01', income: 100000, expense: 40000 },
            { _id: '2024-02', income: 200000, expense: 80000 },
        ]);

        const result = await getTrends(userId);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({ month: '2024-01', income: 1000, expense: 400, balance: 600, currency: 'INR' });
        expect(result[1]).toEqual({ month: '2024-02', income: 2000, expense: 800, balance: 1200, currency: 'INR' });
    });

    it('rounds balance to 2 decimal places', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ currency: 'USD' }) });
        // income: 1 cent = $0.01, expense: 0 => balance = 0.01
        Transaction.aggregate.mockResolvedValue([{ _id: '2024-03', income: 1, expense: 0 }]);

        const result = await getTrends(userId);

        expect(result[0].balance).toBe(0.01);
    });
});
