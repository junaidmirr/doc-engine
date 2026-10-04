import { describe, it, expect } from 'vitest';
import { createDocument, StackBuilder, deepClone } from '../src';
import { computeTableLayout } from '../src/layout/table-layout';

describe('DocEngine Market-Leading Improvements', () => {
  it('P0: toDefinition preserves Uint8Array and Date instances without degrading', () => {
    const rawData = new Uint8Array([1, 2, 3, 4, 5]);
    const testDate = new Date('2026-10-04T12:00:00Z');

    const originalObj = {
      imageBuffer: rawData,
      createdAt: testDate,
      nested: {
        data: rawData,
      },
    };

    const cloned = deepClone(originalObj);

    expect(cloned.imageBuffer).toBeInstanceOf(Uint8Array);
    expect(cloned.imageBuffer[0]).toBe(1);
    expect(cloned.imageBuffer[4]).toBe(5);
    expect(cloned.createdAt).toBeInstanceOf(Date);
    expect(cloned.createdAt.getTime()).toBe(testDate.getTime());
  });

  it('P1 DX: Flow Stack API automatically computes vertical positions without manual y math', () => {
    const doc = createDocument({ defaultPageSize: 'letter' });

    doc.addStack({ x: 40, y: 40, width: 500, gap: 10 }, (stack) => {
      stack.addText({ text: 'Title Header', fontSize: 20, lineHeight: 1.2 }); // 20 * 1.2 = 24pt height
      stack.addText({ text: 'Line 1\nLine 2', fontSize: 10, lineHeight: 1.5 }); // 2 lines * 15pt = 30pt height
      stack.addTable({
        columns: ['1fr', '1fr'],
        rows: [
          { cells: [{ content: 'Cell A' }, { content: 'Cell B' }] }
        ]
      });
    });

    const page = doc.getActivePage();
    expect(page.elements.length).toBeGreaterThanOrEqual(3);

    const el0 = page.elements[0];
    const el1 = page.elements[1];
    const el2 = page.elements[2];

    expect(el0.y).toBe(40);
    // el0 height = 24, gap = 10 -> el1 y = 40 + 24 + 10 = 74
    expect(el1.y).toBe(74);
    // el1 height = 30, gap = 10 -> el2 y = 74 + 30 + 10 = 114
    expect(el2.y).toBe(114);
  });

  it('P1 DX: Right-aligned text without explicit width automatically aligns to right edge', () => {
    const doc = createDocument({ defaultPageSize: 'letter' });

    // Stack with width 500
    doc.addStack({ x: 40, y: 40, width: 500 }, (stack) => {
      stack.addText({ text: '$150.00', align: 'right', fontSize: 12 });
    });

    const page = doc.getActivePage();
    const textEl = page.elements[0];

    // Right aligned element x should be placed near the right boundary (x + stackWidth)
    expect(textEl.x).toBeGreaterThan(400);
    expect(textEl.x).toBeLessThanOrEqual(540);
  });

  it('P1 DX: First-class Table primitive auto-generates headers and inherits column alignment', () => {
    const computed = computeTableLayout({
      type: 'table',
      x: 40,
      y: 40,
      width: 500,
      columns: [
        { header: 'Description', width: '3fr', align: 'left' },
        { header: 'Qty', width: 50, align: 'center' },
        { header: 'Price', width: 80, align: 'right' }
      ],
      rows: [
        { cells: [{ content: 'Cloud Integration' }, { content: '2' }, { content: '$500.00' }] }
      ]
    });

    expect(computed.elements.length).toBeGreaterThan(0);

    // Find header cells
    const textElements = computed.elements.filter((e) => e.type === 'text') as any[];
    expect(textElements.length).toBeGreaterThanOrEqual(6); // 3 header cells + 3 data cells

    const headerDesc = textElements.find((e) => e.text === 'Description');
    const headerQty = textElements.find((e) => e.text === 'Qty');
    const headerPrice = textElements.find((e) => e.text === 'Price');

    expect(headerDesc).toBeDefined();
    expect(headerQty).toBeDefined();
    expect(headerPrice).toBeDefined();

    const dataPrice = textElements.find((e) => e.text === '$500.00');
    expect(dataPrice.align).toBe('right');
  });
});
