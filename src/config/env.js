require('dotenv').config();

const { cleanEnv, str, port, num } = require('envalid');

const env = cleanEnv(process.env, {
    PORT: port({ default: 3000 }),
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    MONGO_URI: str(),
    JWT_SECRET: str(),
    JWT_EXPIRY: str({ default: '1h' }),
    SUMMARY_CACHE_TTL_MS: num({ default: 60000 }),
    CORS_ALLOWED_ORIGINS: str({ default: 'http://localhost:3000,http://localhost:5173' }),
    RATE_LIMIT_WINDOW_MS: num({ default: 2 * 60 * 1000 }),  // 2 minutes
    RATE_LIMIT_MAX: num({ default: 100 }),
});

module.exports = env;
