// Runs before every test file: the app refuses to start without these (see src/config/env.js)
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.MAX_FILE_MB = '10';
