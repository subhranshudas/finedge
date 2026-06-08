module.exports = {
    projects: [
        './jest.config.js',
        './jest.integration.config.js',
    ],
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: ['src/**/*.js'],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        'src/config/',
        'src/app\\.js',
    ],
    coverageDirectory: 'coverage',
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};
