const express = require('express');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const userRoute = require('./routes/user.route');
const transactionRoute = require('./routes/transaction.route');

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/users', userRoute);
app.use('/api/v1/transactions', transactionRoute);


// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

// Central error handler — must be last
app.use(errorMiddleware);

module.exports = app;
