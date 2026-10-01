import { PDFPage, rgb, degrees } from 'pdf-lib';
import { ShapeElement } from '../../types';
import { parseColor, isTransparent } from '../../core/colors';
import { toPdfCoordinates } from '../../core/geometry';
import { drawSvgPathOnPage } from './path-drawer';

/**
 * Draws native vector shapes on a PDF page with crisp lines and exact fills.
 */
export function drawShapeOnPage(
  page: PDFPage,
  shape: ShapeElement,
  pageHeight: number,
  coordinateOrigin: 'top-left' | 'bottom-left'
) {
  const {
    shapeType,
    width = 100,
    height = 100,
    fillColor,
    strokeColor,
    strokeWidth = 1,
    opacity = 1,
    rotation = 0,
    borderRadius = 0,
  } = shape;

  // Convert (x, y) to PDF bottom-left origin
  const { x, y } = toPdfCoordinates(shape.x, shape.y, height, pageHeight, coordinateOrigin);

  const hasFill = !isTransparent(fillColor);
  const hasStroke = !isTransparent(strokeColor) && strokeWidth > 0;

  if (!hasFill && !hasStroke && shapeType !== 'path') return;

  const fill = hasFill ? parseColor(fillColor) : null;
  const stroke = hasStroke ? parseColor(strokeColor) : null;

  switch (shapeType) {
    case 'rectangle': {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
        borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
        borderWidth: hasStroke ? strokeWidth : undefined,
        opacity: fill ? fill.a * opacity : undefined,
        borderOpacity: stroke ? stroke.a * opacity : undefined,
        rotate: rotation ? degrees(rotation) : undefined,
      });
      break;
    }

    case 'circle': {
      const radius = Math.min(width, height) / 2;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      page.drawCircle({
        x: centerX,
        y: centerY,
        size: radius,
        color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
        borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
        borderWidth: hasStroke ? strokeWidth : undefined,
        opacity: fill ? fill.a * opacity : undefined,
        borderOpacity: stroke ? stroke.a * opacity : undefined,
      });
      break;
    }

    case 'line': {
      if (shape.x2 === undefined || shape.y2 === undefined) return;
      const start = toPdfCoordinates(shape.x, shape.y, 0, pageHeight, coordinateOrigin);
      const end = toPdfCoordinates(shape.x2, shape.y2, 0, pageHeight, coordinateOrigin);

      page.drawLine({
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        thickness: strokeWidth,
        color: stroke ? rgb(stroke.r, stroke.g, stroke.b) : rgb(0, 0, 0),
        opacity: stroke ? stroke.a * opacity : opacity,
      });
      break;
    }

    case 'arrow': {
      if (shape.x2 === undefined || shape.y2 === undefined) return;
      const start = toPdfCoordinates(shape.x, shape.y, 0, pageHeight, coordinateOrigin);
      const end = toPdfCoordinates(shape.x2, shape.y2, 0, pageHeight, coordinateOrigin);

      // Draw shaft
      page.drawLine({
        start: { x: start.x, y: start.y },
        end: { x: end.x, y: end.y },
        thickness: strokeWidth,
        color: stroke ? rgb(stroke.r, stroke.g, stroke.b) : rgb(0, 0, 0),
        opacity: stroke ? stroke.a * opacity : opacity,
      });

      // Calculate arrowhead geometry
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const arrowLen = Math.max(8, strokeWidth * 4);
      const arrowAng = Math.PI / 6;

      const p1x = end.x - arrowLen * Math.cos(angle - arrowAng);
      const p1y = end.y - arrowLen * Math.sin(angle - arrowAng);
      const p2x = end.x - arrowLen * Math.cos(angle + arrowAng);
      const p2y = end.y - arrowLen * Math.sin(angle + arrowAng);

      page.drawLine({
        start: { x: end.x, y: end.y },
        end: { x: p1x, y: p1y },
        thickness: strokeWidth,
        color: stroke ? rgb(stroke.r, stroke.g, stroke.b) : rgb(0, 0, 0),
        opacity: stroke ? stroke.a * opacity : opacity,
      });
      page.drawLine({
        start: { x: end.x, y: end.y },
        end: { x: p2x, y: p2y },
        thickness: strokeWidth,
        color: stroke ? rgb(stroke.r, stroke.g, stroke.b) : rgb(0, 0, 0),
        opacity: stroke ? stroke.a * opacity : opacity,
      });
      break;
    }

    case 'polygon': {
      const points = shape.points || [];
      if (points.length < 4) return;

      // Draw polygon outline segments
      for (let i = 0; i < points.length; i += 2) {
        const nextIdx = (i + 2) % points.length;
        const pt1 = toPdfCoordinates(shape.x + points[i], shape.y + points[i + 1], 0, pageHeight, coordinateOrigin);
        const pt2 = toPdfCoordinates(shape.x + points[nextIdx], shape.y + points[nextIdx + 1], 0, pageHeight, coordinateOrigin);

        page.drawLine({
          start: { x: pt1.x, y: pt1.y },
          end: { x: pt2.x, y: pt2.y },
          thickness: strokeWidth,
          color: stroke ? rgb(stroke.r, stroke.g, stroke.b) : rgb(0, 0, 0),
          opacity: stroke ? stroke.a * opacity : opacity,
        });
      }
      break;
    }

    case 'path': {
      if (!shape.pathData) return;
      drawSvgPathOnPage(page, {
        pathData: shape.pathData,
        x,
        y: y + height, // Adjust for SVG path top-left coordinate origin
        scaleX: 1,
        scaleY: 1,
        fillColor,
        strokeColor,
        strokeWidth,
        opacity,
        rotation,
      });
      break;
    }
  }
}
