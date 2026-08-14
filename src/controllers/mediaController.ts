import { Response } from "express";
import Media from "../models/Media";
import Interaction from "../models/Interaction";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthedRequest } from "../types";
import { runMediaQuery } from "../services/mediaService";
import { getRecommendationsForUser, getPopularRecommendations } from "../services/recommendationService";
import { normalizeTitle } from "../utils/normalizeTitle";

const GENRE_MIN = 1;
const MIN_YEAR = 1888;
const MAX_YEAR = new Date().getFullYear() + 5;

/**
 * Throws a friendly 409 if a title with the same name + type already
 * exists (using the same strict normalization as the database's unique
 * index — see utils/normalizeTitle.ts), so users see a clear message
 * instead of a raw duplicate-key error.
 */
const assertNoDuplicateTitle = async (
  title: string,
  type: string,
  excludeId?: string
) => {
  const query: Record<string, unknown> = {
    normalizedTitle: normalizeTitle(title),
    type,
  };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Media.findOne(query).select("_id title");
  if (existing) {
    throw new ApiError(
      409,
      `"${existing.title}" is already on eatMovies. Search for it instead of adding a duplicate.`
    );
  }
};

const validateMediaPayload = (body: Record<string, unknown>, isUpdate = false) => {
  const errors: string[] = [];
  const type = body.type as string;

  if (!isUpdate || body.title !== undefined) {
    if (!body.title || String(body.title).trim().length < 1) errors.push("Title is required");
    if (String(body.title || "").length > 150) errors.push("Title is too long");
  }
  if (!isUpdate || body.description !== undefined) {
    if (!body.description || String(body.description).trim().length < 10) {
      errors.push("Description should be at least 10 characters");
    }
  }
  if (!isUpdate || body.genres !== undefined) {
    if (!Array.isArray(body.genres) || body.genres.length < GENRE_MIN) {
      errors.push("At least one genre is required");
    }
  }
  if (!isUpdate || body.countries !== undefined) {
    if (!Array.isArray(body.countries) || body.countries.length < 1) {
      errors.push("At least one country is required");
    }
  }

  if (!isUpdate) {
    if (!type || !["movie", "series"].includes(type)) {
      errors.push("Media type must be 'movie' or 'series'");
    }
    if (type === "movie") {
      const year = Number(body.releaseYear);
      if (!body.releaseYear || Number.isNaN(year)) {
        errors.push("Release year is required for movies");
      } else if (year < MIN_YEAR || year > MAX_YEAR) {
        errors.push(`Release year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
      }
    }
    if (type === "series") {
      if (!body.startYear) errors.push("Starting year is required for TV series");
      if (!body.ongoing && body.endYear && body.startYear) {
        if (Number(body.endYear) < Number(body.startYear)) {
          errors.push("Ending year cannot be before starting year");
        }
      }
    }
    if (!body.poster) errors.push("Poster image is required");
  } else if (body.releaseYear !== undefined) {
    // Editing an existing movie's release year.
    const year = Number(body.releaseYear);
    if (Number.isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
      errors.push(`Release year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
    }
  }

  if (errors.length) throw new ApiError(400, "Validation failed", errors);
};

export const listMedia = asyncHandler(async (req, res: Response) => {
  const { type, genre, country, industry, search, sort, page, limit } = req.query as Record<
    string,
    string
  >;

  const result = await runMediaQuery({
    type,
    genre,
    country,
    industry,
    search,
    sort: sort as "trending" | "recent" | "az" | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({ success: true, data: result.items, pagination: result.pagination });
});

/** Lightweight, debounced-friendly live search for the search bar dropdown. */
export const searchSuggestions = asyncHandler(async (req, res: Response) => {
  const q = String(req.query.q || "").trim();
  if (!q) {
    res.json({ success: true, data: [] });
    return;
  }
  const regex = new RegExp(q, "i");
  const results = await Media.find({
    status: "published",
    $or: [{ title: regex }, { genres: regex }, { countries: regex }, { industry: regex }],
  })
    .select("title type poster releaseYear startYear endYear ongoing")
    .limit(8);

  res.json({ success: true, data: results });
});

export const getMediaById = asyncHandler(async (req, res: Response) => {
  const media = await Media.findById(req.params.id).populate("addedBy", "name avatar");
  if (!media) throw new ApiError(404, "We couldn't find that title");
  res.json({ success: true, data: media });
});

export const createMedia = asyncHandler(async (req: AuthedRequest, res: Response) => {
  validateMediaPayload(req.body);
  await assertNoDuplicateTitle(req.body.title, req.body.type);

  const media = await Media.create({ ...req.body, addedBy: req.user!.id });
  res.status(201).json({ success: true, data: media });
});

export const updateMedia = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw new ApiError(404, "We couldn't find that title");

  const isOwner = media.addedBy.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only edit your own submissions");
  }

  validateMediaPayload(req.body, true);

  if (req.body.title && req.body.title !== media.title) {
    await assertNoDuplicateTitle(req.body.title, media.type, media._id.toString());
  }

  Object.assign(media, req.body);
  await media.save();
  res.json({ success: true, data: media });
});

export const deleteMedia = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const media = await Media.findById(req.params.id);
  if (!media) throw new ApiError(404, "We couldn't find that title");

  const isOwner = media.addedBy.toString() === req.user!.id;
  const isAdmin = req.user!.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only delete your own submissions");
  }

  await Interaction.deleteMany({ media: media._id });
  await media.deleteOne();
  res.json({ success: true, data: { id: req.params.id } });
});

export const getRecommendations = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const data = req.user
    ? await getRecommendationsForUser(req.user.id, limit)
    : await getPopularRecommendations(limit);
  res.json({ success: true, data });
});
