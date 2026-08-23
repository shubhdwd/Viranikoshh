import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/apiResponse";

/**
 * Global error handler middleware.
 * Catches any unhandled errors and returns a clean JSON response.
 * Must be registered AFTER all routes in app.ts.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("❌ Unhandled error:", err.message);

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Prisma known error codes
  if ((err as any).code === "P2002") {
    sendError(res, 409, "A record with that value already exists.", {
      field: (err as any).meta?.target,
    });
    return;
  }

  if ((err as any).code === "P2025") {
    sendError(res, 404, "Record not found.");
    return;
  }

  sendError(
    res,
    500,
    "Internal server error.",
    process.env.NODE_ENV === "development" ? err.message : undefined
  );
}
