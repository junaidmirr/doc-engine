# @worklabs05/doc-engine

> A modern open-source document rendering & layout engine for React and TypeScript that produces real, searchable vector PDFs. Zero Python, zero headless browsers, zero screenshots.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/@worklabs05/doc-engine.svg)](https://www.npmjs.com/package/@worklabs05/doc-engine)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Runtime](https://img.shields.io/badge/Runtime-Browser%20%7C%20Node%20%7C%20Edge-brightgreen)](#)

---

## 💡 Why `doc-engine`?

Most PDF tools force you into one of two compromises:
1. **Heavy Backend Stacks**: Require Python (ReportLab / PyMuPDF), headless Chrome (Puppeteer / Playwright), or specialized C++ binaries that blow serverless limits and require complex infrastructure.
2. **Fake Client-Side PDFs**: Libraries that screenshot DOM elements with `html2canvas` and paste blurry raster images inside a PDF, losing text selectability, vector sharpness, accessibility, and search indexing.

**`doc-engine` is different.** It was extracted from the document layout and vector rendering logic of Resumagic into an independent, pure TypeScript library. It treats **the document format and layout engine as the primary product**, compiling directly to standard vector PDF objects via [`pdf-lib`](https://github.com/Hopding/pdf-lib).

### Key Features

- **🚀 100% JavaScript & TypeScript**: Runs seamlessly in the Browser, Web Workers, Node.js, Next.js, and Vercel/Cloudflare Edge functions.
- **📄 Real Vector PDFs**: Crisp at any zoom level, searchable text, selectable text, vector shapes, and real embedded fonts (~3-4KB per page).
- **📐 Dual Coordinate System**: Code using web/design standard **Top-Left (0,0)** coordinates or native PDF **Bottom-Left (0,0)** coordinates — the engine handles the projection automatically.
- **📏 Typographic Text Wrapping**: Built-in font metrics (AFM) for instantaneous, accurate word-wrapping and token fitting without requiring a DOM or canvas.
- **🧩 Flexbox, Grids & Tables**: First-class layout primitives with flex row/column stacks, 2D grids, and itemized tables with zebra striping.
- **📑 Automatic Pagination & Constraints**: Splits overflowing content across multiple pages with repeated headers, footers, and rules like `keepWithNext` or `pageBreakInside: 'avoid'`.
- **⚛️ First-Class React Layer**: Declarative JSX components (`<Document>`, `<Page>`, `<View>`, `<Text>`, `<Shape>`, `<Image>`, `<Table>`, `<Grid>`), reactive hooks (`usePDF`, `useDocument`), and an interactive `<DocumentViewer>` component.
- **🎨 Multi-Target Rendering**: Render the same document AST to a **native PDF**, an interactive **HTML5 Canvas** (60 FPS preview), or standalone **SVG**.

---

## 📦 Installation

```bash
npm install @worklabs05/doc-engine pdf-lib
```

If you're using React:
```bash
npm install @worklabs05/doc-engine pdf-lib react react-dom
```

---

## 🚀 Quickstart

### 1. Pure TypeScript / Node.js Backend

```typescript
import { createDocument, PdfRenderer } from '@worklabs05/doc-engine';
import fs from 'node:fs/promises';

// 1. Build document using fluent API
const doc = createDocument({
  defaultPageSize: 'letter',
  coordinateOrigin: 'top-left',
  metadata: { title: 'My First Document', author: 'Jane Developer' },
});

// 2. Add header shape & text
doc.addShape({
  shapeType: 'rectangle',
  x: 40, y: 40, width: 532, height: 60,
  fillColor: '#1e293b', borderRadius: 6,
});

doc.addText({
  text: 'Hello from @worklabs05/doc-engine!',
  x: 60, y: 58, fontSize: 18, fontWeight: 'bold', color: '#ffffff',
});

// 3. Render directly to real vector PDF bytes
const pdfBytes = await PdfRenderer.renderToBytes(doc.toDefinition());

// Save to disk or return in API response
await fs.writeFile('output.pdf', pdfBytes);
```

---

### 2. Declarative React Components

```tsx
import React from 'react';
import { Document, Page, View, Text, Table, usePDF } from '@worklabs05/doc-engine/react';

export function InvoiceViewer() {
  const invoiceDoc = (
    <Document defaultPageSize="letter">
      <Page backgroundColor="#ffffff">
        <View x={40} y={40} width={532} height={80} backgroundColor="#f8fafc" borderRadius={8} padding={16}>
          <Text fontSize={20} fontWeight="bold" color="#0f172a">
            Acme Corporation
          </Text>
          <Text fontSize={12} color="#64748b">
            Invoice #INV-2026-001
          </Text>
        </View>

        <Text x={40} y={140} width={532} fontSize={12} color="#334155">
          Thank you for choosing our services. Your payment of $1,250.00 is due by Oct 15, 2026.
        </Text>
      </Page>
    </Document>
  );

  const { dataUrl, loading, download } = usePDF(invoiceDoc);

  if (loading) return <div>Generating PDF...</div>;

  return (
    <div>
      <button onClick={() => download('invoice.pdf')}>Download PDF</button>
      {dataUrl && <iframe src={dataUrl} style={{ width: '100%', height: '800px' }} />}
    </div>
  );
}
```

---

### 3. Interactive Live Preview (`<DocumentViewer>`)

```tsx
import React from 'react';
import { DocumentViewer } from '@worklabs05/doc-engine/react';
import { createInvoiceDocument } from '@worklabs05/doc-engine/examples';

const invoiceData = createInvoiceDocument({
  invoiceNumber: 'INV-2026-001',
  issueDate: 'October 1, 2026',
  dueDate: 'October 15, 2026',
  items: [
    { description: 'Cloud Architecture Consulting', quantity: 40, unitPrice: 150 },
    { description: 'Document Engine Integration', quantity: 20, unitPrice: 120 },
  ],
});

export function App() {
  return (
    <div style={{ padding: '24px' }}>
      <h1>Live Document Preview</h1>
      <DocumentViewer document={invoiceData} initialScale={1.0} showToolbar={true} />
    </div>
  );
}
```

---

## 🗂 Document Model (AST)

At the heart of `doc-engine` is a serializable JSON AST:

```typescript
interface DocumentDefinition {
  id?: string;
  metadata?: DocumentMetadata;
  coordinateOrigin?: 'top-left' | 'bottom-left';
  defaultPageSize?: 'letter' | 'a4' | 'a3' | 'legal' | { width: number; height: number };
  orientation?: 'portrait' | 'landscape';
  pages: PageDefinition[];
}
```

### Supported Elements:
- `text`: Multiline wrapping, alignment (left/center/right/justify), letter spacing, line height, underline, bold, italic.
- `shape`: Rectangles, rounded rectangles, circles, lines, quadratic curves, arrows, polygons, and custom SVG paths.
- `image`: PNG, JPEG, and SVG embedding with `contain`, `cover`, or `fill` modes.
- `view`: Nested flex/flow containers with direction, gap, and padding.
- `table`: Itemized table columns, fractional width layout, and zebra striping.
- `grid`: 2D multi-column grids with row and column gaps.

---

## 📚 Built-In Document Generators

`doc-engine` includes production-ready document templates out of the box in `@worklabs05/doc-engine/examples`:

- **Commercial Invoice**: `createInvoiceDocument(data)`
- **Award Certificate**: `createCertificateDocument(data)`
- **Executive Business Report**: `createBusinessReportDocument(data)`
- **Modern Tech Resume**: `createResumeDocument(data)`

```typescript
import { createCertificateDocument } from '@worklabs05/doc-engine/examples';
import { PdfRenderer } from '@worklabs05/doc-engine';

const cert = createCertificateDocument({
  recipientName: 'Alexandra Montgomery',
  courseTitle: 'Full-Stack Systems Architecture',
  organizationName: 'Global Institute of Software Architecture',
  date: 'October 2026',
});

const pdfBytes = await PdfRenderer.renderToBytes(cert);
```

---

## ⚖️ License

MIT License © worklabs Open Source Initiative.
