const LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 5;

// In-memory store: IP -> array of timestamps
const requests = new Map();

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!requests.has(ip)) {
    requests.set(ip, []);
  }

  const userRequests = requests.get(ip);

  // Filter out timestamps older than the window
  const activeRequests = userRequests.filter((timestamp) => now - timestamp < LIMIT_WINDOW_MS);

  if (activeRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many password reset requests from this IP. Please try again in an hour.',
    });
  }

  // Record current request
  activeRequests.push(now);
  requests.set(ip, activeRequests);

  next();
};

module.exports = rateLimiter;
