const { AppError, ValidationError } = require('../errors');

const errorMiddleware = (err, req, res, next) => {
    // Zod input validation error — include field-level details
    if (err instanceof ValidationError) {
        const body = { message: err.message };
        if (err.fieldErrors) body.errors = err.fieldErrors;
        return res.status(422).json(body);
    }

    // Known operational error — thrown intentionally by our code
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    // Unknown error — don't leak internals
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorMiddleware;
