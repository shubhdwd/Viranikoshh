import rateLimit from "express-rate-limit";

// General rate limiter: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Strict rate limiter for sensitive routes: 10 requests per minute per IP
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX || "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to this endpoint, please slow down." },
});

// Very strict limiter for auth routes: 10 requests per minute per IP
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
