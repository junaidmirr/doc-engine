import { DocumentDefinition } from '../types';
import { createDocument } from '../core/document';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  sender: {
    name: string;
    company: string;
    email: string;
    address: string;
  };
  client: {
    name: string;
    company: string;
    email: string;
    address: string;
  };
  items: InvoiceItem[];
  taxRate?: number; // e.g. 0.1 for 10%
  notes?: string;
}

export function createInvoiceDocument(data: InvoiceData): DocumentDefinition {
  const doc = createDocument({
    defaultPageSize: 'letter',
    coordinateOrigin: 'top-left',
    metadata: {
      title: `Invoice ${data.invoiceNumber}`,
      author: data.sender.company,
      subject: `Commercial Invoice for ${data.client.company}`,
    },
  });

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * (data.taxRate ?? 0.08);
  const total = subtotal + tax;

  // Header Brand Banner
  doc.addShape({
    shapeType: 'rectangle',
    x: 40,
    y: 40,
    width: 532,
    height: 70,
    fillColor: '#1e293b',
    borderRadius: 6,
  });

  doc.addText({
    text: data.sender.company.toUpperCase(),
    x: 60,
    y: 55,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  });

  doc.addText({
    text: 'INVOICE',
    x: 372,
    y: 52,
    width: 180,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#38bdf8',
    align: 'right',
  });

  doc.addText({
    text: `#${data.invoiceNumber}`,
    x: 372,
    y: 80,
    width: 180,
    fontSize: 12,
    color: '#94a3b8',
    align: 'right',
  });

  // Sender & Client Columns
  doc.addText({
    text: 'ISSUED BY',
    x: 40,
    y: 135,
    width: 260,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  });
  doc.addText({
    text: `${data.sender.name}\n${data.sender.email}\n${data.sender.address}`,
    x: 40,
    y: 150,
    width: 260,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#1e293b',
  });

  doc.addText({
    text: 'BILLED TO',
    x: 320,
    y: 135,
    width: 252,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  });
  doc.addText({
    text: `${data.client.name}\n${data.client.company}\n${data.client.email}\n${data.client.address}`,
    x: 320,
    y: 150,
    width: 252,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#1e293b',
  });

  // Invoice Dates
  doc.addText({
    text: `Issue Date: ${data.issueDate}   |   Due Date: ${data.dueDate}`,
    x: 40,
    y: 220,
    width: 532,
    fontSize: 10,
    color: '#475569',
  });

  // Table Header
  const tableY = 250;
  doc.addShape({
    shapeType: 'rectangle',
    x: 40,
    y: tableY,
    width: 532,
    height: 28,
    fillColor: '#f1f5f9',
  });

  doc.addText({ text: 'DESCRIPTION', x: 50, y: tableY + 8, width: 260, fontSize: 10, fontWeight: 'bold', color: '#475569' });
  doc.addText({ text: 'QTY', x: 320, y: tableY + 8, width: 60, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'center' });
  doc.addText({ text: 'PRICE', x: 390, y: tableY + 8, width: 80, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'right' });
  doc.addText({ text: 'TOTAL', x: 480, y: tableY + 8, width: 82, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'right' });

  // Table Rows
  let rowY = tableY + 32;
  data.items.forEach((item, index) => {
    const itemTotal = item.quantity * item.unitPrice;
    const isAlt = index % 2 === 1;

    if (isAlt) {
      doc.addShape({
        shapeType: 'rectangle',
        x: 40,
        y: rowY - 2,
        width: 532,
        height: 24,
        fillColor: '#f8fafc',
      });
    }

    doc.addText({ text: item.description, x: 50, y: rowY + 3, width: 260, fontSize: 10, color: '#1e293b' });
    doc.addText({ text: String(item.quantity), x: 320, y: rowY + 3, width: 60, fontSize: 10, color: '#1e293b', align: 'center' });
    doc.addText({ text: `$${item.unitPrice.toFixed(2)}`, x: 390, y: rowY + 3, width: 80, fontSize: 10, color: '#1e293b', align: 'right' });
    doc.addText({ text: `$${itemTotal.toFixed(2)}`, x: 480, y: rowY + 3, width: 82, fontSize: 10, fontWeight: 'bold', color: '#0f172a', align: 'right' });

    // Underline divider
    doc.addShape({
      shapeType: 'line',
      x: 40,
      y: rowY + 22,
      x2: 572,
      y2: rowY + 22,
      strokeColor: '#e2e8f0',
      strokeWidth: 0.5,
    });

    rowY += 26;
  });

  // Summary Card
  const summaryY = Math.max(rowY + 20, 520);

  doc.addText({ text: 'Subtotal:', x: 360, y: summaryY, width: 100, fontSize: 10, color: '#64748b' });
  doc.addText({ text: `$${subtotal.toFixed(2)}`, x: 470, y: summaryY, width: 92, fontSize: 10, color: '#1e293b', align: 'right' });

  doc.addText({ text: `Tax (${((data.taxRate ?? 0.08) * 100).toFixed(0)}%):`, x: 360, y: summaryY + 18, width: 100, fontSize: 10, color: '#64748b' });
  doc.addText({ text: `$${tax.toFixed(2)}`, x: 470, y: summaryY + 18, width: 92, fontSize: 10, color: '#1e293b', align: 'right' });

  // Total Due Highlight Box
  doc.addShape({
    shapeType: 'rectangle',
    x: 340,
    y: summaryY + 40,
    width: 232,
    height: 42,
    fillColor: '#0284c7',
    borderRadius: 6,
  });

  doc.addText({
    text: 'TOTAL DUE',
    x: 356,
    y: summaryY + 54,
    width: 100,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  });

  doc.addText({
    text: `$${total.toFixed(2)}`,
    x: 456,
    y: summaryY + 52,
    width: 104,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'right',
  });

  // Notes & Footer
  if (data.notes) {
    doc.addText({ text: 'PAYMENT TERMS & NOTES', x: 40, y: summaryY + 20, fontSize: 9, fontWeight: 'bold', color: '#64748b' });
    doc.addText({ text: data.notes, x: 40, y: summaryY + 36, width: 280, fontSize: 9, lineHeight: 1.4, color: '#64748b' });
  }

  doc.addText({
    text: 'Thank you for your business!',
    x: 40,
    y: 720,
    width: 532,
    fontSize: 10,
    fontStyle: 'italic',
    color: '#94a3b8',
    align: 'center',
  });

  return doc.toDefinition();
}
