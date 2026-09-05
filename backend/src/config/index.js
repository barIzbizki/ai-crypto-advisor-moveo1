require('dotenv').config();

const DEFAULT_LOCAL_DATABASE_URL = 'postgres://postgres:postgres@localhost:5434/moveo1';

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

  return { nodeEnv, port, databaseUrl };
}

module.exports = { loadConfig };
