import { describe, it, expect } from 'vitest';
import { PdfRenderer } from '../src/renderers/pdf/pdf-renderer';
import { createInvoiceDocument } from '../src/examples/invoice';
import { createCertificateDocument } from '../src/examples/certificate';
import { createBusinessReportDocument } from '../src/examples/business-report';
import { createResumeDocument } from '../src/examples/resume';

describe('PDF Vector Renderer', () => {
  it('should render a professional Invoice to valid PDF bytes', async () => {
    const invoiceDef = createInvoiceDocument({
      invoiceNumber: 'INV-2026-001',
      issueDate: 'October 1, 2026',
      dueDate: 'October 15, 2026',
      sender: {
        name: 'Sarah Connor',
        company: 'SkyNet Labs Inc.',
        email: 'billing@skynet.example',
        address: '100 Silicon Way, Tech City, CA',
      },
      client: {
        name: 'John Doe',
        company: 'Cyberdyne Systems',
        email: 'john@cyberdyne.example',
        address: '456 Innovation Blvd, Austin, TX',
      },
      items: [
        { description: 'Cloud Architecture & System Design', quantity: 40, unitPrice: 150 },
        { description: 'Vector Document Engine Extraction', quantity: 25, unitPrice: 120 },
        { description: 'TypeScript Native PDF Implementation', quantity: 15, unitPrice: 130 },
      ],
      notes: 'Payment via wire transfer or ACH within 14 calendar days.',
    });

    const pdfBytes = await PdfRenderer.renderToBytes(invoiceDef);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify PDF Magic Bytes (%PDF-)
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('should render an Award Certificate to valid PDF bytes', async () => {
    const certDef = createCertificateDocument({
      recipientName: 'Alexandra Montgomery',
      courseTitle: 'Full-Stack Document Systems Engineering',
      organizationName: 'Global Institute of Software Architecture',
      date: 'October 2026',
      certificateId: 'GISA-CERT-99482',
      instructorName: 'Dr. Robert C. Martin',
      directorName: 'Elena Rostova',
    });

    const pdfBytes = await PdfRenderer.renderToBytes(certDef);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('should render a Multi-page Business Report to valid PDF bytes', async () => {
    const reportDef = createBusinessReportDocument({
      companyName: 'Apex Dynamics',
      reportTitle: 'Quarterly Executive Review',
      quarter: 'Q3',
      year: 2026,
      preparedBy: 'Strategic Planning Group',
      summaryText: 'Apex Dynamics delivered record operating performance across enterprise accounts during the third quarter, driven by unprecedented adoption of developer tools and serverless runtime platforms.',
      metrics: [
        { label: 'Total Revenue', value: '$18.4M', change: '+24% YoY', isPositive: true },
        { label: 'Gross Margin', value: '78.2%', change: '+3.1% QoQ', isPositive: true },
        { label: 'Customer Churn', value: '0.8%', change: '-0.3%', isPositive: true },
      ],
      highlights: [
        'Surpassed 500,000 active monthly document renderings across enterprise clusters.',
        'Successfully completed migration of core rendering pipelines to pure TypeScript.',
        'Decreased cold-start function overhead to under 20 milliseconds.',
      ],
    });

    const pdfBytes = await PdfRenderer.renderToBytes(reportDef);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(reportDef.pages.length).toBe(2);

    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  it('should render a Modern Resume to valid PDF bytes', async () => {
    const resumeDef = createResumeDocument({
      fullName: 'Marcus Vance',
      title: 'Principal Software Engineer',
      email: 'marcus@vance.dev',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      summary: 'Distinguished systems architect with 10+ years specializing in distributed systems, high-performance rendering engines, and developer infrastructure.',
      skills: ['TypeScript', 'React', 'Node.js', 'WebAssembly', 'PDF Internals', 'Rust'],
      experience: [
        {
          role: 'Staff Systems Architect',
          company: 'HyperScale Corp',
          period: '2023 - Present',
          description: 'Architected next-generation document layout engines processing over 10M vector documents weekly.',
        },
        {
          role: 'Senior Software Engineer',
          company: 'CloudVector Labs',
          period: '2020 - 2023',
          description: 'Designed client-side rendering pipeline reducing memory consumption by 65%.',
        },
      ],
      education: [
        {
          degree: 'B.S. in Computer Science',
          school: 'Stanford University',
          year: '2019',
        },
      ],
    });

    const pdfBytes = await PdfRenderer.renderToBytes(resumeDef);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const header = String.fromCharCode(...pdfBytes.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});
