const { Pool } = require('pg');

// Render's managed Postgres presents a self-signed certificate, so the
// default `pg` TLS verification (which trusts only well-known CAs) rejects
// the connection in production unless we relax verification.
function createPool(databaseUrl, nodeEnv) {
  const ssl = nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined;
  return new Pool({ connectionString: databaseUrl, ssl });
}

async function verifyConnection(pool) {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

module.exports = { createPool, verifyConnection };
