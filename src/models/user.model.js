const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:     { type: String, required: true, unique: true, trim: true },
    email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    currency:     { type: String, default: 'INR', trim: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
