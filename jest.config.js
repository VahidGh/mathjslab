/**
 * jest.config.js: Jest configuration.
 */

module.exports = {
    preset: 'ts-jest',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    testEnvironment: 'node',
};
