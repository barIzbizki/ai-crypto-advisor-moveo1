const { Pool } = require('pg');

function createPool(databaseUrl) {
  return new Pool({ connectionString: databaseUrl });
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
