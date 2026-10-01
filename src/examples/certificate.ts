import { DocumentDefinition } from '../types';
import { createDocument } from '../core/document';

export interface CertificateData {
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  date: string;
  certificateId: string;
  instructorName: string;
  directorName: string;
}

export function createCertificateDocument(data: CertificateData): DocumentDefinition {
  const doc = createDocument({
    defaultPageSize: 'a4',
    orientation: 'landscape',
    coordinateOrigin: 'top-left',
    metadata: {
      title: `Certificate of Completion - ${data.recipientName}`,
      author: data.organizationName,
      subject: `Achievement in ${data.courseTitle}`,
    },
  });

  const pageWidth = 841.89;
  const pageHeight = 595.28;

  // Outer Border
  doc.addShape({
    shapeType: 'rectangle',
    x: 24,
    y: 24,
    width: pageWidth - 48,
    height: pageHeight - 48,
    fillColor: '#fdfbf7',
    strokeColor: '#0f172a',
    strokeWidth: 4,
  });

  // Inner Ornate Gold Border
  doc.addShape({
    shapeType: 'rectangle',
    x: 36,
    y: 36,
    width: pageWidth - 72,
    height: pageHeight - 72,
    fillColor: 'transparent',
    strokeColor: '#d97706',
    strokeWidth: 1.5,
  });

  // Header Title
  doc.addText({
    text: data.organizationName.toUpperCase(),
    x: 60,
    y: 70,
    width: pageWidth - 120,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: '#64748b',
    align: 'center',
  });

  doc.addText({
    text: 'CERTIFICATE OF COMPLETION',
    x: 60,
    y: 110,
    width: pageWidth - 120,
    fontSize: 32,
    fontFamily: 'Times-Roman',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    color: '#0f172a',
    align: 'center',
  });

  doc.addText({
    text: 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
    x: 60,
    y: 175,
    width: pageWidth - 120,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#94a3b8',
    align: 'center',
  });

  // Recipient Name
  doc.addText({
    text: data.recipientName,
    x: 60,
    y: 210,
    width: pageWidth - 120,
    fontSize: 36,
    fontFamily: 'Times-Roman',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#0369a1',
    align: 'center',
  });

  // Gold Divider Under Recipient Name
  doc.addShape({
    shapeType: 'line',
    x: 240,
    y: 265,
    x2: pageWidth - 240,
    y2: 265,
    strokeColor: '#d97706',
    strokeWidth: 2,
  });

  // Description
  doc.addText({
    text: `For successfully demonstrating mastery and completion of the advanced curriculum in`,
    x: 100,
    y: 285,
    width: pageWidth - 200,
    fontSize: 12,
    color: '#475569',
    align: 'center',
  });

  // Course Title
  doc.addText({
    text: data.courseTitle,
    x: 100,
    y: 315,
    width: pageWidth - 200,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    align: 'center',
  });

  // Award Badge
  doc.addShape({
    shapeType: 'circle',
    x: pageWidth / 2 - 30,
    y: 360,
    width: 60,
    height: 60,
    fillColor: '#fef3c7',
    strokeColor: '#d97706',
    strokeWidth: 2,
  });

  doc.addText({
    text: 'VERIFIED\nEXCELLENCE',
    x: pageWidth / 2 - 40,
    y: 378,
    width: 80,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#b45309',
    align: 'center',
  });

  // Signatures Area
  const sigY = 475;

  // Instructor
  doc.addShape({
    shapeType: 'line',
    x: 120,
    y: sigY,
    x2: 300,
    y2: sigY,
    strokeColor: '#64748b',
    strokeWidth: 1,
  });
  doc.addText({
    text: data.instructorName,
    x: 120,
    y: sigY + 8,
    width: 180,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    align: 'center',
  });
  doc.addText({
    text: 'Course Lead & Instructor',
    x: 120,
    y: sigY + 24,
    width: 180,
    fontSize: 9,
    color: '#64748b',
    align: 'center',
  });

  // Director
  doc.addShape({
    shapeType: 'line',
    x: pageWidth - 300,
    y: sigY,
    x2: pageWidth - 120,
    y2: sigY,
    strokeColor: '#64748b',
    strokeWidth: 1,
  });
  doc.addText({
    text: data.directorName,
    x: pageWidth - 300,
    y: sigY + 8,
    width: 180,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    align: 'center',
  });
  doc.addText({
    text: 'Managing Director',
    x: pageWidth - 300,
    y: sigY + 24,
    width: 180,
    fontSize: 9,
    color: '#64748b',
    align: 'center',
  });

  // Footer Metadata
  doc.addText({
    text: `Issued on: ${data.date}   |   Certificate ID: ${data.certificateId}`,
    x: 60,
    y: 535,
    width: pageWidth - 120,
    fontSize: 8,
    color: '#94a3b8',
    align: 'center',
  });

  return doc.toDefinition();
}
