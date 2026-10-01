import {
  PageDefinition,
  DocumentElement,
  TextElement,
  ShapeElement,
  ImageElement,
  ViewElement,
  TableElement,
  GridElement,
} from '../../types';
import { parseColor, toCssRgba, isTransparent } from '../../core/colors';
import { wrapText } from '../../layout/text-wrap';
import { getAlignmentOffsetX } from '../../core/geometry';
import { computeFlexLayout } from '../../layout/auto-layout';
import { computeTableLayout } from '../../layout/table-layout';
import { computeGridLayout } from '../../layout/grid-layout';

export interface CanvasRenderOptions {
  scale?: number;
  selectedElementId?: string;
}

/**
 * High-performance HTML5 Canvas renderer for real-time document preview and editor interfaces.
 */
export class CanvasRenderer {
  public static renderPage(
    canvas: HTMLCanvasElement,
    page: PageDefinition,
    options: CanvasRenderOptions = {}
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = options.scale ?? 1;
    const width = page.width || 612;
    const height = page.height || 792;

    // Set canvas dimensions
    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.save();
    ctx.scale(scale, scale);

    // Page Background
    ctx.fillStyle = page.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Flatten Views, Tables, Grids and Sort elements by z-index
    const elements = CanvasRenderer.flattenElements(page.elements)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

    for (const el of elements) {
      ctx.save();

      if (el.opacity !== undefined && el.opacity < 1) {
        ctx.globalAlpha = el.opacity;
      }

      if (el.rotation) {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      if (el.type === 'shape') {
        CanvasRenderer.drawShape(ctx, el as ShapeElement);
      } else if (el.type === 'text') {
        CanvasRenderer.drawText(ctx, el as TextElement);
      } else if (el.type === 'image') {
        CanvasRenderer.drawImage(ctx, el as ImageElement);
      }

      // Draw selection ring if element is selected
      if (options.selectedElementId && el.id === options.selectedElementId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(el.x - 2, el.y - 2, el.width + 4, el.height + 4);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private static drawShape(ctx: CanvasRenderingContext2D, shape: ShapeElement) {
    const hasFill = !isTransparent(shape.fillColor);
    const hasStroke = !isTransparent(shape.strokeColor) && (shape.strokeWidth ?? 1) > 0;

    if (hasFill) {
      ctx.fillStyle = toCssRgba(parseColor(shape.fillColor));
    }
    if (hasStroke) {
      ctx.strokeStyle = toCssRgba(parseColor(shape.strokeColor));
      ctx.lineWidth = shape.strokeWidth ?? 1;
    }

    switch (shape.shapeType) {
      case 'rectangle': {
        const r = shape.borderRadius ?? 0;
        if (r > 0 && typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(shape.x, shape.y, shape.width, shape.height, r);
          if (hasFill) ctx.fill();
          if (hasStroke) ctx.stroke();
        } else {
          if (hasFill) ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
          if (hasStroke) ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        }
        break;
      }

      case 'circle': {
        const radius = Math.min(shape.width, shape.height) / 2;
        ctx.beginPath();
        ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, radius, 0, Math.PI * 2);
        if (hasFill) ctx.fill();
        if (hasStroke) ctx.stroke();
        break;
      }

      case 'line': {
        if (shape.x2 === undefined || shape.y2 === undefined) return;
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y);
        ctx.lineTo(shape.x2, shape.y2);
        if (hasStroke) ctx.stroke();
        break;
      }

      case 'path': {
        if (!shape.pathData) return;
        try {
          const path = new Path2D(shape.pathData);
          ctx.save();
          ctx.translate(shape.x, shape.y);
          if (hasFill) ctx.fill(path);
          if (hasStroke) ctx.stroke(path);
          ctx.restore();
        } catch {
          // Path2D fallback
        }
        break;
      }
    }
  }

  private static drawText(ctx: CanvasRenderingContext2D, el: TextElement) {
    const fontSize = el.fontSize || 12;
    const fontFamily = el.fontFamily || 'Helvetica, Arial, sans-serif';
    const isBold = el.fontWeight === 'bold' || (typeof el.fontWeight === 'number' && el.fontWeight >= 600);
    const isItalic = el.fontStyle === 'italic';

    ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = toCssRgba(parseColor(el.color || '#000000'));
    ctx.textBaseline = 'top';

    const lines = el.wrap !== false
      ? wrapText({
          text: el.text,
          maxWidth: el.width,
          fontSize,
          fontFamily,
          isBold,
          letterSpacing: el.letterSpacing,
          maxLines: el.maxLines,
        })
      : el.text.split('\n').map((l) => ({ text: l, width: el.width }));

    const lineHeight = fontSize * (el.lineHeight || 1.35);
    let currentY = el.y;

    for (const line of lines) {
      const offsetX = getAlignmentOffsetX(el.align, el.width, line.width);
      ctx.fillText(line.text, el.x + offsetX, currentY);

      if (el.underline) {
        ctx.fillRect(el.x + offsetX, currentY + fontSize + 2, line.width, Math.max(1, fontSize * 0.06));
      }

      currentY += lineHeight;
    }
  }

  private static drawImage(ctx: CanvasRenderingContext2D, el: ImageElement) {
    if (typeof Image === 'undefined') return;
    if (typeof el.src !== 'string') return;

    const img = new Image();
    img.src = el.src;
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, el.x, el.y, el.width, el.height);
    } else {
      img.onload = () => {
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      };
    }
  }

  private static flattenElements(elements: DocumentElement[]): DocumentElement[] {
    const flattened: DocumentElement[] = [];

    for (const el of elements) {
      if (el.type === 'view') {
        const view = el as ViewElement;
        if (view.backgroundColor || (view.borderColor && view.borderWidth)) {
          flattened.push({
            id: `${view.id}_bg`,
            type: 'shape',
            shapeType: 'rectangle',
            x: view.x,
            y: view.y,
            width: view.width,
            height: view.height,
            fillColor: view.backgroundColor,
            strokeColor: view.borderColor,
            strokeWidth: view.borderWidth ?? 0,
            borderRadius: view.borderRadius ?? 0,
            zIndex: view.zIndex,
            opacity: view.opacity,
          } as ShapeElement);
        }

        if (view.layout === 'flex') {
          const computed = computeFlexLayout(view);
          for (const box of computed.boxes) {
            flattened.push({
              ...box.element,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            });
          }
        } else if (view.children) {
          for (const child of view.children) {
            flattened.push({
              ...child,
              x: (view.x || 0) + (child.x || 0),
              y: (view.y || 0) + (child.y || 0),
            });
          }
        }
      } else if (el.type === 'table') {
        const computed = computeTableLayout(el as TableElement);
        flattened.push(...computed.elements);
      } else if (el.type === 'grid') {
        const computed = computeGridLayout(el as GridElement);
        flattened.push(...computed.elements);
      } else {
        flattened.push(el);
      }
    }

    return flattened;
  }
}
