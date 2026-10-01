import { DocumentElement, ViewElement } from '../types';

export interface LayoutBox {
  element: DocumentElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComputedLayoutResult {
  width: number;
  height: number;
  boxes: LayoutBox[];
}

/**
 * Normalizes container padding into [top, right, bottom, left].
 */
export function normalizePadding(
  padding?: number | [number, number] | [number, number, number, number]
): [number, number, number, number] {
  if (padding === undefined || padding === null) return [0, 0, 0, 0];
  if (typeof padding === 'number') return [padding, padding, padding, padding];
  if (padding.length === 2) return [padding[0], padding[1], padding[0], padding[1]];
  if (padding.length === 4) return padding;
  return [0, 0, 0, 0];
}

/**
 * Computes deterministic layout for a View container and its children.
 * Supports row, column, gap, alignment, and auto-expanding dimensions.
 */
export function computeFlexLayout(
  view: ViewElement,
  parentX = 0,
  parentY = 0
): ComputedLayoutResult {
  const children = view.children || [];
  const [padTop, padRight, padBottom, padLeft] = normalizePadding(view.padding);
  const gap = view.gap ?? 0;
  const isRow = view.flexDirection === 'row';

  const originX = (view.x ?? 0) + parentX;
  const originY = (view.y ?? 0) + parentY;

  const contentStartX = originX + padLeft;
  const contentStartY = originY + padTop;

  let currentX = contentStartX;
  let currentY = contentStartY;

  let maxCrossSize = 0;
  const boxes: LayoutBox[] = [];

  for (const child of children) {
    const childW = child.width || 100;
    const childH = child.height || 20;

    let posX = currentX;
    let posY = currentY;

    if (isRow) {
      posX = currentX;
      // Handle cross-axis (vertical) alignment inside row
      if (view.alignItems === 'center') {
        const availableH = Math.max(0, (view.height || 0) - padTop - padBottom);
        posY = contentStartY + (availableH > childH ? (availableH - childH) / 2 : 0);
      } else if (view.alignItems === 'end') {
        const availableH = Math.max(0, (view.height || 0) - padTop - padBottom);
        posY = contentStartY + (availableH > childH ? availableH - childH : 0);
      }

      boxes.push({ element: child, x: posX, y: posY, width: childW, height: childH });
      currentX += childW + gap;
      maxCrossSize = Math.max(maxCrossSize, childH);
    } else {
      // Column direction
      posY = currentY;
      // Handle cross-axis (horizontal) alignment inside column
      if (view.alignItems === 'center') {
        const availableW = Math.max(0, (view.width || 0) - padLeft - padRight);
        posX = contentStartX + (availableW > childW ? (availableW - childW) / 2 : 0);
      } else if (view.alignItems === 'end') {
        const availableW = Math.max(0, (view.width || 0) - padLeft - padRight);
        posX = contentStartX + (availableW > childW ? availableW - childW : 0);
      }

      boxes.push({ element: child, x: posX, y: posY, width: childW, height: childH });
      currentY += childH + gap;
      maxCrossSize = Math.max(maxCrossSize, childW);
    }
  }

  const computedWidth = isRow
    ? (currentX - gap > contentStartX ? currentX - gap - originX + padRight : padLeft + padRight)
    : Math.max(view.width || 0, maxCrossSize + padLeft + padRight);

  const computedHeight = isRow
    ? Math.max(view.height || 0, maxCrossSize + padTop + padBottom)
    : (currentY - gap > contentStartY ? currentY - gap - originY + padBottom : padTop + padBottom);

  return {
    width: view.width || computedWidth,
    height: view.height || computedHeight,
    boxes,
  };
}
