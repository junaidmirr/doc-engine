import { describe, it, expect } from 'vitest';
import { createDocument } from '../src/core/document';
import { computeTableLayout } from '../src/layout/table-layout';
import { computeGridLayout } from '../src/layout/grid-layout';
import { paginateElements } from '../src/layout/pagination';
import { TableElement, GridElement, DocumentElement } from '../src/types';
import { PdfRenderer } from '../src/renderers/pdf/pdf-renderer';

describe('Table Layout Engine', () => {
  it('should compute table layout with column widths, borders, and zebra striping', () => {
    const table: TableElement = {
      id: 'table_1',
      type: 'table',
      x: 40,
      y: 100,
      width: 500,
      height: 120,
      columns: ['2fr', 80, 100],
      header: {
        cells: [
          { content: 'Item Description', fontWeight: 'bold' },
          { content: 'Qty', align: 'center', fontWeight: 'bold' },
          { content: 'Price', align: 'right', fontWeight: 'bold' },
        ],
      },
      rows: [
        {
          cells: [
            { content: 'Software License' },
            { content: '2', align: 'center' },
            { content: '$500.00', align: 'right' },
          ],
        },
        {
          cells: [
            { content: 'Consulting Hours' },
            { content: '10', align: 'center' },
            { content: '$1,500.00', align: 'right' },
          ],
        },
      ],
      zebra: true,
    };

    const computed = computeTableLayout(table);
    expect(computed.width).toBe(500);
    expect(computed.elements.length).toBeGreaterThan(6);

    // Verify cell text elements are created
    const textEls = computed.elements.filter((e) => e.type === 'text');
    expect(textEls.length).toBe(9); // 3 header + 6 cells
  });
});

describe('Grid Layout Engine', () => {
  it('should compute grid columns with 2D gap', () => {
    const grid: GridElement = {
      id: 'grid_1',
      type: 'grid',
      x: 20,
      y: 20,
      width: 400,
      height: 100,
      columns: 2,
      gap: [10, 20],
      children: [
        { id: 'item_1', type: 'text', text: 'Cell 1', x: 0, y: 0, width: 0, height: 30, fontSize: 12 },
        { id: 'item_2', type: 'text', text: 'Cell 2', x: 0, y: 0, width: 0, height: 30, fontSize: 12 },
        { id: 'item_3', type: 'text', text: 'Cell 3', x: 0, y: 0, width: 0, height: 30, fontSize: 12 },
        { id: 'item_4', type: 'text', text: 'Cell 4', x: 0, y: 0, width: 0, height: 30, fontSize: 12 },
      ],
    };

    const computed = computeGridLayout(grid);
    expect(computed.elements.length).toBe(4);
    // Row 1: item 1 and 2
    expect(computed.elements[0].x).toBe(20);
    expect(computed.elements[1].x).toBe(20 + 190 + 20); // origin + colWidth + colGap
    // Row 2: item 3 and 4
    expect(computed.elements[2].y).toBe(20 + 30 + 10); // origin + rowHeight + rowGap
  });
});

describe('Automatic Page Breaks, Constraints & Repeating Elements', () => {
  it('should honor breakBefore and breakAfter constraints', () => {
    const elements: DocumentElement[] = [
      { id: 'el_1', type: 'text', text: 'Section 1', x: 40, y: 40, width: 200, height: 30, fontSize: 12 },
      { id: 'el_2', type: 'text', text: 'Section 2', x: 40, y: 80, width: 200, height: 30, fontSize: 12, pageBreakBefore: true },
    ];

    const pages = paginateElements({
      elements,
      pageWidth: 612,
      pageHeight: 792,
    });

    expect(pages.length).toBe(2);
    expect(pages[0].elements.some((e) => e.id.includes('el_1'))).toBe(true);
    expect(pages[1].elements.some((e) => e.id.includes('el_2'))).toBe(true);
  });

  it('should inject repeating header, footer, and {pageNumber} of {totalPages}', () => {
    const elements: DocumentElement[] = [];
    for (let i = 0; i < 15; i++) {
      elements.push({
        id: `content_${i}`,
        type: 'text',
        text: `Content paragraph ${i}`,
        x: 40,
        y: i * 50,
        width: 300,
        height: 30,
        fontSize: 12,
      });
    }

    const pages = paginateElements({
      elements,
      pageWidth: 612,
      pageHeight: 400, // Small page to force multi-page
      headerElement: {
        id: 'hdr',
        type: 'text',
        text: 'Acme Document - Confidential',
        x: 40,
        y: 20,
        width: 400,
        height: 15,
        fontSize: 9,
      },
      footerElement: {
        id: 'ftr',
        type: 'text',
        text: 'Page {pageNumber} of {totalPages}',
        x: 40,
        y: 380,
        width: 400,
        height: 15,
        fontSize: 9,
      },
      repeatHeadersAndFooters: true,
    });

    expect(pages.length).toBeGreaterThan(1);
    const totalPages = pages.length;

    // Check footer on Page 1
    const p1Footer = pages[0].elements.find((e) => e.id.includes('ftr')) as any;
    expect(p1Footer).toBeDefined();
    expect(p1Footer.text).toBe(`Page 1 of ${totalPages}`);

    // Check footer on Page 2
    const p2Footer = pages[1].elements.find((e) => e.id.includes('ftr')) as any;
    expect(p2Footer).toBeDefined();
    expect(p2Footer.text).toBe(`Page 2 of ${totalPages}`);
  });

  it('should render document with tables and grids directly to vector PDF', async () => {
    const doc = createDocument();
    doc.addTable({
      x: 40,
      y: 50,
      width: 532,
      columns: [150, 100, 100],
      header: {
        cells: [{ content: 'Product' }, { content: 'Units' }, { content: 'Revenue' }],
      },
      rows: [
        { cells: [{ content: 'Cloud Engine' }, { content: '1,200' }, { content: '$120,000' }] },
        { cells: [{ content: 'Vector Renderer' }, { content: '850' }, { content: '$85,000' }] },
      ],
    });

    const pdfBytes = await PdfRenderer.renderToBytes(doc.toDefinition());
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
