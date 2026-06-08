const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Runs once before all tests in a file.
// Starts an in-memory MongoDB server and connects Mongoose to it.
// No external MongoDB needed — the binary runs inside the test process.
beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
});

// Runs after every individual test.
// Wipes all collections so each test starts with a clean slate.
// Prevents test data from bleeding into subsequent tests.
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});

// Runs once after all tests in a file have finished.
// Disconnects Mongoose and stops the in-memory MongoDB server.
afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});
