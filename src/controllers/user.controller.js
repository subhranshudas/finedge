const userService = require('../services/user.service');
const messages = require('../utils/messages');

const register = async (req, res, next) => {
    try {
        const user = await userService.registerUser(req.body);
        res.status(201).json({ message: messages.USER_CREATED, user });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { token, user } = await userService.loginUser(req.body);
        res.status(200).json({ token, user });
    } catch (err) {
        next(err);
    }
};

module.exports = { register, login };
