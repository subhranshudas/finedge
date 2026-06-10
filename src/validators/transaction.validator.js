const { z } = require('zod');
const { TRANSACTION_TYPES } = require('../models/transaction.model');

const createTransactionSchema = z.object({
    type:        z.enum(Object.values(TRANSACTION_TYPES), { message: 'Type must be income or expense' }),
    category:    z.string().min(1, 'Category is required').trim().toLowerCase(),
    amount:      z.number().positive('Amount must be greater than 0'),
    transactionDate: z.coerce.date({ message: 'Invalid date' })
                      .refine(date => date <= new Date(), { message: 'Transaction date cannot be in the future' }),
    description: z.string().trim().toLowerCase().optional(),
});

const updateTransactionSchema = z.object({
    type:        z.enum(Object.values(TRANSACTION_TYPES), { message: 'Type must be income or expense' }).optional(),
    category:    z.string().min(1, 'Category is required').trim().toLowerCase().optional(),
    amount:      z.number().positive('Amount must be greater than 0').optional(),
    transactionDate: z.coerce.date({ message: 'Invalid date' })
                      .refine(date => date <= new Date(), { message: 'Transaction date cannot be in the future' })
                      .optional(),
    description: z.string().trim().toLowerCase().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = { createTransactionSchema, updateTransactionSchema };
