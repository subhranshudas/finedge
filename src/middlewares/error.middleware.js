const { AppError, ValidationError } = require('../errors');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    // Validation error — include field-level details
    if (err instanceof ValidationError) {
        console.warn('Validation error: line 7');
        const body = { message: err.message };
        if (err.fieldErrors) body.errors = err.fieldErrors;
        return res.status(422).json(body);
    }

    // Known operational error — thrown intentionally by our code
    if (err instanceof AppError) {
        console.warn('AppError: line 15');
        return res.status(err.statusCode).json({ message: err.message });
    }

    // Mongoose schema-level validation error (err.name === 'ValidationError')
    // This is Mongoose's own error class, distinct from our custom ValidationError.
    // Thrown when a document violates schema constraints (e.g. required, enum)
    // at the model layer — not to be confused with our Zod input validation above.
    if (err.name === 'ValidationError') {
        console.warn('Mongoose ValidationError: line 28');  
        return res.status(400).json({ message: err.message });
    }

    // MongoDB duplicate key error (error code 11000)
    // Fired when a unique index constraint is violated at the database level.
    // Acts as a safety net for race conditions where two simultaneous requests
    // both pass the service-level duplicate check and attempt to write concurrently.
    if (err.code === 11000) {   
        console.warn('MongoDB duplicate key error: line 37');
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ message: `${field} already exists` });
    }

    // Unknown error — don't leak internals
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorMiddleware;
