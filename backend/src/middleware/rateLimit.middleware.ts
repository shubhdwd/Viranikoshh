import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

// General rate limiter: 100 requests per 15 minutes per IP (relaxed in dev)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : parseInt(process.env.RATE_LIMIT_GENERAL_MAX || "100", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Strict rate limiter for sensitive routes: 10 requests per minute per IP (relaxed in dev)
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 200 : parseInt(process.env.RATE_LIMIT_STRICT_MAX || "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to this endpoint, please slow down." },
});

// Very strict limiter for auth routes: 10 requests per minute per IP (relaxed in dev)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 200 : parseInt(process.env.RATE_LIMIT_AUTH_MAX || "10", 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});
