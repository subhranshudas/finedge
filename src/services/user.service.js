const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwtService = require('./jwt.service');
const { ConflictError, NotFoundError, BadRequestError } = require('../errors');
const messages = require('../utils/messages');

const SALT_ROUNDS = 10;

const registerUser = async ({ username, email, password, currency }) => {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        throw new ConflictError(messages.USER_CONFLICT);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ username, email, passwordHash, currency });

    return { id: user._id, username: user.username, email: user.email, currency: user.currency };
};

const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError(messages.USER_NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new BadRequestError(messages.USER_INVALID_CREDENTIALS);
    }

    const token = jwtService.generateToken({ userId: user._id, email: user.email });

    return { token, user: { id: user._id, username: user.username, email: user.email, currency: user.currency } };
};

module.exports = { registerUser, loginUser };
