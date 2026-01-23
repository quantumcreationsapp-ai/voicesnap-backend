const crypto = require('crypto');

const auth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_SECRET_KEY;

  // Check if API key is provided
  if (!apiKey || !expectedKey) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid API key',
      code: 'UNAUTHORIZED'
    });
  }

  // Use timing-safe comparison to prevent timing attacks
  const apiKeyBuffer = Buffer.from(apiKey);
  const expectedKeyBuffer = Buffer.from(expectedKey);

  // Keys must be same length for timingSafeEqual
  if (apiKeyBuffer.length !== expectedKeyBuffer.length) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid API key',
      code: 'UNAUTHORIZED'
    });
  }

  if (!crypto.timingSafeEqual(apiKeyBuffer, expectedKeyBuffer)) {
    return res.status(401).json({
      error: 'Unauthorized - Invalid API key',
      code: 'UNAUTHORIZED'
    });
  }

  next();
};

module.exports = auth;
