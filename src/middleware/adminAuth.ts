import { Response, NextFunction } from "express";
import { AuthedRequest } from "../types";
import { ApiError } from "../utils/ApiError";

/** Must be used AFTER requireAuth. Verifies the authenticated user is an admin. */
export const requireAdmin = (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }
  if (req.user.role !== "admin") {
    return next(new ApiError(403, "Admin access required"));
  }
  next();
};
