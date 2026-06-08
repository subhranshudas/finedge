const { ValidationError } = require('../errors');
const messages = require('../utils/messages');

const validate = (zodSchema) => (req, res, next) => {
    const result = zodSchema.safeParse(req.body);

    if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        return next(new ValidationError(messages.VALIDATION_FAILED, fieldErrors));
    }

    req.body = result.data;
    next();
};

module.exports = validate;
