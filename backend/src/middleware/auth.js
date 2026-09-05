const jwt = require('jsonwebtoken');

const BEARER_RE = /^Bearer (.+)$/;

function requireAuth(config) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    const match = typeof header === 'string' && header.match(BEARER_RE);

    if (!match) {
      return res.status(401).json({ error: { message: 'Missing or malformed Authorization header' } });
    }

    try {
      const payload = jwt.verify(match[1], config.jwtSecret);
      req.user = { id: payload.sub };
      return next();
    } catch (err) {
      return res.status(401).json({ error: { message: 'Invalid or expired token' } });
    }
  };
}

module.exports = { requireAuth };
