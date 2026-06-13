const jwtService = require('../services/jwt.service');
const { UnauthorizedError } = require('../errors');
const messages = require('../utils/messages');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new UnauthorizedError(messages.AUTH_TOKEN_MISSING));
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwtService.verifyToken(token);

        // attach decoded payload to request for downstream handlers
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError(messages.AUTH_TOKEN_EXPIRED));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new UnauthorizedError(messages.AUTH_TOKEN_INVALID));
        }
        next(err);
    }
};

module.exports = authenticate;
