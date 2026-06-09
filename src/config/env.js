require('dotenv').config();

const { cleanEnv, str, port } = require('envalid');

const env = cleanEnv(process.env, {
    PORT: port({ default: 3000 }),
    NODE_ENV: str({ choices: ['development', 'test', 'production'], default: 'development' }),
    MONGO_URI: str(),
    JWT_SECRET: str(),
    JWT_EXPIRY: str({ default: '1h' }),
});

module.exports = env;
