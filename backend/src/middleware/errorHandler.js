// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = status < 500 && err.message ? err.message : 'Internal server error';

  res.status(status).json({ error: { message } });
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };
