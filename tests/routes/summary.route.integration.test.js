const request = require('supertest');
const app = require('../../src/app');
const messages = require('../../src/utils/messages');

const baseUser = {
    username: 'john',
    email: 'john@example.com',
    password: 'password123',
    currency: 'INR',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async (user = baseUser) => {
    await request(app).post('/api/v1/users').send(user);
    const res = await request(app).post('/api/v1/users/login').send({ email: user.email, password: user.password });
    return res.body.token;
};

const createTx = (token, overrides = {}) =>
    request(app)
        .post('/api/v1/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({ type: 'expense', category: 'food', amount: 500, transactionDate: '2024-01-15', ...overrides });

// ─── GET /api/v1/summary ──────────────────────────────────────────────────────

describe('GET /api/v1/summary', () => {
    it('returns 200 with zeroed summary when user has no transactions', async () => {
        const token = await registerAndLogin();
        const res = await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.summary).toEqual({ income: 0, expense: 0, balance: 0, currency: 'INR' });
    });

    it('returns correct income, expense, and balance totals', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'income', category: 'salary', amount: 10000 });
        await createTx(token, { type: 'expense', category: 'rent', amount: 3000 });

        const res = await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.income).toBe(10000);
        expect(res.body.summary.expense).toBe(3000);
        expect(res.body.summary.balance).toBe(7000);
        expect(res.body.summary.currency).toBe('INR');
    });

    it('filters by category when category query param is provided', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'expense', category: 'food', amount: 500 });
        await createTx(token, { type: 'expense', category: 'travel', amount: 2000 });

        const res = await request(app).get('/api/v1/summary?category=food').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.expense).toBe(500);
    });

    it('filters by date range when startDate and endDate are provided', async () => {
        const token = await registerAndLogin();
        await createTx(token, { amount: 500, transactionDate: '2024-01-15' });
        await createTx(token, { amount: 300, transactionDate: '2024-03-01' });

        const res = await request(app)
            .get('/api/v1/summary?startDate=2024-01-01&endDate=2024-01-31')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.expense).toBe(500);
    });

    it('returns cached summary on second identical unfiltered request', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'income', category: 'salary', amount: 5000 });

        await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);
        const res = await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.summary.income).toBe(5000);
    });

    it('returns updated summary after a new transaction invalidates the cache', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'income', category: 'salary', amount: 5000 });

        await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);

        await createTx(token, { type: 'income', category: 'bonus', amount: 1000 });

        const res = await request(app).get('/api/v1/summary').set('Authorization', `Bearer ${token}`);

        expect(res.body.summary.income).toBe(6000);
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/api/v1/summary');

        expect(res.status).toBe(401);
    });

    it('returns 422 when startDate is an invalid date', async () => {
        const token = await registerAndLogin();
        const res = await request(app)
            .get('/api/v1/summary?startDate=not-a-date')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(422);
    });
});

// ─── GET /api/v1/summary/trends ───────────────────────────────────────────────

describe('GET /api/v1/summary/trends', () => {
    it('returns 200 with empty array when user has no transactions', async () => {
        const token = await registerAndLogin();
        const res = await request(app).get('/api/v1/summary/trends').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.trends).toEqual([]);
    });

    it('returns monthly breakdown sorted chronologically', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'income', category: 'salary', amount: 5000, transactionDate: '2024-01-10' });
        await createTx(token, { type: 'expense', category: 'rent', amount: 2000, transactionDate: '2024-01-20' });
        await createTx(token, { type: 'income', category: 'salary', amount: 5000, transactionDate: '2024-02-10' });

        const res = await request(app).get('/api/v1/summary/trends').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.trends).toHaveLength(2);
        expect(res.body.trends[0].month).toBe('2024-01');
        expect(res.body.trends[0].income).toBe(5000);
        expect(res.body.trends[0].expense).toBe(2000);
        expect(res.body.trends[0].balance).toBe(3000);
        expect(res.body.trends[1].month).toBe('2024-02');
    });

    it('includes currency in each monthly row', async () => {
        const token = await registerAndLogin();
        await createTx(token, { type: 'income', category: 'salary', amount: 1000, transactionDate: '2024-01-01' });

        const res = await request(app).get('/api/v1/summary/trends').set('Authorization', `Bearer ${token}`);

        expect(res.body.trends[0].currency).toBe('INR');
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/api/v1/summary/trends');

        expect(res.status).toBe(401);
    });

    it('does not mix transactions from different users', async () => {
        const token1 = await registerAndLogin();
        const token2 = await registerAndLogin({ username: 'jane', email: 'jane@example.com', password: 'password123', currency: 'INR' });

        await createTx(token1, { type: 'income', amount: 9999, transactionDate: '2024-01-01' });

        const res = await request(app).get('/api/v1/summary/trends').set('Authorization', `Bearer ${token2}`);

        expect(res.body.trends).toEqual([]);
    });
});
