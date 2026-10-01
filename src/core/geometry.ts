import { CoordinateOrigin } from '../types';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Transforms a Y coordinate between Web Top-Left origin and PDF Bottom-Left origin.
 *
 * @param y The incoming Y coordinate
 * @param elementHeight The height of the element being placed
 * @param pageHeight The total height of the target page
 * @param fromOrigin The source coordinate origin
 */
export function toPdfCoordinates(
  x: number,
  y: number,
  elementHeight: number,
  pageHeight: number,
  fromOrigin: CoordinateOrigin = 'top-left'
): Point {
  if (fromOrigin === 'bottom-left') {
    return { x, y };
  }
  // Convert from Top-Left (screen) to Bottom-Left (PDF native)
  return {
    x,
    y: pageHeight - y - elementHeight,
  };
}

/**
 * Transforms a PDF Bottom-Left Y coordinate back to Web Top-Left coordinate.
 */
export function toScreenCoordinates(
  x: number,
  y: number,
  elementHeight: number,
  pageHeight: number
): Point {
  return {
    x,
    y: pageHeight - y - elementHeight,
  };
}

/**
 * Calculates horizontal alignment offset inside a container or bounding box.
 */
export function getAlignmentOffsetX(
  align: 'left' | 'center' | 'right' | 'justify' | undefined,
  containerWidth: number,
  contentWidth: number
): number {
  switch (align) {
    case 'center':
      return Math.max(0, (containerWidth - contentWidth) / 2);
    case 'right':
      return Math.max(0, containerWidth - contentWidth);
    case 'left':
    case 'justify':
    default:
      return 0;
  }
}

/**
 * Calculates bounds of a rotated rectangle.
 */
export function getRotatedBounds(rect: Rect, angleDegrees: number): Rect {
  if (!angleDegrees || angleDegrees % 360 === 0) {
    return { ...rect };
  }

  const rad = (angleDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));

  const newWidth = rect.width * cos + rect.height * sin;
  const newHeight = rect.width * sin + rect.height * cos;

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  return {
    x: cx - newWidth / 2,
    y: cy - newHeight / 2,
    width: newWidth,
    height: newHeight,
  };
}
