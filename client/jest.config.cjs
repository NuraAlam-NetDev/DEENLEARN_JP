module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.jsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleNameMapper: { '\\.(css)$': '<rootDir>/tests/styleMock.js' },
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
};
