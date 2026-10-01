import { describe, it, expect } from 'vitest';
import { measureTextWidth, findMaxFitIndex } from '../src/layout/text-measure';
import { wrapText } from '../src/layout/text-wrap';
import { computeFlexLayout } from '../src/layout/auto-layout';
import { paginateElements } from '../src/layout/pagination';
import { ViewElement, DocumentElement } from '../src/types';

describe('Text Measurement & Wrapping', () => {
  it('should measure standard text width correctly', () => {
    const width = measureTextWidth('Hello World', 12, 'Helvetica');
    expect(width).toBeGreaterThan(50);
    expect(width).toBeLessThan(80);
  });

  it('should wrap lines when exceeding maxWidth', () => {
    const longText = 'This is a long sentence that should easily wrap onto multiple lines when constrained.';
    const lines = wrapText({
      text: longText,
      maxWidth: 150,
      fontSize: 12,
      fontFamily: 'Helvetica',
    });

    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) {
      expect(line.width).toBeLessThanOrEqual(150);
    }
  });

  it('should break unbreakable words with binary search fit', () => {
    const hugeUrl = 'https://example.com/very/long/unbroken/path/that/cannot/fit/in/a/single/line/test';
    const lines = wrapText({
      text: hugeUrl,
      maxWidth: 100,
      fontSize: 12,
    });

    expect(lines.length).toBeGreaterThan(1);
  });

  it('should honor maxLines limit and add ellipsis', () => {
    const text = 'Line one\nLine two\nLine three\nLine four\nLine five';
    const lines = wrapText({
      text,
      maxWidth: 300,
      fontSize: 12,
      maxLines: 2,
    });

    expect(lines.length).toBe(2);
    expect(lines[1].text.endsWith('...')).toBe(true);
  });
});

describe('Flex Auto-Layout', () => {
  it('should layout elements in column with gap and padding', () => {
    const view: ViewElement = {
      id: 'v1',
      type: 'view',
      x: 10,
      y: 10,
      width: 200,
      height: 300,
      layout: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 15,
      children: [
        { id: 'c1', type: 'text', text: 'Item 1', x: 0, y: 0, width: 100, height: 20, fontSize: 12 },
        { id: 'c2', type: 'text', text: 'Item 2', x: 0, y: 0, width: 100, height: 20, fontSize: 12 },
      ],
    };

    const computed = computeFlexLayout(view);
    expect(computed.boxes.length).toBe(2);
    // Box 1 Y = parentY (10) + padTop (15) = 25
    expect(computed.boxes[0].y).toBe(25);
    // Box 2 Y = Box 1 Y (25) + Box 1 H (20) + gap (10) = 55
    expect(computed.boxes[1].y).toBe(55);
  });

  it('should layout elements in row with gap', () => {
    const view: ViewElement = {
      id: 'v2',
      type: 'view',
      x: 0,
      y: 0,
      width: 400,
      height: 100,
      layout: 'flex',
      flexDirection: 'row',
      gap: 20,
      padding: 10,
      children: [
        { id: 'c1', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 50, height: 50 },
        { id: 'c2', type: 'shape', shapeType: 'rectangle', x: 0, y: 0, width: 50, height: 50 },
      ],
    };

    const computed = computeFlexLayout(view);
    expect(computed.boxes.length).toBe(2);
    expect(computed.boxes[0].x).toBe(10);
    expect(computed.boxes[1].x).toBe(80); // 10 + 50 + 20
  });
});

describe('Pagination', () => {
  it('should split overflowing elements into multiple pages', () => {
    const elements: DocumentElement[] = [];
    // Generate 20 items stacked vertically
    for (let i = 0; i < 20; i++) {
      elements.push({
        id: `item_${i}`,
        type: 'text',
        x: 40,
        y: i * 60,
        width: 300,
        height: 40,
        text: `Item ${i}`,
        fontSize: 12,
      });
    }

    const pages = paginateElements({
      elements,
      pageWidth: 612,
      pageHeight: 500, // Small page to force pagination
      margins: { top: 30, bottom: 30, left: 30, right: 30 },
    });

    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0].id).toBe('page-1');
    expect(pages[1].id).toBe('page-2');
  });
});
