/**
 * Load and validate environment variables
 * before initializing any other modules.
 */
const env = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

const start = async () => {
    try {
        await connectDB();

        const server = app.listen(env.PORT, () => {
            console.log(`Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
        });

        server.on('error', (err) => {
            console.error('Server error:', err);
            process.exit(1);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

start();
