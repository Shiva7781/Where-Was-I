const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or malformed Authorization header' });
  }

  if (!process.env.API_KEY) {
    console.error('API_KEY is not configured');
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }

  if (authHeader.slice(7).trim() !== process.env.API_KEY) {
    return res.status(403).json({ success: false, error: 'Invalid API key' });
  }

  next();
};

module.exports = { authenticate };
