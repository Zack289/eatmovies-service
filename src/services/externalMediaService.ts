/**
 * Integration with TMDB (The Movie Database) — used to pull real poster
 * art for seed/demo titles instead of random placeholder images.
 *
 * eatMovies' core platform still works entirely off its own MongoDB data
 * by default: nothing in the running app calls this at request time. It's
 * used only by the seed script (service/src/seed/seed.ts) to enrich seed
 * titles with real posters when a TMDB_API_KEY is configured. If no key
 * is set, everything falls back to the placeholder posters in
 * seed/seedData.ts and the app still runs fine.
 *
 * Get a free API key at https://www.themoviedb.org/settings/api (the
 * "API Read Access Token" / v3 "API Key" both work here — this uses the
 * v3 `api_key` query param style).
 *
 * TMDB's terms require attribution — see the footer credit added
 * alongside this integration.
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export interface ExternalSearchResult {
  externalId: string;
  title: string;
  poster: string;
  year?: number;
}

interface TmdbSearchItem {
  id: number;
  title?: string; // movies
  name?: string; // tv
  poster_path?: string | null;
  release_date?: string; // movies, "YYYY-MM-DD"
  first_air_date?: string; // tv, "YYYY-MM-DD"
}

interface TmdbSearchResponse {
  results?: TmdbSearchItem[];
}

const yearFromDateString = (date?: string): number | undefined => {
  if (!date || date.length < 4) return undefined;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
};

/**
 * Searches TMDB for a movie or TV series by title. Returns an empty array
 * (never throws) if no API key is configured or the request fails, so
 * callers can always safely fall back to a placeholder.
 */
export const searchExternalProvider = async (
  query: string,
  type: "movie" | "series" = "movie"
): Promise<ExternalSearchResult[]> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey || !query.trim()) return [];

  const endpoint = type === "series" ? "tv" : "movie";
  const url = `${TMDB_BASE}/search/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(
    query.trim()
  )}&include_adult=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = (await res.json()) as TmdbSearchResponse;
    return (data.results || [])
      .filter((item) => Boolean(item.poster_path))
      .map((item) => ({
        externalId: String(item.id),
        title: (type === "series" ? item.name : item.title) || "",
        poster: `${TMDB_IMAGE_BASE}${item.poster_path}`,
        year: yearFromDateString(type === "series" ? item.first_air_date : item.release_date),
      }));
  } catch {
    // Network error, timeout, or malformed response — caller falls back.
    return [];
  }
};

/**
 * Best-effort poster lookup for a known title. Prefers a result whose
 * release year is close to `expectedYear` (helps disambiguate remakes
 * that share a title), otherwise falls back to the top search result.
 * Returns null if nothing usable was found.
 */
export const fetchBestPosterMatch = async (
  title: string,
  type: "movie" | "series",
  expectedYear?: number
): Promise<string | null> => {
  const results = await searchExternalProvider(title, type);
  if (!results.length) return null;

  if (expectedYear) {
    const closeMatch = results.find(
      (r) => typeof r.year === "number" && Math.abs(r.year - expectedYear) <= 1
    );
    if (closeMatch) return closeMatch.poster;
  }

  return results[0].poster;
};
