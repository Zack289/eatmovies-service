import { Schema, model } from "mongoose";
import { IMedia } from "../types";
import { normalizeTitle } from "../utils/normalizeTitle";

const mediaSchema = new Schema<IMedia>(
  {
    title: { type: String, required: true, trim: true, maxlength: 150, index: true },
    // Aggressively normalized version of `title` (case, accents, and
    // punctuation stripped) used purely for duplicate detection — see
    // utils/normalizeTitle.ts for exactly what it strips and why.
    normalizedTitle: { type: String, required: true },
    type: { type: String, enum: ["movie", "series"], required: true, index: true },
    poster: { type: String, required: true },
    posterPublicId: { type: String },
    description: { type: String, required: true, maxlength: 2000 },
    genres: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one genre is required",
      },
      index: true,
    },
    countries: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: "At least one country is required",
      },
      index: true,
    },
    industry: { type: String, index: true },

    // Movies only store a release YEAR (no month/day) — matches how
    // TV series only ever collect startYear/endYear.
    releaseYear: { type: Number },

    startYear: { type: Number },
    endYear: { type: Number, default: null },
    ongoing: { type: Boolean, default: false },

    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },

    favoriteCount: { type: Number, default: 0 },
    watchedCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mediaSchema.index({ title: "text", description: "text" });

// Hard guarantee at the database level: the same title can't exist twice
// for the same media type, even under concurrent requests. The API layer
// (mediaController) checks this too, so users get a clear error message
// instead of a raw duplicate-key error — this index is the backstop.
//
// The normalization is intentionally strict (case, accents, and
// punctuation all ignored), so "Spider-Man: Homecoming" and "spider man
// homecoming" are treated as the same title. It does NOT factor in year,
// so a legitimate remake sharing an exact title would need a
// distinguishing title (e.g. "The Karate Kid (2010)") to coexist.
mediaSchema.index({ normalizedTitle: 1, type: 1 }, { unique: true });

const MIN_YEAR = 1888; // year of the earliest surviving film
const MAX_YEAR = new Date().getFullYear() + 5;

mediaSchema.pre("validate", function (next) {
  if (this.title) {
    this.normalizedTitle = normalizeTitle(this.title);
  }

  if (this.type === "movie") {
    if (!this.releaseYear) {
      return next(new Error("releaseYear is required for movies"));
    }
    if (this.releaseYear < MIN_YEAR || this.releaseYear > MAX_YEAR) {
      return next(new Error(`releaseYear must be between ${MIN_YEAR} and ${MAX_YEAR}`));
    }
  }
  if (this.type === "series") {
    if (!this.startYear) {
      return next(new Error("startYear is required for TV series"));
    }
    if (this.ongoing) {
      this.endYear = null;
    } else if (this.endYear && this.startYear > this.endYear) {
      return next(new Error("startYear must be <= endYear unless the series is ongoing"));
    }
  }
  next();
});

export default model<IMedia>("Media", mediaSchema);
