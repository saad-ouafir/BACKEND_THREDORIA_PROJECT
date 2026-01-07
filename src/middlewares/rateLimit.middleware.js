const rateLimit = require("express-rate-limit");

global.rateLimitBlocks = global.rateLimitBlocks || {};

const getClientIP = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection.remoteAddress
  );
};

const getUserKey = (req, identifier) => {
  return `${getClientIP(req)}:${identifier || "unknown"}`;
};

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 && hours === 0) parts.push(`${secs}s`);

  return parts.join(" ") || "0s";
};

const formatBlockResponse = (
  errorMessage,
  blockType,
  blockedUntil,
  retryAfter
) => ({
  error: errorMessage,
  blockType,
  blockedUntil: new Date(blockedUntil).toISOString(),
  retryAfter,
  retryAfterFormatted: formatDuration(retryAfter),
});

const createBlock = (blockKey, durationMs, errorMessage, blockType) => {
  const blockedUntil = Date.now() + durationMs;
  global.rateLimitBlocks[blockKey] = blockedUntil;
  const retryAfter = Math.floor(durationMs / 1000);

  return formatBlockResponse(errorMessage, blockType, blockedUntil, retryAfter);
};

const createLimiterConfig = (
  windowMs,
  max,
  blockDurationMs,
  errorMessage,
  blockType,
  keyGen
) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: keyGen,
  handler: (req, res) => {
    const key = keyGen(req);
    const blockKey = `blocked_${blockType}_${key}`;
    res
      .status(429)
      .json(createBlock(blockKey, blockDurationMs, errorMessage, blockType));
  },
});

const apiLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  handler: (req, res) => {
    const blockedUntil = Date.now() + 2 * 60 * 1000;
    res
      .status(429)
      .json(
        formatBlockResponse(
          "Too many requests from this IP, please try again after 2 minutes",
          "API_LIMIT",
          blockedUntil,
          120
        )
      );
  },
});

const authLimiter = rateLimit(
  createLimiterConfig(
    15 * 60 * 1000,
    3,
    60 * 60 * 1000,
    "Too many authentication attempts, please try again after 1 hour",
    "AUTH_LIMIT",
    // (req) => getUserKey(req, req.body?.email || req.body?.username)
    (req) => getUserKey(req,"login")
  )
);

const passwordResetLimiter = rateLimit(
  createLimiterConfig(
    60 * 60 * 1000,
    2,
    24 * 60 * 60 * 1000,
    "Too many password reset attempts, please try again after 24 hours",
    "PASSWORD_RESET_LIMIT",
    (req) => getUserKey(req, req.body?.email)
  )
);

const tokenRefreshLimiter = rateLimit(
  createLimiterConfig(
    10 * 60 * 1000,
    10,
    30 * 60 * 1000,
    "Too many token refresh attempts, please try again after 30 minutes",
    "TOKEN_REFRESH_LIMIT",
    (req) => getClientIP(req)
  )
);

const createAccountLimiter = rateLimit(
  createLimiterConfig(
    30 * 60 * 1000,
    2,
    6 * 60 * 60 * 1000,
    "Too many account creation attempts, please try again after 6 hours",
    "REGISTER_LIMIT",
    (req) => getUserKey(req, req.body?.email)
  )
);

const checkBlock = (req, res, next) => {
  const blocks = global.rateLimitBlocks;
  if (!blocks) return next();

  const now = Date.now();
  const ip = getClientIP(req);
  const email = req.body?.email;
  const username = req.body?.username;

  const checksToPerform = [
    {
      key: `blocked_AUTH_LIMIT_${ip}:${email || username || "unknown"}`,
      type: "AUTH_LIMIT",
      message: "Authentication blocked due to too many failed attempts",
    },
    {
      key: `blocked_PASSWORD_RESET_LIMIT_${ip}:${email || "unknown"}`,
      type: "PASSWORD_RESET_LIMIT",
      message: "Password reset blocked due to too many requests",
    },
    {
      key: `blocked_TOKEN_REFRESH_LIMIT_${ip}`,
      type: "TOKEN_REFRESH_LIMIT",
      message: "Token refresh blocked due to too many requests",
    },
    {
      key: `blocked_REGISTER_LIMIT_${ip}:${email || "unknown"}`,
      type: "REGISTER_LIMIT",
      message: "Account creation blocked due to too many attempts",
    },
  ];

  for (const check of checksToPerform) {
    if (blocks[check.key] && blocks[check.key] > now) {
      const blockedUntil = blocks[check.key];
      const retryAfter = Math.ceil((blockedUntil - now) / 1000);
      return res
        .status(429)
        .json(
          formatBlockResponse(
            check.message,
            check.type,
            blockedUntil,
            retryAfter
          )
        );
    }
  }

  Object.keys(blocks).forEach((key) => {
    if (blocks[key] <= now) delete blocks[key];
  });

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  tokenRefreshLimiter,
  createAccountLimiter,
  checkBlock,
};
