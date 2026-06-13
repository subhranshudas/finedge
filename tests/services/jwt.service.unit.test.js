jest.mock('jsonwebtoken');
jest.mock('../../src/config/env', () => ({
    JWT_SECRET: 'test-secret',
    JWT_EXPIRY: '1h',
}));

const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../../src/services/jwt.service');

describe('generateToken', () => {
    it('calls jwt.sign with the payload, secret, and expiry', () => {
        jwt.sign.mockReturnValue('signed-token');
        const payload = { userId: 'user-id', email: 'test@example.com' };

        const token = generateToken(payload);

        expect(jwt.sign).toHaveBeenCalledWith(payload, 'test-secret', { expiresIn: '1h' });
        expect(token).toBe('signed-token');
    });
});

describe('verifyToken', () => {
    it('calls jwt.verify with the token and secret', () => {
        const mockPayload = { userId: 'user-id', email: 'test@example.com' };
        jwt.verify.mockReturnValue(mockPayload);

        const result = verifyToken('some-token');

        expect(jwt.verify).toHaveBeenCalledWith('some-token', 'test-secret');
        expect(result).toEqual(mockPayload);
    });

    it('propagates errors thrown by jwt.verify', () => {
        jwt.verify.mockImplementation(() => { throw new Error('TokenExpiredError'); });

        expect(() => verifyToken('expired-token')).toThrow('TokenExpiredError');
    });
});
