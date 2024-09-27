/**
 * jest.config.js: Jest configuration.
 */

// @ts-nocheck

module.exports = {
    preset: 'ts-jest',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.[tj]s$': 'ts-jest',
    },
    testEnvironment: 'node',
};
