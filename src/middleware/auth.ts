import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthedRequest, UserRole } from "../types";
import { ApiError } from "../utils/ApiError";

interface TokenPayload {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}

/** Requires a valid JWT. Attaches req.user. */
export const requireAuth = (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired session"));
  }
};

/** Optional auth: attaches req.user if a valid token is present, but never rejects. */
export const optionalAuth = (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) return next();

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};
