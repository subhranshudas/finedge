const request = require('supertest');
const app = require('../../src/app');
const messages = require('../../src/utils/messages');

const baseUser = {
    username: 'john',
    email: 'john@example.com',
    password: 'password123',
    currency: 'INR',
};

// ─── POST /api/v1/users (register) ───────────────────────────────────────────

describe('POST /api/v1/users', () => {
    it('returns 201 with message and user on valid registration', async () => {
        const res = await request(app).post('/api/v1/users').send(baseUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe(messages.USER_CREATED);
        expect(res.body.user.id).toBeDefined();
        expect(res.body.user.email).toBe(baseUser.email);
        expect(res.body.user.username).toBe(baseUser.username);
        expect(res.body.user.currency).toBe(baseUser.currency);
    });

    it('does not return passwordHash in the response', async () => {
        const res = await request(app).post('/api/v1/users').send(baseUser);

        expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('returns 422 when username is missing', async () => {
        const res = await request(app).post('/api/v1/users').send({ email: baseUser.email, password: baseUser.password });

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 422 when email is invalid', async () => {
        const res = await request(app).post('/api/v1/users').send({ ...baseUser, email: 'not-an-email' });

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 422 when password is too short', async () => {
        const res = await request(app).post('/api/v1/users').send({ ...baseUser, password: '123' });

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 409 when email is already in use', async () => {
        await request(app).post('/api/v1/users').send(baseUser);

        const res = await request(app).post('/api/v1/users').send({ ...baseUser, username: 'differentuser' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe(messages.USER_CONFLICT);
    });

    it('returns 409 when username is already in use', async () => {
        await request(app).post('/api/v1/users').send(baseUser);

        const res = await request(app).post('/api/v1/users').send({ ...baseUser, email: 'different@example.com' });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe(messages.USER_CONFLICT);
    });

    it('defaults currency to INR when not provided', async () => {
        const { currency, ...userWithoutCurrency } = baseUser;
        const res = await request(app).post('/api/v1/users').send(userWithoutCurrency);

        expect(res.status).toBe(201);
        expect(res.body.user.currency).toBe('INR');
    });
});

// ─── POST /api/v1/users/login ─────────────────────────────────────────────────

describe('POST /api/v1/users/login', () => {
    beforeEach(async () => {
        await request(app).post('/api/v1/users').send(baseUser);
    });

    it('returns 200 with token and user on valid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: baseUser.email, password: baseUser.password });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe(baseUser.email);
    });

    it('returns 422 when email is missing', async () => {
        const res = await request(app).post('/api/v1/users/login').send({ password: baseUser.password });

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 422 when password is missing', async () => {
        const res = await request(app).post('/api/v1/users/login').send({ email: baseUser.email });

        expect(res.status).toBe(422);
        expect(res.body.message).toBe(messages.VALIDATION_FAILED);
    });

    it('returns 404 when user does not exist', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: 'unknown@example.com', password: baseUser.password });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe(messages.USER_NOT_FOUND);
    });

    it('returns 400 when password is wrong', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({ email: baseUser.email, password: 'wrongpassword' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(messages.USER_INVALID_CREDENTIALS);
    });
});
