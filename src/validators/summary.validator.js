const { z } = require('zod');

const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

const notFuture = (val) => new Date(val) <= today();

const summaryQuerySchema = z.object({
    category:  z.string().trim().min(1).optional(),
    // transactions only exist in the past — future dates would always return empty results
    startDate: z.string().date().refine(notFuture, { message: 'startDate cannot be in the future' }).optional(),
    endDate:   z.string().date().refine(notFuture, { message: 'endDate cannot be in the future' }).optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
    },
    // endDate before startDate would always return empty results and is likely a client mistake
    { message: 'startDate must be before or equal to endDate', path: ['startDate'] }
);

module.exports = { summaryQuerySchema };
