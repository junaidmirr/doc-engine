import { DocumentDefinition } from '../types';
import { createDocument } from '../core/document';

export interface ResumeData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    description: string;
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
}

export function createResumeDocument(data: ResumeData): DocumentDefinition {
  const doc = createDocument({
    defaultPageSize: 'letter',
    coordinateOrigin: 'top-left',
    metadata: {
      title: `${data.fullName} - Resume`,
      author: data.fullName,
      subject: data.title,
    },
  });

  // Left Column Background (Sidebar)
  doc.addShape({
    shapeType: 'rectangle',
    x: 0,
    y: 0,
    width: 210,
    height: 792,
    fillColor: '#0f172a',
  });

  // Sidebar: Candidate Name & Title
  doc.addText({
    text: data.fullName,
    x: 24,
    y: 45,
    width: 162,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  });

  doc.addText({
    text: data.title.toUpperCase(),
    x: 24,
    y: 85,
    width: 162,
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#38bdf8',
  });

  // Sidebar: Contact Info
  doc.addText({
    text: 'CONTACT',
    x: 24,
    y: 130,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#94a3b8',
  });

  doc.addText({
    text: `${data.email}\n${data.phone}\n${data.location}`,
    x: 24,
    y: 148,
    width: 162,
    fontSize: 9,
    lineHeight: 1.5,
    color: '#cbd5e1',
  });

  // Sidebar: Skills
  doc.addText({
    text: 'TECHNICAL SKILLS',
    x: 24,
    y: 230,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#94a3b8',
  });

  let skillY = 250;
  data.skills.forEach((skill) => {
    // Skill tag background
    doc.addShape({
      shapeType: 'rectangle',
      x: 24,
      y: skillY,
      width: 162,
      height: 22,
      fillColor: '#1e293b',
      borderRadius: 4,
    });

    doc.addText({
      text: skill,
      x: 32,
      y: skillY + 5,
      fontSize: 9,
      fontWeight: 'bold',
      color: '#e2e8f0',
    });

    skillY += 28;
  });

  // Right Column Content Area
  const rightX = 240;
  const rightWidth = 332;

  // Professional Summary
  doc.addText({
    text: 'PROFESSIONAL SUMMARY',
    x: rightX,
    y: 45,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#0f172a',
  });

  doc.addShape({
    shapeType: 'line',
    x: rightX,
    y: 64,
    x2: rightX + rightWidth,
    y2: 64,
    strokeColor: '#e2e8f0',
    strokeWidth: 1,
  });

  doc.addText({
    text: data.summary,
    x: rightX,
    y: 75,
    width: rightWidth,
    fontSize: 10,
    lineHeight: 1.45,
    color: '#334155',
  });

  // Work Experience
  doc.addText({
    text: 'WORK EXPERIENCE',
    x: rightX,
    y: 165,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#0f172a',
  });

  doc.addShape({
    shapeType: 'line',
    x: rightX,
    y: 184,
    x2: rightX + rightWidth,
    y2: 184,
    strokeColor: '#e2e8f0',
    strokeWidth: 1,
  });

  let expY = 195;
  data.experience.forEach((job) => {
    doc.addText({
      text: job.role,
      x: rightX,
      y: expY,
      width: 200,
      fontSize: 11,
      fontWeight: 'bold',
      color: '#0f172a',
    });

    doc.addText({
      text: job.period,
      x: rightX + 180,
      y: expY,
      width: rightWidth - 180,
      fontSize: 9,
      color: '#64748b',
      align: 'right',
    });

    doc.addText({
      text: job.company,
      x: rightX,
      y: expY + 16,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0284c7',
    });

    doc.addText({
      text: job.description,
      x: rightX,
      y: expY + 32,
      width: rightWidth,
      fontSize: 9.5,
      lineHeight: 1.4,
      color: '#475569',
    });

    expY += 85;
  });

  // Education
  doc.addText({
    text: 'EDUCATION',
    x: rightX,
    y: expY + 10,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: '#0f172a',
  });

  doc.addShape({
    shapeType: 'line',
    x: rightX,
    y: expY + 29,
    x2: rightX + rightWidth,
    y2: expY + 29,
    strokeColor: '#e2e8f0',
    strokeWidth: 1,
  });

  let eduY = expY + 40;
  data.education.forEach((edu) => {
    doc.addText({
      text: edu.degree,
      x: rightX,
      y: eduY,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0f172a',
    });

    doc.addText({
      text: `${edu.school} (${edu.year})`,
      x: rightX,
      y: eduY + 14,
      fontSize: 9.5,
      color: '#64748b',
    });

    eduY += 36;
  });

  return doc.toDefinition();
}
