const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const loggerMiddleware = require('./middlewares/logger.middleware');
const messages = require('./utils/messages');
const errorMiddleware = require('./middlewares/error.middleware');
const userRoute = require('./routes/user.route');
const transactionRoute = require('./routes/transaction.route');
const summaryRoute = require('./routes/summary.route');
const env = require('./config/env');

const app = express();

app.use(cors({
    origin: env.CORS_ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
app.use(express.json());
app.use(loggerMiddleware);

// Rate limiter disabled in test environment to avoid 429s during test runs
if (env.NODE_ENV !== 'test') {
    app.use(rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: messages.RATE_LIMIT_EXCEEDED },
    }));
}

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/users', userRoute);
app.use('/api/v1/transactions', transactionRoute);
app.use('/api/v1/summary', summaryRoute);

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

// Central error handler — must be last
app.use(errorMiddleware);

module.exports = app;
