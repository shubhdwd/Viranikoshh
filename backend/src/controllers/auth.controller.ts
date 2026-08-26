import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { signToken } from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { ZodError } from "zod";

const isProd = process.env.NODE_ENV === "production";

function setAuthCookie(res: Response, token: string): void {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: isProd,
    // "none" is required in production so the cookie is sent on cross-origin
    // fetch/XHR requests (Vercel frontend → Render API).  In development the
    // Vite proxy makes requests same-origin, so "lax" is fine and avoids the
    // "Secure" requirement that "none" imposes.
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res: Response): void {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
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
    if (parsed.interests && parsed.interests.length > 0) {
      const categories = await prisma.culturalCategory.findMany({
        where: { name: { in: parsed.interests } },
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
