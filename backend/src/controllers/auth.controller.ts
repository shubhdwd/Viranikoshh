import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { ZodError } from "zod";

// Detect whether we're running on a deployed host (Render, Railway, Fly, etc.)
// rather than a local dev machine.  NODE_ENV alone is unreliable because the
// .env file ships with NODE_ENV=development and Render may not override it.
const isDeployed =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
const cookieSecure = isDeployed; // Render always serves over HTTPS
const cookieSameSite: "none" | "lax" = isDeployed ? "none" : "lax";

console.log(
  "[AUTH] Cookie config -",
  "NODE_ENV=" + process.env.NODE_ENV,
  "RENDER=" + (process.env.RENDER || "(unset)"),
  "isDeployed=" + isDeployed,
  "secure=" + cookieSecure,
  "sameSite=" + cookieSameSite
);

const isProd = isDeployed;

function setAuthCookie(res: Response, token: string): void {
  const opts = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  console.log("[AUTH] setAuthCookie options:", JSON.stringify(opts));
  res.cookie("auth_token", token, opts);
}

function clearAuthCookie(res: Response): void {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    path: "/",
  });
}

/**
 * POST /api/auth/register
 *
 * Validate input → check email uniqueness → hash password →
 * create User + Profile → sign JWT → return token + user data
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    console.log("[Register] Request body keys:", Object.keys(req.body));
    console.log("[Register] Received:", JSON.stringify({ ...req.body, password: req.body.password ? "***" : undefined }));

    const parsed = registerSchema.parse(req.body);

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existingUser) {
      sendError(res, 409, "Email already registered.");
      return;
    }

    // 3. Hash password
    const hashedPassword = await hashPassword(parsed.password);

    // 4. Create user + profile with optional fields
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        profile: {
          create: {
            region: parsed.region,
            languages: parsed.languages ?? [],
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    // 4b. Link cultural interests (lookup CulturalCategory by name)
    // Frontend sends slugs (e.g. "folk-song") — convert to DB display names (e.g. "Folk Song")
    if (parsed.interests && parsed.interests.length > 0) {
      const SLUG_TO_NAME: Record<string, string> = {
        "folk-story": "Folk Story",
        "folk-song": "Folk Song",
        "oral-tradition": "Oral Tradition",
        artwork: "Regional Artwork",
        craft: "Craft",
        festival: "Festival",
        "local-history": "Local History",
        "traditional-practice": "Traditional Practice",
      };
      const categoryNames = parsed.interests.map((s) => SLUG_TO_NAME[s] ?? s);
      const categories = await prisma.culturalCategory.findMany({
        where: { name: { in: categoryNames } },
        select: { id: true },
      });
      if (categories.length > 0) {
        await prisma.interest.createMany({
          data: categories.map((c) => ({ userId: user.id, categoryId: c.id })),
          skipDuplicates: true,
        });
      }
    }

    // 5. Sign JWT (fetch tokenVersion separately — not exposed to client)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tokenVersion: true },
    });
    const token = signToken({
      id: user.id,
      role: user.role,
      tokenVersion: dbUser!.tokenVersion,
    });

    setAuthCookie(res, token);

    // In non-production environments include the token in the response body
    // so that Playwright E2E tests can use it for direct API calls.
    const payload: Record<string, unknown> = { user };
    if (!isProd) payload.token = token;

    sendSuccess(res, 201, "User registered successfully.", payload);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 *
 * Validate input → find user → compare password → sign JWT → return token
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Validate input
    const parsed = loginSchema.parse(req.body);

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    if (!user) {
      sendError(res, 401, "Invalid email or password.");
      return;
    }

    // 3. Compare password
    const isMatch = await comparePassword(parsed.password, user.password);

    if (!isMatch) {
      sendError(res, 401, "Invalid email or password.");
      return;
    }

    // 4. Sign JWT
    const token = signToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // Don't return password or tokenVersion in response
    const { password: _, tokenVersion: __, ...userWithoutPassword } = user;

    setAuthCookie(res, token);

    // In non-production environments include the token in the response body
    // so that Playwright E2E tests can use it for direct API calls.
    const payload: Record<string, unknown> = { user: userWithoutPassword };
    if (!isProd) payload.token = token;

    sendSuccess(res, 200, "Login successful.", payload);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * GET /api/auth/me
 *
 * Auth middleware required → return current user from JWT payload
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        interests: {
          select: { category: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 404, "User not found.");
      return;
    }

    sendSuccess(res, 200, "User profile fetched.", user);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 *
 * Increment tokenVersion to revoke all currently active tokens for this user.
 * The client is also responsible for dropping the token locally.
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    clearAuthCookie(res);
    sendSuccess(res, 200, "Logged out successfully.");
  } catch (error) {
    next(error);
  }
}
