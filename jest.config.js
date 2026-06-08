module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.unit.test.js'],
    setupFilesAfterEnv: ['./tests/setup/setup.unit.js'],
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    coverageProvider: 'v8',
    collectCoverageFrom: ['src/**/*.js'],
    coveragePathIgnorePatterns: [
        'tests/',
        'src/app.js',
        'src/routes/',
        'src/config/',
    ],
};
