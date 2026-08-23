import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import fs from "fs";
import routes from "./routes";
import { UPLOAD_DIR } from "./middleware/upload.middleware";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimit.middleware";
import { prisma } from "./utils/prisma";
import { sendError } from "./utils/apiResponse";
import { verifyToken } from "./utils/jwt";

const app = express();

// Trust first proxy (required for rate-limiting behind nginx/ALB/Cloudflare)
app.set("trust proxy", 1);

// Ensure the local uploads directory exists (used for local disk storage)
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Security headers — configured for an API server that also serves media files
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));

// Permissions-Policy header (not supported by Helmet v8 config — set manually)
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  next();
});

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .filter(Boolean);

// Always allow localhost in development
if (process.env.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5173");
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// General rate limiting on all /api routes
app.use("/api", generalLimiter);

// Serve uploaded files at /files/<category>/<name>
// Access control:
//   - Published post media → public
//   - Draft post media → owner or admin only
//   - Interview audio → owner or admin only (no Media record; stored in InterviewResponse)
app.use("/files", async (req, res, next) => {
  try {
    const requestUrl = `/files${req.url}`;

    // 1. Check if this file belongs to a CulturalPost via the Media table
    const media = await prisma.media.findFirst({
      where: { url: requestUrl },
      select: {
        id: true,
        post: { select: { published: true, userId: true } },
      },
    });

    if (media) {
      if (media.post.published) {
        next();
        return;
      }
      // Draft post — check for owner or admin via Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const decoded = verifyToken(authHeader.split(" ")[1]!);
          if (decoded.id === media.post.userId || decoded.role === "ADMIN") {
            next();
            return;
          }
        } catch { /* invalid token */ }
      }
      sendError(res, 403, "Access denied. This file is not publicly available.");
      return;
    }

    // 2. Check if this file belongs to an InterviewResponse (interview audio)
    const interviewResponse = await prisma.interviewResponse.findFirst({
      where: { audioUrl: requestUrl },
      select: {
        id: true,
        question: {
          select: {
            interview: { select: { userId: true } },
          },
        },
      },
    });

    if (interviewResponse) {
      // Interview audio — always requires owner or admin
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          const decoded = verifyToken(authHeader.split(" ")[1]!);
          if (
            decoded.id === interviewResponse.question.interview.userId ||
            decoded.role === "ADMIN"
          ) {
            next();
            return;
          }
        } catch { /* invalid token */ }
      }
      sendError(res, 403, "Access denied. This interview audio is private.");
      return;
    }

    // 3. No matching record — file does not belong to any known entity
    sendError(res, 404, "File not found.");
  } catch (error) {
    next(error);
  }
});

app.use("/files", express.static(UPLOAD_DIR));

// API Routes
app.use("/api", routes);

// Global Error Handler
app.use(errorHandler);

export default app;
