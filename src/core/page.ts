import { PageDimensions, PageOrientation, PageSizeName, Margins } from '../types';

/**
 * Standard page size definitions in PDF typographic points (72 points = 1 inch).
 */
export const PAGE_SIZES: Record<PageSizeName, PageDimensions> = {
  letter: { width: 612, height: 792 },      // 8.5 x 11 inches
  a4: { width: 595.28, height: 841.89 },    // 210 x 297 mm
  a3: { width: 841.89, height: 1190.55 },   // 297 x 420 mm
  a5: { width: 419.53, height: 595.28 },    // 148 x 210 mm
  legal: { width: 612, height: 1008 },      // 8.5 x 14 inches
  tabloid: { width: 792, height: 1224 },    // 11 x 17 inches
};

export const DEFAULT_MARGINS: Margins = {
  top: 36,
  right: 36,
  bottom: 36,
  left: 36,
};

/**
 * Resolves page dimensions considering size preset and orientation.
 */
export function resolvePageDimensions(
  size: PageSizeName | PageDimensions = 'letter',
  orientation: PageOrientation = 'portrait'
): PageDimensions {
  let dims: PageDimensions;

  if (typeof size === 'string') {
    dims = PAGE_SIZES[size.toLowerCase() as PageSizeName] || PAGE_SIZES.letter;
  } else {
    dims = { width: Number(size.width) || 612, height: Number(size.height) || 792 };
  }

  // Adjust for orientation
  const isLandscape = orientation === 'landscape';
  const width = isLandscape ? Math.max(dims.width, dims.height) : Math.min(dims.width, dims.height);
  const height = isLandscape ? Math.min(dims.width, dims.height) : Math.max(dims.width, dims.height);

  return { width, height };
}

/**
 * Normalizes partial margins to a full Margins object.
 */
export function resolveMargins(margins?: Partial<Margins>): Margins {
  return {
    top: margins?.top ?? DEFAULT_MARGINS.top,
    right: margins?.right ?? DEFAULT_MARGINS.right,
    bottom: margins?.bottom ?? DEFAULT_MARGINS.bottom,
    left: margins?.left ?? DEFAULT_MARGINS.left,
  };
}
