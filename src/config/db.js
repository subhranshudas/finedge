const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log('MongoDB connected');
        console.log('Host    :', mongoose.connection.host);
        console.log('DB Name :', mongoose.connection.name);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB error:', err.message);
    });

    await mongoose.connect(env.MONGO_URI);
};

module.exports = connectDB;
