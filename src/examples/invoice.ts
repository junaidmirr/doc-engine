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
    x: 430,
    y: 52,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#38bdf8',
    align: 'right',
  });

  doc.addText({
    text: `#${data.invoiceNumber}`,
    x: 430,
    y: 80,
    fontSize: 12,
    color: '#94a3b8',
    align: 'right',
  });

  // Sender & Client Columns
  doc.addText({
    text: 'ISSUED BY',
    x: 40,
    y: 135,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  });
  doc.addText({
    text: `${data.sender.name}\n${data.sender.email}\n${data.sender.address}`,
    x: 40,
    y: 150,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#1e293b',
  });

  doc.addText({
    text: 'BILLED TO',
    x: 320,
    y: 135,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
  });
  doc.addText({
    text: `${data.client.name}\n${data.client.company}\n${data.client.email}\n${data.client.address}`,
    x: 320,
    y: 150,
    fontSize: 11,
    lineHeight: 1.4,
    color: '#1e293b',
  });

  // Invoice Dates
  doc.addText({
    text: `Issue Date: ${data.issueDate}   |   Due Date: ${data.dueDate}`,
    x: 40,
    y: 220,
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

  doc.addText({ text: 'DESCRIPTION', x: 50, y: tableY + 8, fontSize: 10, fontWeight: 'bold', color: '#475569' });
  doc.addText({ text: 'QTY', x: 330, y: tableY + 8, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'center' });
  doc.addText({ text: 'PRICE', x: 410, y: tableY + 8, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'right' });
  doc.addText({ text: 'TOTAL', x: 500, y: tableY + 8, fontSize: 10, fontWeight: 'bold', color: '#475569', align: 'right' });

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

    doc.addText({ text: item.description, x: 50, y: rowY + 3, fontSize: 10, color: '#1e293b' });
    doc.addText({ text: String(item.quantity), x: 330, y: rowY + 3, fontSize: 10, color: '#1e293b', align: 'center' });
    doc.addText({ text: `$${item.unitPrice.toFixed(2)}`, x: 410, y: rowY + 3, fontSize: 10, color: '#1e293b', align: 'right' });
    doc.addText({ text: `$${itemTotal.toFixed(2)}`, x: 500, y: rowY + 3, fontSize: 10, fontWeight: 'bold', color: '#0f172a', align: 'right' });

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

  doc.addText({ text: 'Subtotal:', x: 360, y: summaryY, fontSize: 10, color: '#64748b' });
  doc.addText({ text: `$${subtotal.toFixed(2)}`, x: 500, y: summaryY, fontSize: 10, color: '#1e293b', align: 'right' });

  doc.addText({ text: `Tax (${((data.taxRate ?? 0.08) * 100).toFixed(0)}%):`, x: 360, y: summaryY + 18, fontSize: 10, color: '#64748b' });
  doc.addText({ text: `$${tax.toFixed(2)}`, x: 500, y: summaryY + 18, fontSize: 10, color: '#1e293b', align: 'right' });

  // Total Due Highlight Box
  doc.addShape({
    shapeType: 'rectangle',
    x: 340,
    y: summaryY + 40,
    width: 232,
    height: 40,
    fillColor: '#0284c7',
    borderRadius: 4,
  });

  doc.addText({ text: 'AMOUNT DUE', x: 355, y: summaryY + 52, fontSize: 11, fontWeight: 'bold', color: '#ffffff' });
  doc.addText({ text: `$${total.toFixed(2)}`, x: 500, y: summaryY + 50, fontSize: 16, fontWeight: 'bold', color: '#ffffff', align: 'right' });

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
