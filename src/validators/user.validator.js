const { z } = require('zod');

const registerSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').trim(),
    email: z.string().email('Invalid email address').trim(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    currency: z.string().trim().default('INR'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address').trim(),
    password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
