import {
  TextElement,
  ShapeElement,
  ImageElement,
  ViewElement,
  TableElement,
  GridElement,
  DocumentElement,
} from '../types';
import { DocumentBuilder } from './document';
import { measureTextWidth } from '../layout/text-measure';
import { wrapText } from '../layout/text-wrap';
import { computeTableLayout } from '../layout/table-layout';

export interface StackOptions {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  direction?: 'column' | 'row';
  gap?: number;
  padding?: number | [number, number] | [number, number, number, number];
  pageId?: string;
}

/**
 * StackBuilder provides an automatic flow layout container where elements
 * are stacked vertically or horizontally without manual coordinate math.
 */
export class StackBuilder {
  public currentX: number;
  public currentY: number;
  public startX: number;
  public startY: number;
  public direction: 'column' | 'row';
  public gap: number;
  public stackWidth: number;
  public docBuilder: DocumentBuilder;
  public pageId?: string;
  public elements: DocumentElement[] = [];

  constructor(docBuilder: DocumentBuilder, options: StackOptions = {}) {
    this.docBuilder = docBuilder;
    this.startX = options.x ?? 40;
    this.startY = options.y ?? 40;
    this.currentX = this.startX;
    this.currentY = this.startY;
    this.direction = options.direction ?? 'column';
    this.gap = options.gap ?? 12;
    this.stackWidth = options.width ?? 532;
    this.pageId = options.pageId;
  }

  public get totalHeight(): number {
    return Math.max(0, this.currentY - this.startY);
  }

  public get totalWidth(): number {
    return Math.max(0, this.currentX - this.startX);
  }

  public addText(options: Omit<Partial<TextElement>, 'type'> & { text: string }): this {
    const textWidth = options.width ?? this.stackWidth;
    const fontSize = options.fontSize ?? 12;
    const lineHeight = options.lineHeight ?? 1.35;
    const fontFamily = options.fontFamily ?? 'Helvetica';
    const isBold = options.fontWeight === 'bold' || (typeof options.fontWeight === 'number' && options.fontWeight >= 600);

    // Calculate dynamic multiline wrapped text height
    const wrappedLines = options.wrap !== false
      ? wrapText({
          text: options.text,
          maxWidth: textWidth,
          fontSize,
          fontFamily,
          isBold,
          letterSpacing: options.letterSpacing ?? 0,
          maxLines: options.maxLines,
        })
      : options.text.split('\n').map((l) => ({ text: l, width: textWidth }));

    const lineCount = Math.max(1, wrappedLines.length);
    const measuredHeight = options.height ?? (lineCount * fontSize * lineHeight);

    let elementX = options.x ?? this.currentX;

    // Fix for right-aligned and centered text when width is not explicit
    if (options.align === 'right' && !options.width) {
      let maxLineWidth = 0;
      for (const line of wrappedLines) {
        const w = measureTextWidth(line.text, fontSize, fontFamily, isBold);
        if (w > maxLineWidth) maxLineWidth = w;
      }
      elementX = this.currentX + (this.stackWidth - maxLineWidth);
    } else if (options.align === 'center' && !options.width) {
      let maxLineWidth = 0;
      for (const line of wrappedLines) {
        const w = measureTextWidth(line.text, fontSize, fontFamily, isBold);
        if (w > maxLineWidth) maxLineWidth = w;
      }
      elementX = this.currentX + (this.stackWidth - maxLineWidth) / 2;
    }

    const textElement: Omit<Partial<TextElement>, 'type'> & { text: string } = {
      ...options,
      x: elementX,
      y: options.y ?? this.currentY,
      width: textWidth,
      height: measuredHeight,
      pageId: options.pageId ?? this.pageId,
    };

    this.docBuilder.addText(textElement);

    if (this.direction === 'column') {
      this.currentY += measuredHeight + this.gap;
    } else {
      this.currentX += textWidth + this.gap;
    }

    return this;
  }

  public addTable(options: Omit<Partial<TableElement>, 'type'> & { rows: TableElement['rows'] }): this {
    const tableWidth = options.width ?? this.stackWidth;

    // Calculate table height accurately
    const computed = computeTableLayout({
      id: options.id || 'temp_table',
      type: 'table',
      x: this.currentX,
      y: this.currentY,
      width: tableWidth,
      height: 0,
      columns: options.columns,
      header: options.header,
      rows: options.rows,
      borderWidth: options.borderWidth ?? 0.5,
      cellPadding: options.cellPadding ?? 6,
    });

    const tableElement = {
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: tableWidth,
      height: Math.max(options.height ?? 0, computed.height),
      pageId: options.pageId ?? this.pageId,
    };

    this.docBuilder.addTable(tableElement);

    if (this.direction === 'column') {
      this.currentY += Math.max(options.height ?? 0, computed.height) + this.gap;
    } else {
      this.currentX += tableWidth + this.gap;
    }

    return this;
  }

  public addShape(options: Omit<Partial<ShapeElement>, 'type'> & { shapeType: ShapeElement['shapeType'] }): this {
    const elementWidth = options.width ?? (this.direction === 'column' ? this.stackWidth : 100);
    const elementHeight = options.height ?? 2;

    this.docBuilder.addShape({
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: elementWidth,
      height: elementHeight,
      pageId: options.pageId ?? this.pageId,
    });

    if (this.direction === 'column') {
      this.currentY += elementHeight + this.gap;
    } else {
      this.currentX += elementWidth + this.gap;
    }

    return this;
  }

  public addImage(options: Omit<Partial<ImageElement>, 'type'> & { src: string | Uint8Array }): this {
    const elementWidth = options.width ?? 100;
    const elementHeight = options.height ?? 100;

    this.docBuilder.addImage({
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: elementWidth,
      height: elementHeight,
      pageId: options.pageId ?? this.pageId,
    });

    if (this.direction === 'column') {
      this.currentY += elementHeight + this.gap;
    } else {
      this.currentX += elementWidth + this.gap;
    }

    return this;
  }

  public addView(options: Omit<Partial<ViewElement>, 'type'>): this {
    const elementWidth = options.width ?? this.stackWidth;
    const elementHeight = options.height ?? 100;

    this.docBuilder.addView({
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: elementWidth,
      height: elementHeight,
      pageId: options.pageId ?? this.pageId,
    });

    if (this.direction === 'column') {
      this.currentY += elementHeight + this.gap;
    } else {
      this.currentX += elementWidth + this.gap;
    }

    return this;
  }

  public addGrid(options: Omit<Partial<GridElement>, 'type'> & { children: DocumentElement[] }): this {
    const elementWidth = options.width ?? this.stackWidth;
    const elementHeight = options.height ?? 100;

    this.docBuilder.addGrid({
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: elementWidth,
      height: elementHeight,
      pageId: options.pageId ?? this.pageId,
    });

    if (this.direction === 'column') {
      this.currentY += elementHeight + this.gap;
    } else {
      this.currentX += elementWidth + this.gap;
    }

    return this;
  }

  public addStack(options: StackOptions, fn: (stack: StackBuilder) => void): this {
    const subStack = new StackBuilder(this.docBuilder, {
      ...options,
      x: options.x ?? this.currentX,
      y: options.y ?? this.currentY,
      width: options.width ?? this.stackWidth,
      pageId: options.pageId ?? this.pageId,
    });

    fn(subStack);

    if (this.direction === 'column') {
      this.currentY += subStack.totalHeight + (options.gap ?? this.gap);
    } else {
      this.currentX += subStack.totalWidth + (options.gap ?? this.gap);
    }

    return this;
  }
}
