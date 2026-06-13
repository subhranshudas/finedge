const { OBJECT_ID_VALIDATORS } = require('../validators/common.validator');
const { BadRequestError } = require('../errors');

const validateId = (req, res, next) => {
    const result = OBJECT_ID_VALIDATORS.MONGOOSE.safeParse(req.params.id);
    if (!result.success) {
        return next(new BadRequestError('Invalid ID format'));
    }
    next();
};

module.exports = validateId;
