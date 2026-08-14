import { Response } from "express";
import User from "../models/User";
import Media from "../models/Media";
import Interaction from "../models/Interaction";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthedRequest } from "../types";
import { runMediaQuery } from "../services/mediaService";

export const getDashboardStats = asyncHandler(async (_req, res: Response) => {
  const [totalUsers, totalMovies, totalSeries, totalInteractions, recentMedia] = await Promise.all([
    User.countDocuments(),
    Media.countDocuments({ type: "movie" }),
    Media.countDocuments({ type: "series" }),
    Interaction.countDocuments(),
    Media.find().sort({ createdAt: -1 }).limit(6).populate("addedBy", "name"),
  ]);

  res.json({
    success: true,
    data: { totalUsers, totalMovies, totalSeries, totalInteractions, recentMedia },
  });
});

export const listUsers = asyncHandler(async (req, res: Response) => {
  const search = String(req.query.search || "").trim();
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const filter = search
    ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const updateUserRole = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { role } = req.body as { role?: string };
  if (!role || !["user", "admin"].includes(role)) {
    throw new ApiError(400, "Role must be 'user' or 'admin'");
  }
  if (req.params.id === req.user!.id) {
    throw new ApiError(400, "You can't change your own role");
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    throw new ApiError(400, "You can't delete your own account here");
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  await Interaction.deleteMany({ user: req.params.id });
  res.json({ success: true, data: { id: req.params.id } });
});

/** Admin view of all media (including hidden items), with the same filters as the public list. */
export const listAllMediaForAdmin = asyncHandler(async (req, res: Response) => {
  const { type, genre, country, industry, search, page, limit, status } = req.query as Record<
    string,
    string
  >;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (type && type !== "all") filter.type = type;
  if (genre) filter.genres = genre;
  if (country) filter.countries = country;
  if (industry) filter.industry = industry;
  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ title: regex }, { genres: regex }, { countries: regex }];
  }

  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limit) || 20));

  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).populate("addedBy", "name email"),
    Media.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
  });
});

export const setMediaStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.body as { status?: string };
  if (!status || !["published", "hidden"].includes(status)) {
    throw new ApiError(400, "Status must be 'published' or 'hidden'");
  }
  const media = await Media.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!media) throw new ApiError(404, "We couldn't find that title");
  res.json({ success: true, data: media });
});

export const adminDeleteMedia = asyncHandler(async (req, res: Response) => {
  const media = await Media.findByIdAndDelete(req.params.id);
  if (!media) throw new ApiError(404, "We couldn't find that title");
  await Interaction.deleteMany({ media: req.params.id });
  res.json({ success: true, data: { id: req.params.id } });
});
