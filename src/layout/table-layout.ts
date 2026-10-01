import { TableElement, DocumentElement, TextElement, ShapeElement, TableRow, TableCell } from '../types';
import { wrapText } from './text-wrap';

export interface ComputedTableResult {
  width: number;
  height: number;
  elements: DocumentElement[];
}

/**
 * Computes exact layout coordinates for Table elements:
 * - Calculates fractional/auto/fixed column widths
 * - Generates cell backgrounds, cell text with padding & alignment, zebra rows, and border gridlines
 */
export function computeTableLayout(
  table: TableElement,
  originX = 0,
  originY = 0,
  containerWidth = 532
): ComputedTableResult {
  const tableX = (table.x ?? 0) + originX;
  const tableY = (table.y ?? 0) + originY;
  const tableWidth = table.width || containerWidth;
  const cellPadding = table.cellPadding ?? 6;
  const borderWidth = table.borderWidth ?? 0.5;
  const borderColor = table.borderColor ?? '#e2e8f0';

  const allRows: TableRow[] = [];
  if (table.header) {
    allRows.push({ ...table.header, isHeader: true });
  }
  allRows.push(...table.rows);

  if (allRows.length === 0) {
    return { width: tableWidth, height: 0, elements: [] };
  }

  // Determine number of columns
  const numCols = Math.max(
    table.columns?.length || 0,
    ...allRows.map((r) => r.cells.length)
  );

  // Calculate Column Widths
  const colWidths: number[] = new Array(numCols).fill(0);
  const rawCols = table.columns || [];

  let fixedWidthSum = 0;
  let flexFrTotal = 0;

  for (let i = 0; i < numCols; i++) {
    const colDef = rawCols[i];
    if (typeof colDef === 'number') {
      colWidths[i] = colDef;
      fixedWidthSum += colDef;
    } else if (typeof colDef === 'string' && colDef.endsWith('fr')) {
      const fr = parseFloat(colDef) || 1;
      flexFrTotal += fr;
    } else {
      // Auto or default 1fr
      flexFrTotal += 1;
    }
  }

  const remainingWidth = Math.max(0, tableWidth - fixedWidthSum);
  for (let i = 0; i < numCols; i++) {
    const colDef = rawCols[i];
    if (colWidths[i] === 0) {
      const fr = typeof colDef === 'string' && colDef.endsWith('fr') ? parseFloat(colDef) || 1 : 1;
      colWidths[i] = flexFrTotal > 0 ? (fr / flexFrTotal) * remainingWidth : remainingWidth / numCols;
    }
  }

  const elements: DocumentElement[] = [];
  let currentY = tableY;

  // Process rows
  allRows.forEach((row, rowIdx) => {
    // Dynamically calculate required row height from wrapped cell contents
    let calculatedHeight = row.isHeader ? 28 : 24;
    row.cells.forEach((cell, cellIdx) => {
      const colW = colWidths[cellIdx] || 50;
      const cellW = colW - cellPadding * 2;
      const fSize = cell.fontSize || (row.isHeader ? 10 : 9.5);
      const lHeight = fSize * 1.35;
      if (typeof cell.content === 'string') {
        const lines = wrapText({
          text: cell.content,
          maxWidth: cellW,
          fontSize: fSize,
        });
        const needed = lines.length * lHeight + cellPadding * 2;
        if (needed > calculatedHeight) {
          calculatedHeight = needed;
        }
      }
    });

    const rowHeight = row.height ?? Math.ceil(calculatedHeight);
    const isAlt = rowIdx % 2 === 1 && !row.isHeader;
    const rowBg = row.backgroundColor || (row.isHeader ? '#f1f5f9' : isAlt && table.zebra ? (table.zebraColor || '#f8fafc') : undefined);

    // Row Background
    if (rowBg) {
      elements.push({
        id: `${table.id}_row_bg_${rowIdx}`,
        type: 'shape',
        shapeType: 'rectangle',
        x: tableX,
        y: currentY,
        width: tableWidth,
        height: rowHeight,
        fillColor: rowBg,
        zIndex: 0,
      } as ShapeElement);
    }

    // Cells
    let cellX = tableX;
    row.cells.forEach((cell, cellIdx) => {
      const colW = colWidths[cellIdx] || 50;

      // Cell Background override
      if (cell.backgroundColor) {
        elements.push({
          id: `${table.id}_cell_bg_${rowIdx}_${cellIdx}`,
          type: 'shape',
          shapeType: 'rectangle',
          x: cellX,
          y: currentY,
          width: colW,
          height: rowHeight,
          fillColor: cell.backgroundColor,
          zIndex: 1,
        } as ShapeElement);
      }

      // Cell Content
      if (typeof cell.content === 'string') {
        const fSize = cell.fontSize || (row.isHeader ? 10 : 9.5);
        const lHeight = fSize * 1.35;
        const lines = wrapText({
          text: cell.content,
          maxWidth: colW - cellPadding * 2,
          fontSize: fSize,
        });
        const contentHeight = lines.length * lHeight;
        const textY = currentY + Math.max(cellPadding, (rowHeight - contentHeight) / 2);

        elements.push({
          id: `${table.id}_cell_txt_${rowIdx}_${cellIdx}`,
          type: 'text',
          x: cellX + cellPadding,
          y: textY,
          width: colW - cellPadding * 2,
          height: contentHeight,
          text: cell.content,
          fontSize: fSize,
          fontWeight: cell.fontWeight || (row.isHeader ? 'bold' : 'normal'),
          color: cell.textColor || (row.isHeader ? '#334155' : '#1e293b'),
          align: cell.align || 'left',
          wrap: true,
          zIndex: 2,
        } as TextElement);
      } else if (cell.content && typeof cell.content === 'object') {
        const cellEls = Array.isArray(cell.content) ? cell.content : [cell.content];
        for (const cel of cellEls) {
          elements.push({
            ...cel,
            x: cellX + (cel.x || 0),
            y: currentY + (cel.y || 0),
            zIndex: (cel.zIndex ?? 0) + 2,
          });
        }
      }

      cellX += colW;
    });

    // Horizontal Row Divider Line
    if (borderWidth > 0) {
      elements.push({
        id: `${table.id}_row_line_${rowIdx}`,
        type: 'shape',
        shapeType: 'line',
        x: tableX,
        y: currentY + rowHeight,
        x2: tableX + tableWidth,
        y2: currentY + rowHeight,
        strokeColor: borderColor,
        strokeWidth: borderWidth,
        zIndex: 3,
      } as ShapeElement);
    }

    currentY += rowHeight;
  });

  const totalHeight = currentY - tableY;

  return {
    width: tableWidth,
    height: totalHeight,
    elements,
  };
}
