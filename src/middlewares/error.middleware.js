const { AppError, ValidationError } = require('../errors');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    // Validation error — include field-level details
    if (err instanceof ValidationError) {
        const body = { message: err.message };
        if (err.fieldErrors) body.errors = err.fieldErrors;
        return res.status(422).json(body);
    }

    // Known operational error — thrown intentionally by our code
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ message: `${field} already exists` });
    }

    // Unknown error — don't leak internals
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorMiddleware;
