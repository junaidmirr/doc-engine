import { GridElement, DocumentElement } from '../types';

export interface ComputedGridResult {
  width: number;
  height: number;
  elements: DocumentElement[];
}

/**
 * Computes exact grid layout coordinates for elements:
 * - Supports fixed column count or explicit widths (e.g., [150, '1fr', '2fr'])
 * - Handles 2D gap [rowGap, colGap] or unified gap
 */
export function computeGridLayout(
  grid: GridElement,
  originX = 0,
  originY = 0,
  containerWidth = 532
): ComputedGridResult {
  const gridX = (grid.x ?? 0) + originX;
  const gridY = (grid.y ?? 0) + originY;
  const gridWidth = grid.width || containerWidth;

  const rawGap = grid.gap ?? 12;
  const [rowGap, colGap] = Array.isArray(rawGap) ? rawGap : [rawGap, rawGap];

  const children = grid.children || [];
  if (children.length === 0) {
    return { width: gridWidth, height: 0, elements: [] };
  }

  // Determine Column Count & Widths
  let numCols = 1;
  let colWidths: number[] = [];

  if (typeof grid.columns === 'number') {
    numCols = Math.max(1, grid.columns);
    const totalGaps = colGap * (numCols - 1);
    const colW = Math.max(10, (gridWidth - totalGaps) / numCols);
    colWidths = new Array(numCols).fill(colW);
  } else if (Array.isArray(grid.columns)) {
    numCols = grid.columns.length;
    let fixedTotal = 0;
    let frTotal = 0;

    for (const c of grid.columns) {
      if (typeof c === 'number') {
        fixedTotal += c;
      } else if (typeof c === 'string' && c.endsWith('fr')) {
        frTotal += parseFloat(c) || 1;
      } else {
        frTotal += 1;
      }
    }

    const totalGaps = colGap * (numCols - 1);
    const remainingW = Math.max(0, gridWidth - totalGaps - fixedTotal);

    colWidths = grid.columns.map((c) => {
      if (typeof c === 'number') return c;
      const fr = typeof c === 'string' && c.endsWith('fr') ? parseFloat(c) || 1 : 1;
      return frTotal > 0 ? (fr / frTotal) * remainingW : remainingW / numCols;
    });
  }

  const elements: DocumentElement[] = [];
  let currentRowY = gridY;
  let currentRowMaxHeight = 0;

  for (let i = 0; i < children.length; i++) {
    const colIndex = i % numCols;
    if (colIndex === 0 && i > 0) {
      currentRowY += currentRowMaxHeight + rowGap;
      currentRowMaxHeight = 0;
    }

    // Calculate Column X position
    let colX = gridX;
    for (let c = 0; c < colIndex; c++) {
      colX += colWidths[c] + colGap;
    }

    const child = children[i];
    const childW = colWidths[colIndex];
    const childH = child.height || 40;

    currentRowMaxHeight = Math.max(currentRowMaxHeight, childH);

    elements.push({
      ...child,
      x: colX,
      y: currentRowY,
      width: childW,
    });
  }

  const totalHeight = currentRowY + currentRowMaxHeight - gridY;

  return {
    width: gridWidth,
    height: totalHeight,
    elements,
  };
}
