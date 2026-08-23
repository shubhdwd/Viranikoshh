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

    // 4. Create user + empty profile
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        profile: {
          create: {}, // empty profile, user can fill later
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tokenVersion: true,
        createdAt: true,
        profile: true,
      },
    });

    // 5. Sign JWT
    const token = signToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    setAuthCookie(res, token);
    sendSuccess(res, 201, "User registered successfully.", { user, token });
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

    // Don't return password in response
    const { password: _, ...userWithoutPassword } = user;

    setAuthCookie(res, token);
    sendSuccess(res, 200, "Login successful.", {
      user: userWithoutPassword,
      token,
    });
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
