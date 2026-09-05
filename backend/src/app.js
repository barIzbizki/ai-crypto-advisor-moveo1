const express = require('express');
const cors = require('cors');
const { createRouter } = require('./routes');
const { notFound } = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');

function createApp(pool, config) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(createRouter(pool));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
