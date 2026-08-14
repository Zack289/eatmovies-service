import { Response } from "express";
import Interaction from "../models/Interaction";
import Media from "../models/Media";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthedRequest, InteractionKind } from "../types";

const COUNT_FIELD: Record<InteractionKind, string> = {
  favorite: "favoriteCount",
  watched: "watchedCount",
  wishlist: "wishlistCount",
};

const isValidKind = (kind: string): kind is InteractionKind =>
  ["favorite", "watched", "wishlist"].includes(kind);

/** Toggles an interaction (favorite/watched/wishlist) for the current user. */
export const toggleInteraction = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { mediaId, kind } = req.params as { mediaId: string; kind: string };

  if (!isValidKind(kind)) throw new ApiError(400, "Invalid interaction type");

  const media = await Media.findById(mediaId);
  if (!media) throw new ApiError(404, "We couldn't find that title");

  const existing = await Interaction.findOne({ user: req.user!.id, media: mediaId, kind });

  if (existing) {
    await existing.deleteOne();
    await Media.findByIdAndUpdate(mediaId, { $inc: { [COUNT_FIELD[kind]]: -1 } });
    res.json({ success: true, data: { active: false } });
    return;
  }

  await Interaction.create({ user: req.user!.id, media: mediaId, kind });
  await Media.findByIdAndUpdate(mediaId, { $inc: { [COUNT_FIELD[kind]]: 1 } });
  res.json({ success: true, data: { active: true } });
});

/** Returns the current user's interaction state for a single media item. */
export const getMediaInteractionState = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { mediaId } = req.params;
  const interactions = await Interaction.find({ user: req.user!.id, media: mediaId });
  const state = { favorite: false, watched: false, wishlist: false };
  interactions.forEach((i) => {
    state[i.kind] = true;
  });
  res.json({ success: true, data: state });
});

/** Returns the current user's saved media for a given tab (favorites/watched/wishlist). */
export const listUserInteractions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { kind } = req.params as { kind: string };
  if (!isValidKind(kind)) throw new ApiError(400, "Invalid interaction type");

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

  const [interactions, total] = await Promise.all([
    Interaction.find({ user: req.user!.id, kind })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: "media", populate: { path: "addedBy", select: "name avatar" } }),
    Interaction.countDocuments({ user: req.user!.id, kind }),
  ]);

  const items = interactions.map((i) => i.media).filter(Boolean);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});
