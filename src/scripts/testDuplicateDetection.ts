import Media from "../models/Media";
import { normalizeTitle } from "../utils/normalizeTitle";

/**
 * Sanity checks for duplicate-title detection that run WITHOUT a database
 * connection. Mongoose can validate a document (running schema-level
 * validators and pre("validate") hooks, including the one that computes
 * `normalizedTitle`) purely in memory — no `mongoose.connect()` needed.
 *
 * This proves the exact logic that will run in production is correct. It
 * does NOT prove the MongoDB unique index itself works (that's a standard,
 * well-tested MongoDB feature, not custom code — nothing to verify there
 * beyond "does the index get built", which happens automatically on
 * connect and is covered by the seed script working).
 *
 *   cd service
 *   npm run test:duplicates
 */

let passed = 0;
let failed = 0;

const check = (label: string, condition: boolean) => {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
};

const baseMovie = {
  poster: "https://example.com/poster.jpg",
  description: "A perfectly ordinary description that is long enough.",
  genres: ["Action"],
  countries: ["USA"],
  addedBy: "000000000000000000000000",
};

const buildMovie = (overrides: Record<string, unknown>) =>
  new Media({ type: "movie", releaseYear: 2020, ...baseMovie, ...overrides });

const buildSeries = (overrides: Record<string, unknown>) =>
  new Media({ type: "series", startYear: 2020, ...baseMovie, ...overrides });

async function run() {
  console.log("1. normalizeTitle() — pairs that SHOULD collide:\n");

  const shouldMatch: [string, string][] = [
    ["Inception", "inception"],
    ["Inception", "  Inception  "],
    ["Inception", "INCEPTION"],
    ["Spider-Man: Homecoming", "Spider Man Homecoming"],
    ["Spider-Man: Homecoming", "spider   man   homecoming"],
    ["Amélie", "Amelie"],
    ["The Grand Budapest Hotel!", "The Grand Budapest Hotel"],
    ["Se7en", "Se7en"],
  ];
  for (const [a, b] of shouldMatch) {
    check(`"${a}" ≈ "${b}"`, normalizeTitle(a) === normalizeTitle(b));
  }

  console.log("\n2. normalizeTitle() — pairs that should NOT collide:\n");

  const shouldNotMatch: [string, string][] = [
    ["Iron Man", "Iron Man 2"],
    ["The Matrix", "The Matrix Reloaded"],
    ["Us", "US"], // still equal after lowercasing on purpose — remove if undesired
  ];
  // "Us" vs "US" lowercases to the same string — that's correct, expected
  // behavior (case-insensitivity is the point), so only assert the first two.
  check(`"${shouldNotMatch[0][0]}" ≠ "${shouldNotMatch[0][1]}"`, normalizeTitle(shouldNotMatch[0][0]) !== normalizeTitle(shouldNotMatch[0][1]));
  check(`"${shouldNotMatch[1][0]}" ≠ "${shouldNotMatch[1][1]}"`, normalizeTitle(shouldNotMatch[1][0]) !== normalizeTitle(shouldNotMatch[1][1]));

  console.log("\n3. Media model pre-validate hook — normalizedTitle gets set on real documents:\n");

  const m1 = buildMovie({ title: "Spider-Man: Homecoming" });
  const m2 = buildMovie({ title: "spider   man   homecoming" });
  await m1.validate();
  await m2.validate();
  check("Both variants produce the same normalizedTitle", m1.normalizedTitle === m2.normalizedTitle);
  check(`normalizedTitle is lowercase/punctuation-free ("${m1.normalizedTitle}")`, m1.normalizedTitle === "spider man homecoming");

  console.log("\n4. Media model validation rules still enforced correctly:\n");

  await check_throws("Movie without releaseYear fails validation", () => buildMovie({ title: "No Year", releaseYear: undefined }).validate());
  await check_throws("Movie with releaseYear before 1888 fails validation", () => buildMovie({ title: "Too Old", releaseYear: 1800 }).validate());
  await check_ok("Movie with a valid releaseYear passes validation", () => buildMovie({ title: "Valid Movie" }).validate());

  await check_throws("Series without startYear fails validation", () => buildSeries({ title: "No Start Year", startYear: undefined }).validate());
  await check_throws(
    "Series with endYear before startYear fails validation",
    () => buildSeries({ title: "Backwards Years", startYear: 2020, endYear: 2015 }).validate()
  );
  await check_ok(
    "Ongoing series with no endYear passes validation",
    () => buildSeries({ title: "Ongoing Show", startYear: 2020, ongoing: true }).validate()
  );

  console.log(`\n${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    console.error("Some checks failed — duplicate detection is NOT working as expected.");
    process.exit(1);
  } else {
    console.log("All checks passed. Duplicate-title normalization and model validation are working correctly.");
    console.log(
      "Note: this does not connect to MongoDB, so it can't verify the unique index itself — that's a standard MongoDB feature that gets built automatically on connect (see `npm run seed` or `npm run dev` output)."
    );
    process.exit(0);
  }
}

async function check_throws(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    failed++;
    console.error(`  ✗ ${label} (expected an error, got none)`);
  } catch {
    passed++;
    console.log(`  ✓ ${label}`);
  }
}

async function check_ok(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${label}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${label} (unexpected error: ${(err as Error).message})`);
  }
}

run();
