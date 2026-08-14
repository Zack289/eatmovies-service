import { Response } from "express";
import Media from "../models/Media";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthedRequest } from "../types";

/** Content added by the current user, for the "My Movies & Series" profile tab. */
export const listMyMedia = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 5));

  const [items, total] = await Promise.all([
    Media.find({ addedBy: req.user!.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Media.countDocuments({ addedBy: req.user!.id }),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
