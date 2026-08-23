import { Response } from "express";

/**
 * Consistent JSON response shape across all endpoints.
 *
 * Success:  { success: true,  message: "...", data: {...} }
 * Error:    { success: false, message: "...", error: "..." }
 */

export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  error?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    message,
    error: error ?? null,
  });
}
