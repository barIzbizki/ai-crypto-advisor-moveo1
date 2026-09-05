require('dotenv').config();

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://postgres:postgres@localhost:5434/moveo1';
const DEFAULT_LOCAL_CORS_ORIGIN = 'http://localhost:5173';
const DEFAULT_LOCAL_JWT_SECRET = 'dev-only-insecure-secret-do-not-use-in-production';

function loadConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';

  const portRaw = process.env.PORT || '3000';
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT: "${portRaw}" is not a positive integer`);
  }

  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    if (nodeEnv === 'production') {
      throw new Error('Missing required environment variable: DATABASE_URL');
    }
    // Local/test fallback so the app can run without extra setup.
    databaseUrl = DEFAULT_LOCAL_DATABASE_URL;
  }
  if (!/^postgres(ql)?:\/\/.+/.test(databaseUrl)) {
    throw new Error(`Invalid DATABASE_URL: "${databaseUrl}" is not a valid PostgreSQL connection string`);
  }

  // Local/dev fallback matching the frontend's default Vite dev server origin.
  const corsOrigin = process.env.CORS_ORIGIN || DEFAULT_LOCAL_CORS_ORIGIN;

  let jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (nodeEnv === 'production') {
      throw new Error('Missing required environment variable: JWT_SECRET');
    }
    // Local/test fallback so the app can run without extra setup.
    jwtSecret = DEFAULT_LOCAL_JWT_SECRET;
  }

  return { nodeEnv, port, databaseUrl, corsOrigin, jwtSecret };
}

module.exports = { loadConfig };
