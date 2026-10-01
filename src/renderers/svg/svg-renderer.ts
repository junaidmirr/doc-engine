import { PageDefinition, DocumentElement, TextElement, ShapeElement } from '../../types';
import { wrapText } from '../../layout/text-wrap';
import { getAlignmentOffsetX } from '../../core/geometry';

/**
 * Pure SVG exporter rendering pages into vector SVG strings.
 */
export class SvgRenderer {
  public static renderPageToSvg(page: PageDefinition): string {
    const width = page.width || 612;
    const height = page.height || 792;
    const bg = page.backgroundColor || '#ffffff';

    const elements = [...page.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const itemsSvg: string[] = [];

    for (const el of elements) {
      if (el.type === 'shape') {
        const shape = el as ShapeElement;
        if (shape.shapeType === 'rectangle') {
          itemsSvg.push(
            `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" rx="${shape.borderRadius || 0}" fill="${shape.fillColor || 'none'}" stroke="${shape.strokeColor || 'none'}" stroke-width="${shape.strokeWidth || 0}" opacity="${shape.opacity ?? 1}" />`
          );
        } else if (shape.shapeType === 'circle') {
          const r = Math.min(shape.width, shape.height) / 2;
          itemsSvg.push(
            `<circle cx="${shape.x + shape.width / 2}" cy="${shape.y + shape.height / 2}" r="${r}" fill="${shape.fillColor || 'none'}" stroke="${shape.strokeColor || 'none'}" stroke-width="${shape.strokeWidth || 0}" opacity="${shape.opacity ?? 1}" />`
          );
        } else if (shape.shapeType === 'line' && shape.x2 !== undefined && shape.y2 !== undefined) {
          itemsSvg.push(
            `<line x1="${shape.x}" y1="${shape.y}" x2="${shape.x2}" y2="${shape.y2}" stroke="${shape.strokeColor || '#000000'}" stroke-width="${shape.strokeWidth || 1}" opacity="${shape.opacity ?? 1}" />`
          );
        } else if (shape.shapeType === 'path' && shape.pathData) {
          itemsSvg.push(
            `<g transform="translate(${shape.x}, ${shape.y})"><path d="${shape.pathData}" fill="${shape.fillColor || 'none'}" stroke="${shape.strokeColor || 'none'}" stroke-width="${shape.strokeWidth || 0}" opacity="${shape.opacity ?? 1}" /></g>`
          );
        }
      } else if (el.type === 'text') {
        const textEl = el as TextElement;
        const fontSize = textEl.fontSize || 12;
        const fontFamily = textEl.fontFamily || 'Helvetica, Arial, sans-serif';
        const fontWeight = textEl.fontWeight || 'normal';
        const color = textEl.color || '#000000';
        const lineHeight = fontSize * (textEl.lineHeight || 1.35);

        const lines = wrapText({
          text: textEl.text,
          maxWidth: textEl.width,
          fontSize,
          fontFamily,
          letterSpacing: textEl.letterSpacing,
        });

        lines.forEach((line, i) => {
          const offsetX = getAlignmentOffsetX(textEl.align, textEl.width, line.width);
          const y = textEl.y + (i + 1) * lineHeight;
          itemsSvg.push(
            `<text x="${textEl.x + offsetX}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}">${escapeXml(line.text)}</text>`
          );
        });
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="${bg}" />
  ${itemsSvg.join('\n  ')}
</svg>`;
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
