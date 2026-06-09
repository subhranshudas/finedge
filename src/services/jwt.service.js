const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY });
};

const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
