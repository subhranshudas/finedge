const request = require('supertest');
const app = require('../../src/app');
const messages = require('../../src/utils/messages');

const baseUser = {
    username: 'john',
    email: 'john@example.com',
    password: 'password123',
    currency: 'INR',
};

const baseTx = {
    type: 'expense',
    category: 'Food',
    amount: 500,
    transactionDate: '2024-01-15',
    description: 'lunch',
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const registerAndLogin = async (user = baseUser) => {
    await request(app).post('/api/v1/users').send(user);
    const res = await request(app).post('/api/v1/users/login').send({ email: user.email, password: user.password });
    return res.body.token;
};

const createTx = (token, body = baseTx) =>
    request(app).post('/api/v1/transactions').set('Authorization', `Bearer ${token}`).send(body);

// ─── POST /api/v1/transactions ────────────────────────────────────────────────

describe('POST /api/v1/transactions', () => {
    it('returns 201 with message and transaction on valid input', async () => {
        const token = await registerAndLogin();
        const res = await createTx(token);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe(messages.TRANSACTION_CREATED);
        expect(res.body.transaction.id).toBeDefined();
        expect(res.body.transaction.amount).toBe(500);
        expect(res.body.transaction.currency).toBe('INR');
        expect(res.body.transaction.category).toBe('food');
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).post('/api/v1/transactions').send(baseTx);

        expect(res.status).toBe(401);
        expect(res.body.message).toBe(messages.AUTH_TOKEN_MISSING);
    });

    it('returns 401 when token is invalid', async () => {
        const res = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', 'Bearer bad-token')
            .send(baseTx);

        expect(res.status).toBe(401);
    });

    it('returns 422 when type is missing', async () => {
        const token = await registerAndLogin();
        const { type, ...body } = baseTx;
        const res = await createTx(token, body);

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 422 when amount is zero or negative', async () => {
        const token = await registerAndLogin();
        const res = await createTx(token, { ...baseTx, amount: 0 });

        expect(res.status).toBe(422);
    });

    it('returns 422 when transactionDate is missing', async () => {
        const token = await registerAndLogin();
        const { transactionDate, ...body } = baseTx;
        const res = await createTx(token, body);

        expect(res.status).toBe(422);
    });

    it('returns 422 when type is not income or expense', async () => {
        const token = await registerAndLogin();
        const res = await createTx(token, { ...baseTx, type: 'invalid' });

        expect(res.status).toBe(422);
    });
});

// ─── GET /api/v1/transactions ─────────────────────────────────────────────────

describe('GET /api/v1/transactions', () => {
    it('returns 200 with empty array when user has no transactions', async () => {
        const token = await registerAndLogin();
        const res = await request(app).get('/api/v1/transactions').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.transactions).toEqual([]);
    });

    it('returns 200 with all transactions for the authenticated user', async () => {
        const token = await registerAndLogin();
        await createTx(token);
        await createTx(token, { ...baseTx, type: 'income', category: 'salary', amount: 5000 });

        const res = await request(app).get('/api/v1/transactions').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.transactions).toHaveLength(2);
    });

    it('does not return transactions from another user', async () => {
        const token1 = await registerAndLogin();
        const token2 = await registerAndLogin({ username: 'jane', email: 'jane@example.com', password: 'password123', currency: 'INR' });

        await createTx(token1);

        const res = await request(app).get('/api/v1/transactions').set('Authorization', `Bearer ${token2}`);

        expect(res.body.transactions).toHaveLength(0);
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).get('/api/v1/transactions');

        expect(res.status).toBe(401);
    });
});

// ─── GET /api/v1/transactions/:id ─────────────────────────────────────────────

describe('GET /api/v1/transactions/:id', () => {
    it('returns 200 with the transaction on valid id', async () => {
        const token = await registerAndLogin();
        const created = await createTx(token);
        const txId = created.body.transaction.id;

        const res = await request(app).get(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.transaction.id).toBe(txId);
    });

    it('returns 404 when transaction does not exist', async () => {
        const token = await registerAndLogin();
        const fakeId = '507f1f77bcf86cd799439011';

        const res = await request(app).get(`/api/v1/transactions/${fakeId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(messages.TRANSACTION_NOT_FOUND);
    });

    it('returns 400 when id is not a valid ObjectId', async () => {
        const token = await registerAndLogin();

        const res = await request(app).get('/api/v1/transactions/not-an-id').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });

    it('returns 404 when transaction belongs to another user', async () => {
        const token1 = await registerAndLogin();
        const token2 = await registerAndLogin({ username: 'jane', email: 'jane@example.com', password: 'password123', currency: 'INR' });
        const created = await createTx(token1);
        const txId = created.body.transaction.id;

        const res = await request(app).get(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token2}`);

        expect(res.status).toBe(404);
    });
});

// ─── PATCH /api/v1/transactions/:id ──────────────────────────────────────────

describe('PATCH /api/v1/transactions/:id', () => {
    it('returns 200 with message and updated transaction', async () => {
        const token = await registerAndLogin();
        const created = await createTx(token);
        const txId = created.body.transaction.id;

        const res = await request(app)
            .patch(`/api/v1/transactions/${txId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'travel', amount: 1000 });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(messages.TRANSACTION_UPDATED);
        expect(res.body.transaction.category).toBe('travel');
        expect(res.body.transaction.amount).toBe(1000);
    });

    it('returns 404 when transaction does not exist', async () => {
        const token = await registerAndLogin();
        const fakeId = '507f1f77bcf86cd799439011';

        const res = await request(app)
            .patch(`/api/v1/transactions/${fakeId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'travel' });

        expect(res.status).toBe(404);
    });

    it('returns 422 when amount is zero or negative', async () => {
        const token = await registerAndLogin();
        const created = await createTx(token);
        const txId = created.body.transaction.id;

        const res = await request(app)
            .patch(`/api/v1/transactions/${txId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -100 });

        expect(res.status).toBe(422);
    });

    it('returns 400 when id is not a valid ObjectId', async () => {
        const token = await registerAndLogin();

        const res = await request(app)
            .patch('/api/v1/transactions/not-an-id')
            .set('Authorization', `Bearer ${token}`)
            .send({ category: 'travel' });

        expect(res.status).toBe(400);
    });

    it('returns 401 when Authorization header is missing', async () => {
        const res = await request(app).patch('/api/v1/transactions/507f1f77bcf86cd799439011').send({ category: 'travel' });

        expect(res.status).toBe(401);
    });
});

// ─── DELETE /api/v1/transactions/:id ─────────────────────────────────────────

describe('DELETE /api/v1/transactions/:id', () => {
    it('returns 200 with message on successful deletion', async () => {
        const token = await registerAndLogin();
        const created = await createTx(token);
        const txId = created.body.transaction.id;

        const res = await request(app).delete(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe(messages.TRANSACTION_DELETED);
    });

    it('returns 404 after deletion when trying to fetch the deleted transaction', async () => {
        const token = await registerAndLogin();
        const created = await createTx(token);
        const txId = created.body.transaction.id;

        await request(app).delete(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token}`);

        const res = await request(app).get(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('returns 404 when transaction does not exist', async () => {
        const token = await registerAndLogin();
        const fakeId = '507f1f77bcf86cd799439011';

        const res = await request(app).delete(`/api/v1/transactions/${fakeId}`).set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('returns 404 when transaction belongs to another user', async () => {
        const token1 = await registerAndLogin();
        const token2 = await registerAndLogin({ username: 'jane', email: 'jane@example.com', password: 'password123', currency: 'INR' });
        const created = await createTx(token1);
        const txId = created.body.transaction.id;

        const res = await request(app).delete(`/api/v1/transactions/${txId}`).set('Authorization', `Bearer ${token2}`);

        expect(res.status).toBe(404);
    });

    it('returns 400 when id is not a valid ObjectId', async () => {
        const token = await registerAndLogin();

        const res = await request(app).delete('/api/v1/transactions/not-an-id').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});
