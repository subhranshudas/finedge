module.exports = {
    // validation
    VALIDATION_FAILED: 'Validation failed',

    // generic errors
    NOT_FOUND: 'Resource not found',
    CONFLICT: 'Resource already exists',
    INTERNAL_ERROR: 'Internal server error',

    // auth
    AUTH_TOKEN_MISSING: 'Authorization token missing',
    AUTH_TOKEN_EXPIRED: 'Token has expired',
    AUTH_TOKEN_INVALID: 'Invalid token',

    // user
    USER_NOT_FOUND: 'User not found',
    USER_CONFLICT: 'Email or username already in use',
    USER_CREATED: 'User registered successfully',
    USER_INVALID_CREDENTIALS: 'Invalid credentials',

    // rate limiting
    RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later.',

    // summary
    SUMMARY_FETCHED: 'Summary fetched successfully',

    // transaction
    TRANSACTION_NOT_FOUND: 'Transaction not found',
    TRANSACTION_CREATED: 'Transaction created successfully',
    TRANSACTION_UPDATED: 'Transaction updated successfully',
    TRANSACTION_DELETED: 'Transaction deleted successfully',
};
