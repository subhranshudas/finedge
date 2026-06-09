const AppError = require('./app.error');

/*
 * 4xx — Client errors
 *
 * 400 Bad Request          — malformed input, failed validation
 * 404 Not Found            — resource does not exist
 * 409 Conflict             — duplicate resource, state conflict
 * 422 Unprocessable Entity — valid format but semantic errors
 *
 * 5xx — Server errors
 *
 * 500 Internal Server Error — unexpected failure, default fallback
 */

class BadRequestError extends AppError {
    constructor(message) { super(message, 400); }
}

class UnauthorizedError extends AppError {
    constructor(message) { super(message, 401); }
}

class NotFoundError extends AppError {
    constructor(message) { super(message, 404); }
}

class ConflictError extends AppError {
    constructor(message) { super(message, 409); }
}

class ValidationError extends AppError {
    constructor(message, fieldErrors = null) {
        super(message, 422);
        this.fieldErrors = fieldErrors;
    }
}

module.exports = { AppError, BadRequestError, UnauthorizedError, NotFoundError, ConflictError, ValidationError };
