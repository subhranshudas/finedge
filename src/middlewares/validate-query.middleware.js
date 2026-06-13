const { ValidationError } = require('../errors');
const messages = require('../utils/messages');

const validateQuery = (zodSchema) => (req, res, next) => {
    const result = zodSchema.safeParse(req.query);

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        return next(new ValidationError(messages.VALIDATION_FAILED, fieldErrors));
    }

    req.query = result.data;
    next();
};

module.exports = validateQuery;
