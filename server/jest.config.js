// Jest runs the native ES modules of this project, so no Babel transform is needed.
// Start with: npm test   (Node 18+; the script passes --experimental-vm-modules)
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/jest/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/jest/setupEnv.js'],
  transform: {},
  testTimeout: 15000,
  collectCoverageFrom: ['src/**/*.js'],
};
