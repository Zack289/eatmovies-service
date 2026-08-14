/**
 * Normalizes a title for duplicate detection. Two titles are considered
 * the same submission if they normalize to the same string, so this is
 * intentionally aggressive:
 *
 *  - case-insensitive
 *  - accents/diacritics stripped ("Amélie" === "Amelie")
 *  - punctuation stripped ("Spider-Man: Homecoming" === "Spider Man Homecoming")
 *  - whitespace collapsed and trimmed
 *
 * Used by both the Media model (to populate `normalizedTitle`, which backs
 * a unique database index) and the media controller (to return a friendly
 * error before hitting that index). Keep both in sync by importing this
 * single implementation rather than duplicating the logic.
 */
export const normalizeTitle = (title: string): string =>
  title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // strip punctuation/symbols
    .replace(/\s+/g, " ")
    .trim();
