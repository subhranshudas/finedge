const { z } = require('zod');
const mongoose = require('mongoose');


// We can swap the vlaidation stratgey in future
const OBJECT_ID_VALIDATORS = {
    // simple non-empty string check — DB agnostic
    PLAIN: z.string().min(1),

    // uses Mongoose's own ObjectId validation — tied to MongoDB
    MONGOOSE: z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)),
};

module.exports = { OBJECT_ID_VALIDATORS };
