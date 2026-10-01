# Quickstart Guide: doc-engine

Get started with `doc-engine` in less than 5 minutes.

---

## 1. Node.js / TypeScript Example

Generate an invoice PDF from Node.js with zero browser dependencies:

```typescript
import { createDocument, PdfRenderer } from 'doc-engine';
import fs from 'node:fs/promises';

async function main() {
  const doc = createDocument({
    defaultPageSize: 'letter',
    coordinateOrigin: 'top-left',
    metadata: {
      title: 'Invoice #1001',
      author: 'Acme Software',
    },
  });

  // Add Company Header
  doc.addShape({
    shapeType: 'rectangle',
    x: 40,
    y: 40,
    width: 532,
    height: 50,
    fillColor: '#0f172a',
    borderRadius: 4,
  });

  doc.addText({
    text: 'ACME SOFTWARE INC.',
    x: 55,
    y: 55,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  });

  // Add Bill Details
  doc.addText({
    text: 'Billed to: Cyberdyne Systems\nDue Date: October 15, 2026\nAmount Due: $4,500.00',
    x: 40,
    y: 110,
    fontSize: 12,
    lineHeight: 1.5,
    color: '#334155',
  });

  // Render to PDF
  const pdfBytes = await PdfRenderer.renderToBytes(doc.toDefinition());
  await fs.writeFile('invoice.pdf', pdfBytes);
  console.log('✅ Generated invoice.pdf successfully!');
}

main();
```

---

## 2. Next.js / React Example

Render a client-side live preview that users can download:

```tsx
'use client';

import React from 'react';
import { DocumentViewer } from 'doc-engine/react';
import { createCertificateDocument } from 'doc-engine/examples';

const certificateData = createCertificateDocument({
  recipientName: 'Sarah Jenkins',
  courseTitle: 'Advanced Cloud Architecture',
  organizationName: 'Cloud Engineering Academy',
  date: 'October 2026',
  certificateId: 'CEA-2026-9921',
  instructorName: 'Dr. Jane Smith',
  directorName: 'Alan Turing',
});

export default function CertificatePage() {
  return (
    <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Your Certificate</h1>
      <p>Preview your certificate below and download the high-resolution vector PDF.</p>
      
      <DocumentViewer
        document={certificateData}
        initialScale={0.9}
        showToolbar={true}
      />
    </main>
  );
}
```

---

## 3. Serverless API Route Example (Next.js App Router / Express)

Return a dynamically generated PDF from an API endpoint:

```typescript
// app/api/pdf/route.ts
import { NextResponse } from 'next/server';
import { createInvoiceDocument } from 'doc-engine/examples';
import { PdfRenderer } from 'doc-engine';

export async function POST(req: Request) {
  const body = await req.json();
  const invoiceDoc = createInvoiceDocument(body);
  const pdfBytes = await PdfRenderer.renderToBytes(invoiceDoc);

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="invoice.pdf"',
    },
  });
}
```
