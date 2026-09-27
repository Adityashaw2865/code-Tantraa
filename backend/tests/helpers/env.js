// Runs before the test framework loads any test file (see jest.config.js -> setupFiles).
process.env.JWT_SECRET = 'test-secret-please-do-not-use-in-real-life-0123456789';
process.env.NODE_ENV = 'test';
process.env.DISABLE_JOBS = 'true';
