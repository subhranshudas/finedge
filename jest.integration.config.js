module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.integration.test.js'],
    setupFilesAfterEnv: ['./tests/setup/setup.integration.js'],
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    coverageProvider: 'v8',
    collectCoverageFrom: ['src/**/*.js'],
    coveragePathIgnorePatterns: ['tests/'],
};
