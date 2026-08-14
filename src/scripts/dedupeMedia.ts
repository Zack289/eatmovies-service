import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db";
import Media from "../models/Media";
import Interaction from "../models/Interaction";
import { normalizeTitle } from "../utils/normalizeTitle";
import { IMedia } from "../types";

/**
 * One-time migration: finds existing Media documents that would collide
 * under the new strict `{ normalizedTitle, type }` unique index, merges
 * each group into a single surviving document, and deletes the rest.
 *
 * Safe to run on a database with NO duplicates — it will just report
 * "No duplicates found" and do nothing.
 *
 * Run this BEFORE restarting the server for the first time after pulling
 * in the duplicate-prevention feature, if your database has any existing
 * data. Otherwise Mongoose will fail to build the new unique index on
 * startup because real duplicates are already sitting in the collection.
 *
 *   cd service
 *   npm run dedupe
 */

interface MergeSummary {
  keptTitle: string;
  type: string;
  removedCount: number;
}

const run = async () => {
  await connectDB();

  const all = await Media.find().lean<IMedia[]>();
  console.log(`Scanning ${all.length} media documents for duplicates...`);

  const groups = new Map<string, IMedia[]>();
  for (const doc of all) {
    const key = `${normalizeTitle(doc.title)}|${doc.type}`;
    const bucket = groups.get(key) || [];
    bucket.push(doc);
    groups.set(key, bucket);
  }

  const duplicateGroups = Array.from(groups.values()).filter((g) => g.length > 1);

  if (duplicateGroups.length === 0) {
    console.log("No duplicates found. Your data is already clean — safe to restart the server.");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${duplicateGroups.length} title(s) with duplicates. Merging...\n`);

  const summaries: MergeSummary[] = [];

  for (const group of duplicateGroups) {
    // Keep the document with the most engagement (favorites + watched +
    // wishlist); ties broken by whichever was added first, so the oldest,
    // most-interacted-with copy survives and everything else merges into it.
    const [keeper, ...duplicates] = [...group].sort((a, b) => {
      const engagementA = a.favoriteCount + a.watchedCount + a.wishlistCount;
      const engagementB = b.favoriteCount + b.watchedCount + b.wishlistCount;
      if (engagementB !== engagementA) return engagementB - engagementA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    for (const dup of duplicates) {
      // Move each duplicate's interactions onto the keeper. A user can only
      // have one interaction of a given kind per media (enforced by a
      // unique index on Interaction), so if they already favorited/watched/
      // wishlisted the keeper too, the leftover duplicate interaction is
      // just dropped instead of causing a conflict.
      const dupInteractions = await Interaction.find({ media: dup._id });
      for (const interaction of dupInteractions) {
        const alreadyOnKeeper = await Interaction.exists({
          user: interaction.user,
          media: keeper._id,
          kind: interaction.kind,
        });
        if (alreadyOnKeeper) {
          await interaction.deleteOne();
        } else {
          interaction.media = keeper._id;
          await interaction.save();
        }
      }

      await Media.findByIdAndDelete(dup._id);
    }

    // Recompute the keeper's counts from the real, now-merged interaction
    // data rather than summing the old (possibly stale) counters.
    const [favoriteCount, watchedCount, wishlistCount] = await Promise.all([
      Interaction.countDocuments({ media: keeper._id, kind: "favorite" }),
      Interaction.countDocuments({ media: keeper._id, kind: "watched" }),
      Interaction.countDocuments({ media: keeper._id, kind: "wishlist" }),
    ]);
    await Media.findByIdAndUpdate(keeper._id, { favoriteCount, watchedCount, wishlistCount });

    summaries.push({ keptTitle: keeper.title, type: keeper.type, removedCount: duplicates.length });
  }

  console.log("Merge complete:\n");
  for (const s of summaries) {
    console.log(`  • "${s.keptTitle}" (${s.type}) — removed ${s.removedCount} duplicate(s)`);
  }
  console.log("\nSafe to restart the server now; the unique index will build cleanly.");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Dedupe migration failed:", err);
  process.exit(1);
});
