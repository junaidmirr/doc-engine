import { PDFPage, rgb, degrees } from 'pdf-lib';
import { parseColor, isTransparent } from '../../core/colors';

export interface DrawSvgPathOptions {
  pathData: string;
  x: number;
  y: number; // PDF bottom-left coordinates
  scaleX?: number;
  scaleY?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
}

/**
 * Parses SVG path data commands (M, L, H, V, C, S, Q, T, Z) and renders
 * native PDF vector geometry using pdf-lib drawing operations.
 */
export function drawSvgPathOnPage(page: PDFPage, options: DrawSvgPathOptions) {
  const {
    pathData,
    x,
    y,
    scaleX = 1,
    scaleY = 1,
    fillColor,
    strokeColor,
    strokeWidth = 1,
    opacity = 1,
  } = options;

  if (!pathData) return;

  const tokens = pathData.match(/[a-df-z]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/gi);
  if (!tokens || tokens.length === 0) return;

  const hasFill = !isTransparent(fillColor);
  const hasStroke = !isTransparent(strokeColor) && strokeWidth > 0;

  if (!hasFill && !hasStroke) return;

  const fill = hasFill ? parseColor(fillColor) : null;
  const stroke = hasStroke ? parseColor(strokeColor) : null;

  let cursorX = 0;
  let cursorY = 0;
  let startX = 0;
  let startY = 0;
  let lastCmd = '';
  let i = 0;

  // We accumulate segments and draw as SVG path operators on the page
  // pdf-lib page.drawSvgPath is built-in and handles standard SVG paths!
  try {
    page.drawSvgPath(pathData, {
      x,
      y,
      scale: scaleX,
      color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
      borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: hasStroke ? strokeWidth : undefined,
      opacity: fill ? fill.a * opacity : undefined,
      borderOpacity: stroke ? stroke.a * opacity : undefined,
      rotate: options.rotation ? degrees(options.rotation) : undefined,
    });
    return;
  } catch {
    // If standard drawSvgPath fails on complex syntax, fallback to manual command parsing
  }

  // Fallback tokenizer for paths
  while (i < tokens.length) {
    let cmd = tokens[i];
    if (/^[a-zA-Z]$/.test(cmd)) {
      i++;
    } else {
      cmd = lastCmd;
    }
    lastCmd = cmd;
    const isRel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();

    if (upper === 'M') {
      const px = parseFloat(tokens[i++]);
      const py = parseFloat(tokens[i++]);
      cursorX = isRel ? cursorX + px : px;
      cursorY = isRel ? cursorY + py : py;
      startX = cursorX;
      startY = cursorY;
    } else if (upper === 'L') {
      const px = parseFloat(tokens[i++]);
      const py = parseFloat(tokens[i++]);
      const toX = isRel ? cursorX + px : px;
      const toY = isRel ? cursorY + py : py;

      if (hasStroke) {
        page.drawLine({
          start: { x: x + cursorX * scaleX, y: y - cursorY * scaleY },
          end: { x: x + toX * scaleX, y: y - toY * scaleY },
          color: rgb(stroke!.r, stroke!.g, stroke!.b),
          thickness: strokeWidth,
          opacity: stroke!.a * opacity,
        });
      }
      cursorX = toX;
      cursorY = toY;
    } else if (upper === 'H') {
      const px = parseFloat(tokens[i++]);
      const toX = isRel ? cursorX + px : px;
      if (hasStroke) {
        page.drawLine({
          start: { x: x + cursorX * scaleX, y: y - cursorY * scaleY },
          end: { x: x + toX * scaleX, y: y - cursorY * scaleY },
          color: rgb(stroke!.r, stroke!.g, stroke!.b),
          thickness: strokeWidth,
          opacity: stroke!.a * opacity,
        });
      }
      cursorX = toX;
    } else if (upper === 'V') {
      const py = parseFloat(tokens[i++]);
      const toY = isRel ? cursorY + py : py;
      if (hasStroke) {
        page.drawLine({
          start: { x: x + cursorX * scaleX, y: y - cursorY * scaleY },
          end: { x: x + cursorX * scaleX, y: y - toY * scaleY },
          color: rgb(stroke!.r, stroke!.g, stroke!.b),
          thickness: strokeWidth,
          opacity: stroke!.a * opacity,
        });
      }
      cursorY = toY;
    } else if (upper === 'Z') {
      if (hasStroke && (cursorX !== startX || cursorY !== startY)) {
        page.drawLine({
          start: { x: x + cursorX * scaleX, y: y - cursorY * scaleY },
          end: { x: x + startX * scaleX, y: y - startY * scaleY },
          color: rgb(stroke!.r, stroke!.g, stroke!.b),
          thickness: strokeWidth,
          opacity: stroke!.a * opacity,
        });
      }
      cursorX = startX;
      cursorY = startY;
    } else {
      // Advance token if unrecognized single value
      i++;
    }
  }
}
