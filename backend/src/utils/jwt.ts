import jwt from "jsonwebtoken";

const _JWT_SECRET = process.env.JWT_SECRET;
if (!_JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = _JWT_SECRET;

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "7d") as jwt.SignOptions["expiresIn"];

export interface JwtPayload {
  id: string;
  role: string;
  tokenVersion: number;
}

/**
 * Sign a JWT with user payload.
 * Returns the signed token string.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT.
 * Returns the decoded payload or throws on invalid/expired tokens.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
}
