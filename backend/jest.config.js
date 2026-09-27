module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/helpers/env.js'],
  testTimeout: 60000, // mongodb-memory-server's first-run binary download can be slow
  testPathIgnorePatterns: ['/node_modules/']
};
