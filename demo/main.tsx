import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DocumentViewer } from '../src/react/viewer';
import { createInvoiceDocument } from '../src/examples/invoice';
import { createCertificateDocument } from '../src/examples/certificate';
import { createBusinessReportDocument } from '../src/examples/business-report';
import { createResumeDocument } from '../src/examples/resume';

const sampleInvoice = createInvoiceDocument({
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
    { description: 'Cloud Architecture & Systems Engineering', quantity: 40, unitPrice: 150 },
    { description: 'Vector Document Engine Extraction', quantity: 25, unitPrice: 120 },
    { description: 'TypeScript Native PDF Implementation', quantity: 15, unitPrice: 130 },
  ],
  notes: 'Payment via wire transfer or ACH within 14 calendar days.',
});

const sampleCertificate = createCertificateDocument({
  recipientName: 'Alexandra Montgomery',
  courseTitle: 'Full-Stack Systems Architecture',
  organizationName: 'Global Institute of Software Architecture',
  date: 'October 2026',
  certificateId: 'GISA-CERT-99482',
  instructorName: 'Dr. Robert C. Martin',
  directorName: 'Elena Rostova',
});

const sampleReport = createBusinessReportDocument({
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

const sampleResume = createResumeDocument({
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

function PlaygroundApp() {
  const [selectedTemplate, setSelectedTemplate] = useState<'invoice' | 'certificate' | 'report' | 'resume'>('invoice');

  const getDoc = () => {
    switch (selectedTemplate) {
      case 'certificate': return sampleCertificate;
      case 'report': return sampleReport;
      case 'resume': return sampleResume;
      case 'invoice':
      default:
        return sampleInvoice;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      <header style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a' }}>
          📄 doc-engine Interactive Playground
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
          Pure TypeScript Document Layout & Vector Rendering Engine (Zero Python, Zero Screenshots)
        </p>
      </header>

      {/* Template Selector Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        {[
          { id: 'invoice', label: '🧾 Commercial Invoice' },
          { id: 'certificate', label: '🏆 Award Certificate' },
          { id: 'report', label: '📊 Executive Business Report' },
          { id: 'resume', label: '💼 Modern Tech Resume' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTemplate(tab.id as any)}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              border: selectedTemplate === tab.id ? '2px solid #0284c7' : '1px solid #cbd5e1',
              background: selectedTemplate === tab.id ? '#e0f2fe' : '#ffffff',
              color: selectedTemplate === tab.id ? '#0369a1' : '#475569',
              fontWeight: selectedTemplate === tab.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Viewer Box */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DocumentViewer
          key={selectedTemplate}
          document={getDoc()}
          initialScale={0.9}
          showToolbar={true}
        />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<PlaygroundApp />);
