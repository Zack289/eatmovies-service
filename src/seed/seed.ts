import dotenv from "dotenv";
dotenv.config();

import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import User from "../models/User";
import Media from "../models/Media";
import Interaction from "../models/Interaction";
import { seedMedia } from "./seedData";
import { fetchBestPosterMatch } from "../services/externalMediaService";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  await connectDB();

  console.log("Clearing existing media & interactions...");
  await Interaction.deleteMany({});
  await Media.deleteMany({});

  // --- Admin bootstrap ---------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  let admin = adminEmail ? await User.findOne({ email: adminEmail.toLowerCase() }) : null;

  if (!admin) {
    if (!adminEmail || !adminPassword) {
      console.warn(
        "ADMIN_EMAIL / ADMIN_PASSWORD not set in service/.env — creating a demo curator account instead. Set those env vars and re-run to bootstrap a real admin."
      );
      const passwordHash = await bcrypt.hash("changeme123", 10);
      admin = await User.create({
        name: "eatMovies Curator",
        email: "curator@eatmovies.demo",
        passwordHash,
        role: "admin",
      });
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      admin = await User.create({
        name: adminName,
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: "admin",
      });
      console.log(`Admin account created: ${admin.email}`);
    }
  } else {
    console.log(`Admin account already exists: ${admin.email}`);
  }

  // --- Seed media ----------------------------------------------------------
  const useTmdb = Boolean(process.env.TMDB_API_KEY);

  if (useTmdb) {
    console.log("TMDB_API_KEY detected — fetching real posters for seed titles...");
  } else {
    console.log(
      "No TMDB_API_KEY set — seeding with placeholder posters. Add TMDB_API_KEY to service/.env and re-seed for real poster art (see README)."
    );
  }

  console.log(`Seeding ${seedMedia.length} media items...`);

  const docs: (typeof seedMedia[number] & { addedBy: Types.ObjectId })[] = [];
  let matched = 0;

  for (const m of seedMedia) {
    let poster = m.poster; // placeholder fallback already in seedData.ts

    if (useTmdb) {
      const expectedYear = m.type === "movie" ? m.releaseYear : m.startYear;
      try {
        const realPoster = await fetchBestPosterMatch(m.title, m.type, expectedYear);
        if (realPoster) {
          poster = realPoster;
          matched++;
        } else {
          console.warn(`  No TMDB match for "${m.title}" — keeping placeholder poster.`);
        }
      } catch (err) {
        console.warn(`  TMDB lookup failed for "${m.title}": ${(err as Error).message}`);
      }
      await delay(260); // stay comfortably under TMDB's rate limit
    }

    docs.push({ ...m, poster, addedBy: admin!._id });
  }

  if (useTmdb) {
    console.log(`Matched real posters for ${matched}/${seedMedia.length} titles.`);
  }

  await Media.insertMany(docs, { ordered: false });

  console.log("Seed complete.");
  console.log(`Log in as: ${admin!.email}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
