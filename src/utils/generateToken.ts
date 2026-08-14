import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "../types";

export const generateToken = (payload: {
  id: string;
  role: UserRole;
  name: string;
  email: string;
}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
};
