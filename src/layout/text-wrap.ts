import { measureTextWidth, findMaxFitIndex } from './text-measure';

export interface WrapTextOptions {
  text: string;
  maxWidth: number;
  fontSize: number;
  fontFamily?: string;
  isBold?: boolean;
  letterSpacing?: number;
  maxLines?: number;
}

export interface WrappedLineResult {
  text: string;
  width: number;
}

/**
 * Wraps text into lines that strictly conform to maxWidth.
 * Handles paragraph breaks (\n), spaces, long continuous words/tokens, and maxLines truncation.
 */
export function wrapText(options: WrapTextOptions): WrappedLineResult[] {
  const {
    text,
    maxWidth,
    fontSize,
    fontFamily = 'Helvetica',
    isBold = false,
    letterSpacing = 0,
    maxLines,
  } = options;

  if (!text) return [];

  // When width is non-positive or unbounded, return raw lines
  if (maxWidth <= 0) {
    return text.split('\n').map((l) => ({
      text: l,
      width: measureTextWidth(l, fontSize, fontFamily, isBold, letterSpacing),
    }));
  }

  const result: WrappedLineResult[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      result.push({ text: '', width: 0 });
      continue;
    }

    const words = paragraph.split(/\s+/).filter(Boolean);
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = measureTextWidth(candidate, fontSize, fontFamily, isBold, letterSpacing);

      if (candidateWidth <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          result.push({
            text: currentLine,
            width: measureTextWidth(currentLine, fontSize, fontFamily, isBold, letterSpacing),
          });
          currentLine = '';
        }

        // If the single word exceeds maxWidth, break it using binary search fit
        while (word) {
          const wordWidth = measureTextWidth(word, fontSize, fontFamily, isBold, letterSpacing);
          if (wordWidth <= maxWidth) {
            currentLine = word;
            word = '';
            break;
          }

          const k = findMaxFitIndex(word, maxWidth, fontSize, fontFamily, isBold, letterSpacing);
          if (k <= 1 && measureTextWidth(word.slice(0, 1), fontSize, fontFamily, isBold, letterSpacing) > maxWidth) {
            // Even a single character exceeds maxWidth, force emit 1 char
            const char = word.slice(0, 1);
            result.push({
              text: char,
              width: measureTextWidth(char, fontSize, fontFamily, isBold, letterSpacing),
            });
            word = word.slice(1);
          } else {
            const chunk = word.slice(0, k);
            result.push({
              text: chunk,
              width: measureTextWidth(chunk, fontSize, fontFamily, isBold, letterSpacing),
            });
            word = word.slice(k);
          }
        }
      }

      // Check maxLines limit
      if (maxLines && result.length >= maxLines) {
        break;
      }
    }

    if (currentLine && (!maxLines || result.length < maxLines)) {
      result.push({
        text: currentLine,
        width: measureTextWidth(currentLine, fontSize, fontFamily, isBold, letterSpacing),
      });
    }

    if (maxLines && result.length >= maxLines) {
      break;
    }
  }

  // Handle maxLines truncation indicator (...)
  if (maxLines && result.length >= maxLines) {
    result.length = maxLines;
    const last = result[maxLines - 1];
    if (last && !last.text.endsWith('...')) {
      last.text = `${last.text.slice(0, Math.max(0, last.text.length - 3))}...`;
      last.width = measureTextWidth(last.text, fontSize, fontFamily, isBold, letterSpacing);
    }
  }

  return result;
}
