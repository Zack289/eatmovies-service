import { Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { generateToken } from "../utils/generateToken";
import { AuthedRequest } from "../types";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const register = asyncHandler(async (req, res: Response) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || name.trim().length < 2) {
    throw new ApiError(400, "Name must be at least 2 characters");
  }
  if (!email || !isValidEmail(email)) {
    throw new ApiError(400, "A valid email is required");
  }
  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "An account with that email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    passwordHash,
  });

  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  });

  res.status(201).json({ success: true, data: { user, token } });
});

export const login = asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  });

  res.json({ success: true, data: { user, token } });
});

export const getMe = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = await User.findById(req.user?.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: { user } });
});

export const updateProfile = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, avatar } = req.body as { name?: string; avatar?: string };
  const user = await User.findById(req.user?.id);
  if (!user) throw new ApiError(404, "User not found");

  if (name !== undefined) {
    if (name.trim().length < 2) throw new ApiError(400, "Name must be at least 2 characters");
    user.name = name.trim();
  }
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();
  res.json({ success: true, data: { user } });
});
