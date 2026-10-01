import { PdfRenderer } from './src/renderers/pdf/pdf-renderer';
import { createInvoiceDocument } from './src/examples/invoice';
import { createCertificateDocument } from './src/examples/certificate';
import { createBusinessReportDocument } from './src/examples/business-report';
import { createResumeDocument } from './src/examples/resume';
import fs from 'node:fs/promises';
import path from 'node:path';

async function generateSamplePdfs() {
  const outDir = path.join(__dirname, 'output');
  await fs.mkdir(outDir, { recursive: true });

  console.log('Generating sample PDFs in', outDir);

  // 1. Invoice
  const invoice = createInvoiceDocument({
    invoiceNumber: 'INV-2026-001',
    issueDate: 'October 1, 2026',
    dueDate: 'October 15, 2026',
    sender: {
      name: 'Sarah Connor',
      company: 'Resumagic Open Source Systems',
      email: 'billing@resumagic.example',
      address: '100 Silicon Way, Tech City, CA',
    },
    client: {
      name: 'John Doe',
      company: 'Cyberdyne Systems',
      email: 'john@cyberdyne.example',
      address: '456 Innovation Blvd, Austin, TX',
    },
    items: [
      { description: 'Cloud Architecture & Document Systems Consulting', quantity: 40, unitPrice: 150 },
      { description: 'Vector Rendering Engine Extraction', quantity: 25, unitPrice: 120 },
      { description: 'TypeScript Native PDF Implementation', quantity: 15, unitPrice: 130 },
    ],
    notes: 'Payment via wire transfer or ACH within 14 calendar days.',
  });
  const invoiceBytes = await PdfRenderer.renderToBytes(invoice);
  await fs.writeFile(path.join(outDir, 'sample-invoice.pdf'), invoiceBytes);
  console.log('  ✅ sample-invoice.pdf generated');

  // 2. Certificate
  const certificate = createCertificateDocument({
    recipientName: 'Alexandra Montgomery',
    courseTitle: 'Full-Stack Document Systems Engineering',
    organizationName: 'Global Institute of Software Architecture',
    date: 'October 2026',
    certificateId: 'GISA-CERT-99482',
    instructorName: 'Dr. Robert C. Martin',
    directorName: 'Elena Rostova',
  });
  const certBytes = await PdfRenderer.renderToBytes(certificate);
  await fs.writeFile(path.join(outDir, 'sample-certificate.pdf'), certBytes);
  console.log('  ✅ sample-certificate.pdf generated');

  // 3. Business Report (Multi-page)
  const report = createBusinessReportDocument({
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
  const reportBytes = await PdfRenderer.renderToBytes(report);
  await fs.writeFile(path.join(outDir, 'sample-business-report.pdf'), reportBytes);
  console.log('  ✅ sample-business-report.pdf generated');

  // 4. Resume
  const resume = createResumeDocument({
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
  const resumeBytes = await PdfRenderer.renderToBytes(resume);
  await fs.writeFile(path.join(outDir, 'sample-resume.pdf'), resumeBytes);
  console.log('  ✅ sample-resume.pdf generated');

  console.log('\nAll 4 sample PDFs created successfully in doc-engine/output/ !');
}

generateSamplePdfs().catch(console.error);
