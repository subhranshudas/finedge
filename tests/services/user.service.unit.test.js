jest.mock('../../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('../../src/services/jwt.service');

const bcrypt = require('bcryptjs');
const User = require('../../src/models/user.model');
const jwtService = require('../../src/services/jwt.service');
const { registerUser, loginUser } = require('../../src/services/user.service');
const { ConflictError, NotFoundError, BadRequestError } = require('../../src/errors');
const messages = require('../../src/utils/messages');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─── registerUser ─────────────────────────────────────────────────────────────

describe('registerUser', () => {
    it('throws ConflictError when email or username is already in use', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing-id' });

        await expect(registerUser({ username: 'john', email: 'john@example.com', password: 'pass123', currency: 'INR' }))
            .rejects.toThrow(ConflictError);
    });

    it('throws ConflictError with correct message', async () => {
        User.findOne.mockResolvedValue({ _id: 'existing-id' });

        await expect(registerUser({ username: 'john', email: 'john@example.com', password: 'pass123', currency: 'INR' }))
            .rejects.toThrow(messages.USER_CONFLICT);
    });

    it('hashes the password before creating the user', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-pass');
        User.create.mockResolvedValue({ _id: 'new-id', username: 'john', email: 'john@example.com', currency: 'INR' });

        await registerUser({ username: 'john', email: 'john@example.com', password: 'pass123', currency: 'INR' });

        expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
    });

    it('creates the user with the hashed password', async () => {
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-pass');
        User.create.mockResolvedValue({ _id: 'new-id', username: 'john', email: 'john@example.com', currency: 'INR' });

        await registerUser({ username: 'john', email: 'john@example.com', password: 'pass123', currency: 'INR' });

        expect(User.create).toHaveBeenCalledWith({
            username: 'john',
            email: 'john@example.com',
            passwordHash: 'hashed-pass',
            currency: 'INR',
        });
    });

    it('returns id, username, email, and currency of the created user', async () => {
        const mockUser = { _id: 'new-id', username: 'john', email: 'john@example.com', currency: 'INR' };
        User.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed-pass');
        User.create.mockResolvedValue(mockUser);

        const result = await registerUser({ username: 'john', email: 'john@example.com', password: 'pass123', currency: 'INR' });

        expect(result).toEqual({ id: 'new-id', username: 'john', email: 'john@example.com', currency: 'INR' });
    });
});

// ─── loginUser ────────────────────────────────────────────────────────────────

describe('loginUser', () => {
    it('throws NotFoundError when user does not exist', async () => {
        User.findOne.mockResolvedValue(null);

        await expect(loginUser({ email: 'unknown@example.com', password: 'pass123' }))
            .rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError with correct message', async () => {
        User.findOne.mockResolvedValue(null);

        await expect(loginUser({ email: 'unknown@example.com', password: 'pass123' }))
            .rejects.toThrow(messages.USER_NOT_FOUND);
    });

    it('throws BadRequestError when password does not match', async () => {
        User.findOne.mockResolvedValue({ _id: 'user-id', passwordHash: 'hashed-pass' });
        bcrypt.compare.mockResolvedValue(false);

        await expect(loginUser({ email: 'john@example.com', password: 'wrongpass' }))
            .rejects.toThrow(BadRequestError);
    });

    it('throws BadRequestError with correct message on wrong password', async () => {
        User.findOne.mockResolvedValue({ _id: 'user-id', passwordHash: 'hashed-pass' });
        bcrypt.compare.mockResolvedValue(false);

        await expect(loginUser({ email: 'john@example.com', password: 'wrongpass' }))
            .rejects.toThrow(messages.USER_INVALID_CREDENTIALS);
    });

    it('generates a token with userId and email on valid credentials', async () => {
        const mockUser = { _id: 'user-id', email: 'john@example.com', username: 'john', currency: 'INR', passwordHash: 'hashed-pass' };
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwtService.generateToken.mockReturnValue('jwt-token');

        await loginUser({ email: 'john@example.com', password: 'pass123' });

        expect(jwtService.generateToken).toHaveBeenCalledWith({ userId: 'user-id', email: 'john@example.com' });
    });

    it('returns token and user on valid credentials', async () => {
        const mockUser = { _id: 'user-id', email: 'john@example.com', username: 'john', currency: 'INR', passwordHash: 'hashed-pass' };
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(true);
        jwtService.generateToken.mockReturnValue('jwt-token');

        const result = await loginUser({ email: 'john@example.com', password: 'pass123' });

        expect(result).toEqual({
            token: 'jwt-token',
            user: { id: 'user-id', username: 'john', email: 'john@example.com', currency: 'INR' },
        });
    });
});
