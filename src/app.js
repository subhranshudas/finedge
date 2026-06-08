const express = require('express');
const loggerMiddleware = require('./middlewares/logger.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());
app.use(loggerMiddleware);

// TODO: mount routes here


// 404 fallback
app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

// Central error handler — must be last
app.use(errorMiddleware);

module.exports = app;
