const { loadConfig } = require('./config');
const { createPool, verifyConnection } = require('./db/pool');
const { createApp } = require('./app');

function describeError(err) {
  if (err.errors && err.errors.length) {
    return err.errors.map((e) => e.message || e.code).join('; ');
  }
  return err.message || err.code || String(err);
}

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(`Configuration error: ${err.message}`);
    process.exit(1);
  }

  const pool = createPool(config.databaseUrl);
  try {
    await verifyConnection(pool);
  } catch (err) {
    console.error(`Database connection error: ${describeError(err)}`);
    process.exit(1);
  }

  const app = createApp(pool, config);
  app.listen(config.port, () => {
    console.log(`[${config.nodeEnv}] backend listening on port ${config.port}`);
  });
}

main();
