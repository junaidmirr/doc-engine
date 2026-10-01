import { getCharWidthInPoints } from '../fonts/metrics';

/**
 * Accurately measures text width in typographic points.
 * Uses exact glyph metric calculations that work identically in Browser, Node.js, and Workers.
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily = 'Helvetica',
  isBold = false,
  letterSpacing = 0
): number {
  if (!text) return 0;

  let totalWidth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    totalWidth += getCharWidthInPoints(char, fontFamily, fontSize, isBold);
  }

  if (letterSpacing !== 0 && text.length > 1) {
    totalWidth += (text.length - 1) * letterSpacing;
  }

  return totalWidth;
}

/**
 * Finds the maximum number of characters from the start of a word that fit within maxWidth.
 * Employs binary search for fast O(log N) evaluation on arbitrarily long unbroken strings (e.g. URLs).
 */
export function findMaxFitIndex(
  word: string,
  maxWidth: number,
  fontSize: number,
  fontFamily = 'Helvetica',
  isBold = false,
  letterSpacing = 0
): number {
  if (!word || maxWidth <= 0) return 0;

  // Cap maximum possible characters based on minimum character width
  const minCharWidth = Math.max(0.5, fontSize * 0.1);
  const maxPossibleChars = Math.max(10, Math.floor(maxWidth / minCharWidth) + 20);
  const searchWord = word.slice(0, Math.min(word.length, maxPossibleChars));

  let low = 1;
  let high = searchWord.length;
  let best = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = searchWord.slice(0, mid);
    const w = measureTextWidth(candidate, fontSize, fontFamily, isBold, letterSpacing);

    if (w <= maxWidth) {
      best = mid;
      low = mid + 1; // Try longer slice
    } else {
      high = mid - 1; // Slice too wide
    }
  }

  return best;
}
