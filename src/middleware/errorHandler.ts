import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Something went wrong. Please try again.";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && typeof err === "object" && "name" in err) {
    const anyErr = err as { name: string; message?: string; code?: number };
    if (anyErr.name === "ValidationError") {
      statusCode = 400;
      message = anyErr.message || "Validation failed";
    } else if (anyErr.name === "CastError") {
      statusCode = 400;
      message = "Invalid identifier";
    } else if (anyErr.code === 11000) {
      statusCode = 409;
      message = "That already exists";
    }
  }

  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};
