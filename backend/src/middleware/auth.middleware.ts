import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/apiResponse";
import { prisma } from "../utils/prisma";

// Extend Express Request to include `user` property
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT Authentication Middleware.
 *
 * Extracts token from `Authorization: Bearer <token>` header,
 * verifies it, then fetches the CURRENT user from the database
 * to ensure the role is up-to-date (not stale from the JWT).
 * Returns 401 on missing/invalid/expired tokens or deleted users.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const hasBearer = Boolean(authHeader && authHeader.startsWith("Bearer "));
    const hasCookie = Boolean(req.cookies?.auth_token);
    const rawCookieHeader = req.headers.cookie ?? "(none)";

    let token: string | undefined;

    if (hasBearer) {
      token = authHeader!.split(" ")[1];
    } else if (hasCookie) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      console.warn(
        `[AUTH] No token — method=${req.method} url=${req.originalUrl}` +
        ` hasBearer=${hasBearer} hasCookie=${hasCookie}` +
        ` origin=${req.headers.origin ?? "(none)"}` +
        ` rawCookie=${rawCookieHeader}`
      );
      sendError(res, 401, "Access denied. No token provided.");
      return;
    }

    const decoded = verifyToken(token);

    // Fetch current user from DB to get the live role (not the stale JWT role)
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, tokenVersion: true },
    });

    if (!dbUser) {
      sendError(res, 401, "User no longer exists.");
      return;
    }

    if (decoded.tokenVersion !== dbUser.tokenVersion) {
      sendError(res, 401, "Token has been revoked.");
      return;
    }

    // Use JWT id (proven by signature) but DB role (current truth)
    req.user = { id: dbUser.id, role: dbUser.role, tokenVersion: dbUser.tokenVersion };
    next();
  } catch (error) {
    // Distinguish JWT errors from unexpected errors (e.g. DB connection failure)
    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError" || error.name === "NotBeforeError")
    ) {
      sendError(res, 401, "Invalid or expired token.");
    } else {
      next(error);
    }
  }
}

/**
 * Optional JWT Authentication Middleware.
 *
 * Attaches `req.user` when a valid `Authorization: Bearer <token>` header is
 * present, but never rejects the request — anonymous callers pass through with
 * `req.user` unset. Useful for public routes that need to know *who* the caller
 * is (e.g. draft visibility on GET /posts/:id).
 */
export async function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      const decoded = verifyToken(token);
      // Verify tokenVersion to respect revocations (same as authMiddleware)
      const dbUser = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, tokenVersion: true },
      });
      if (dbUser && decoded.tokenVersion === dbUser.tokenVersion) {
        req.user = { id: dbUser.id, role: dbUser.role, tokenVersion: dbUser.tokenVersion };
      }
    }
    next();
  } catch {
    // Invalid/expired token → treat as anonymous
    next();
  }
}

/**
 * Role-based authorization middleware.
 *
 * Must be used AFTER authMiddleware. Checks that the authenticated user
 * has one of the required roles. Returns 403 if not.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "Authentication required.");
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 403, "You do not have permission to perform this action.");
      return;
    }
    next();
  };
}
