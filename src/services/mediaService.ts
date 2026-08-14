import { FilterQuery } from "mongoose";
import Media from "../models/Media";
import { IMedia } from "../types";

export interface MediaQueryOptions {
  type?: string;
  genre?: string;
  country?: string;
  industry?: string;
  search?: string;
  addedBy?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: "trending" | "recent" | "az";
}

/** Builds a Mongo filter + pagination from query params. Keeps controllers thin. */
export const buildMediaQuery = (opts: MediaQueryOptions) => {
  const filter: FilterQuery<IMedia> = {};

  filter.status = opts.status || "published";

  if (opts.type && opts.type !== "all") filter.type = opts.type;
  if (opts.genre) filter.genres = opts.genre;
  if (opts.country) filter.countries = opts.country;
  if (opts.industry) filter.industry = opts.industry;
  if (opts.addedBy) filter.addedBy = opts.addedBy;

  if (opts.search) {
    const regex = new RegExp(opts.search.trim(), "i");
    filter.$or = [
      { title: regex },
      { genres: regex },
      { countries: regex },
      { industry: regex },
    ];
  }

  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(50, Math.max(1, opts.limit || 20));
  const skip = (page - 1) * limit;

  let sort: Record<string, 1 | -1> = { createdAt: -1 };
  if (opts.sort === "trending") {
    sort = { favoriteCount: -1, watchedCount: -1, createdAt: -1 };
  } else if (opts.sort === "az") {
    sort = { title: 1 };
  }

  return { filter, page, limit, skip, sort };
};

export const runMediaQuery = async (opts: MediaQueryOptions) => {
  const { filter, page, limit, skip, sort } = buildMediaQuery(opts);
  const [items, total] = await Promise.all([
    Media.find(filter).sort(sort).skip(skip).limit(limit).populate("addedBy", "name avatar"),
    Media.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
