import Media from "../models/Media";
import Interaction from "../models/Interaction";
import { IMedia } from "../types";
import { Types } from "mongoose";

/**
 * A simple, explainable recommendation engine.
 *
 * It is intentionally isolated from controllers/components so it can later
 * be swapped for a more sophisticated (e.g. ML-based) engine without
 * touching any calling code — callers only depend on the two exported
 * functions below.
 */

const WEIGHTS = {
  genre: 3,
  industry: 2,
  country: 2,
  type: 1,
  favorite: 4,
  wishlist: 3,
  watched: 2,
  popularity: 1,
  recency: 1,
};

const scoreCandidate = (
  candidate: IMedia,
  profile: {
    genres: Map<string, number>;
    industries: Map<string, number>;
    countries: Map<string, number>;
    types: Map<string, number>;
  }
): number => {
  let score = 0;

  for (const g of candidate.genres) {
    if (profile.genres.has(g)) score += WEIGHTS.genre * (profile.genres.get(g) || 1);
  }
  if (candidate.industry && profile.industries.has(candidate.industry)) {
    score += WEIGHTS.industry * (profile.industries.get(candidate.industry) || 1);
  }
  for (const c of candidate.countries) {
    if (profile.countries.has(c)) score += WEIGHTS.country * (profile.countries.get(c) || 1);
  }
  if (profile.types.has(candidate.type)) {
    score += WEIGHTS.type * (profile.types.get(candidate.type) || 1);
  }

  // Popularity (log-scaled so one viral title doesn't dominate everything)
  const popularity = candidate.favoriteCount + candidate.watchedCount + candidate.wishlistCount;
  score += WEIGHTS.popularity * Math.log10(popularity + 1);

  // Recency: newer items get a small boost
  const ageDays = (Date.now() - new Date(candidate.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  score += WEIGHTS.recency * Math.max(0, 1 - ageDays / 90);

  return score;
};

/** Builds a lightweight taste profile from a user's interaction history. */
const buildProfile = async (userId: string) => {
  const interactions = await Interaction.find({ user: userId }).populate("media");

  const genres = new Map<string, number>();
  const industries = new Map<string, number>();
  const countries = new Map<string, number>();
  const types = new Map<string, number>();
  const seenMediaIds = new Set<string>();

  const bump = (map: Map<string, number>, key: string, weight: number) => {
    map.set(key, (map.get(key) || 0) + weight);
  };

  for (const interaction of interactions) {
    const media = interaction.media as unknown as IMedia | null;
    if (!media) continue;
    seenMediaIds.add(media._id.toString());

    const kindWeight =
      interaction.kind === "favorite"
        ? WEIGHTS.favorite
        : interaction.kind === "wishlist"
        ? WEIGHTS.wishlist
        : WEIGHTS.watched;

    media.genres.forEach((g) => bump(genres, g, kindWeight));
    if (media.industry) bump(industries, media.industry, kindWeight);
    media.countries.forEach((c) => bump(countries, c, kindWeight));
    bump(types, media.type, kindWeight);
  }

  return { genres, industries, countries, types, seenMediaIds };
};

/** Personalized recommendations for a logged-in user. */
export const getRecommendationsForUser = async (userId: string, limit = 20) => {
  const profile = await buildProfile(userId);

  const hasSignal = profile.genres.size + profile.industries.size + profile.countries.size > 0;

  if (!hasSignal) {
    return getPopularRecommendations(limit);
  }

  const candidates = await Media.find({
    status: "published",
    _id: { $nin: Array.from(profile.seenMediaIds).map((id) => new Types.ObjectId(id)) },
  })
    .limit(300)
    .lean<IMedia[]>();

  const ranked = candidates
    .map((c) => ({ media: c, score: scoreCandidate(c as IMedia, profile) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.media);

  return ranked;
};

/** Fallback for anonymous visitors or users with no interaction history yet. */
export const getPopularRecommendations = async (limit = 20) => {
  return Media.find({ status: "published" })
    .sort({ favoriteCount: -1, watchedCount: -1, wishlistCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("addedBy", "name avatar");
};
