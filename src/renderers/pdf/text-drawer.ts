import { PDFPage, PDFFont, rgb } from 'pdf-lib';
import { TextElement } from '../../types';
import { parseColor, isTransparent } from '../../core/colors';
import { toPdfCoordinates, getAlignmentOffsetX } from '../../core/geometry';
import { wrapText } from '../../layout/text-wrap';

/**
 * Renders real, searchable, selectable vector text into a PDF page.
 */
export function drawTextOnPage(
  page: PDFPage,
  element: TextElement,
  font: PDFFont,
  pageHeight: number,
  coordinateOrigin: 'top-left' | 'bottom-left'
) {
  const {
    text,
    fontSize = 12,
    color = '#000000',
    align = 'left',
    lineHeight = 1.35,
    letterSpacing = 0,
    underline = false,
    strike = false,
    opacity = 1,
    width = 200,
    height = 50,
    maxLines,
    wrap = true,
  } = element;

  if (!text) return;
  if (isTransparent(color)) return;

  const textColor = parseColor(color);
  const pdfRgb = rgb(textColor.r, textColor.g, textColor.b);

  // Wrap lines if wrap is enabled
  const lines = wrap
    ? wrapText({
        text,
        maxWidth: width,
        fontSize,
        fontFamily: element.fontFamily,
        isBold: element.fontWeight === 'bold' || (typeof element.fontWeight === 'number' && element.fontWeight >= 600),
        letterSpacing,
        maxLines,
      })
    : text.split('\n').map((l) => ({ text: l, width }));

  const lineHeightPts = fontSize * lineHeight;
  const { x: baseX, y: elementBottomY } = toPdfCoordinates(
    element.x,
    element.y,
    height,
    pageHeight,
    coordinateOrigin
  );

  // Calculate starting baseline Y from top of element's bounding box
  // In PDF coordinates, element top is elementBottomY + height
  const topY = elementBottomY + height;
  let currentBaselineY = topY - fontSize; // baseline offset from top

  for (const line of lines) {
    if (!line.text) {
      currentBaselineY -= lineHeightPts;
      continue;
    }

    // Compute line width using font's native measurement if available
    let measuredLineWidth = 0;
    try {
      measuredLineWidth = font.widthOfTextAtSize(line.text, fontSize);
    } catch {
      measuredLineWidth = line.width;
    }

    if (letterSpacing > 0 && line.text.length > 1) {
      measuredLineWidth += (line.text.length - 1) * letterSpacing;
    }

    const alignOffset = getAlignmentOffsetX(align, width, measuredLineWidth);
    const lineStartX = baseX + alignOffset;

    // Draw the actual text glyphs
    try {
      page.drawText(line.text, {
        x: lineStartX,
        y: currentBaselineY,
        size: fontSize,
        font,
        color: pdfRgb,
        opacity: textColor.a * opacity,
      });
    } catch (err) {
      // If characters outside WinAnsiEncoding are encountered, sanitize to clean ASCII
      const sanitized = line.text.replace(/[^\x00-\x7F]/g, '');
      page.drawText(sanitized, {
        x: lineStartX,
        y: currentBaselineY,
        size: fontSize,
        font,
        color: pdfRgb,
        opacity: textColor.a * opacity,
      });
    }

    // Underline
    if (underline) {
      page.drawLine({
        start: { x: lineStartX, y: currentBaselineY - 2 },
        end: { x: lineStartX + measuredLineWidth, y: currentBaselineY - 2 },
        thickness: Math.max(0.75, fontSize * 0.06),
        color: pdfRgb,
        opacity: textColor.a * opacity,
      });
    }

    // Strikethrough
    if (strike) {
      const strikeY = currentBaselineY + fontSize * 0.3;
      page.drawLine({
        start: { x: lineStartX, y: strikeY },
        end: { x: lineStartX + measuredLineWidth, y: strikeY },
        thickness: Math.max(0.75, fontSize * 0.06),
        color: pdfRgb,
        opacity: textColor.a * opacity,
      });
    }

    currentBaselineY -= lineHeightPts;
  }
}
