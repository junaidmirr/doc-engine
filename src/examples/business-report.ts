import { DocumentDefinition } from '../types';
import { createDocument } from '../core/document';
import { wrapText } from '../layout/text-wrap';

export interface ReportMetric {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface BusinessReportData {
  companyName: string;
  reportTitle: string;
  quarter: string;
  year: number;
  preparedBy: string;
  summaryText: string;
  metrics: ReportMetric[];
  highlights: string[];
}

export function createBusinessReportDocument(data: BusinessReportData): DocumentDefinition {
  const doc = createDocument({
    defaultPageSize: 'letter',
    coordinateOrigin: 'top-left',
    metadata: {
      title: `${data.companyName} - ${data.reportTitle}`,
      author: data.preparedBy,
      subject: `Quarterly Business Performance ${data.quarter} ${data.year}`,
    },
  });

  // ==========================================
  // PAGE 1: Executive Summary & KPI Cards
  // ==========================================

  // Header Banner
  doc.addShape({
    shapeType: 'rectangle',
    x: 40,
    y: 40,
    width: 532,
    height: 75,
    fillColor: '#0f172a',
    borderRadius: 6,
  });

  doc.addText({
    text: `${data.companyName.toUpperCase()}  •  ${data.quarter} ${data.year}`,
    x: 60,
    y: 52,
    width: 490,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: '#38bdf8',
  });

  doc.addText({
    text: data.reportTitle,
    x: 60,
    y: 70,
    width: 490,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  });

  // Executive Summary Narrative
  doc.addText({
    text: 'EXECUTIVE OVERVIEW',
    x: 40,
    y: 130,
    width: 532,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  });

  doc.addText({
    text: data.summaryText,
    x: 40,
    y: 150,
    width: 532,
    fontSize: 11,
    lineHeight: 1.5,
    color: '#475569',
  });

  // KPI Metrics Grid (dynamically sized for any metric count)
  const cardY = 245;
  const numCards = Math.max(1, data.metrics.length);
  const totalGridWidth = 532;
  const cardGap = 12;
  const cardWidth = (totalGridWidth - (numCards - 1) * cardGap) / numCards;
  const isCompact = numCards >= 4;

  data.metrics.forEach((metric, idx) => {
    const cardX = 40 + idx * (cardWidth + cardGap);

    doc.addShape({
      shapeType: 'rectangle',
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: 95,
      fillColor: '#f8fafc',
      strokeColor: '#e2e8f0',
      strokeWidth: 1,
      borderRadius: 6,
    });

    const labelLines = wrapText({
      text: metric.label.toUpperCase(),
      maxWidth: cardWidth - 20,
      fontSize: isCompact ? 8 : 9,
      isBold: true,
    });
    const labelHeight = Math.max(12, labelLines.length * (isCompact ? 10.5 : 12));

    doc.addText({
      text: metric.label.toUpperCase(),
      x: cardX + 10,
      y: cardY + 12,
      width: cardWidth - 20,
      fontSize: isCompact ? 8 : 9,
      fontWeight: 'bold',
      lineHeight: 1.25,
      color: '#64748b',
    });

    const valueY = cardY + 12 + labelHeight + 4;
    doc.addText({
      text: metric.value,
      x: cardX + 10,
      y: valueY,
      width: cardWidth - 20,
      fontSize: isCompact ? 18 : 22,
      fontWeight: 'bold',
      color: '#0f172a',
    });

    doc.addText({
      text: metric.change,
      x: cardX + 10,
      y: cardY + 74,
      width: cardWidth - 20,
      fontSize: isCompact ? 9 : 10,
      fontWeight: 'bold',
      color: metric.isPositive ? '#16a34a' : '#dc2626',
    });
  });

  // Key Strategic Highlights
  doc.addText({
    text: 'STRATEGIC HIGHLIGHTS',
    x: 40,
    y: 365,
    width: 532,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  });

  let bulletY = 390;
  data.highlights.forEach((item) => {
    doc.addShape({
      shapeType: 'circle',
      x: 45,
      y: bulletY + 4,
      width: 5,
      height: 5,
      fillColor: '#0284c7',
    });

    doc.addText({
      text: item,
      x: 60,
      y: bulletY,
      width: 512,
      fontSize: 10,
      lineHeight: 1.4,
      color: '#334155',
    });

    bulletY += 32;
  });

  // Page 1 Footer
  doc.addText({
    text: `Prepared by ${data.preparedBy}   |   Confidential - For Internal Use Only`,
    x: 40,
    y: 720,
    width: 532,
    fontSize: 9,
    color: '#94a3b8',
    align: 'center',
  });

  // ==========================================
  // PAGE 2: Financial Breakdown & Projections
  // ==========================================
  doc.addPage();

  // Page 2 Header
  doc.addText({
    text: 'FINANCIAL PERFORMANCE BREAKDOWN',
    x: 40,
    y: 45,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  });

  doc.addShape({
    shapeType: 'line',
    x: 40,
    y: 70,
    x2: 572,
    y2: 70,
    strokeColor: '#cbd5e1',
    strokeWidth: 1,
  });

  // Visual Bar Chart Demonstration using pure vector rectangles
  doc.addText({
    text: 'Quarterly Revenue Growth (USD Millions)',
    x: 40,
    y: 95,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  });

  const chartY = 130;
  const bars = [
    { label: 'Q1', value: 3.2, max: 6.0 },
    { label: 'Q2', value: 4.1, max: 6.0 },
    { label: 'Q3', value: 4.8, max: 6.0 },
    { label: 'Q4', value: 5.6, max: 6.0 },
  ];

  bars.forEach((b, idx) => {
    const by = chartY + idx * 45;
    const barWidth = (b.value / b.max) * 360;

    doc.addText({ text: b.label, x: 40, y: by + 6, fontSize: 11, fontWeight: 'bold', color: '#334155' });

    // Background track
    doc.addShape({
      shapeType: 'rectangle',
      x: 75,
      y: by,
      width: 360,
      height: 24,
      fillColor: '#f1f5f9',
      borderRadius: 4,
    });

    // Fill bar
    doc.addShape({
      shapeType: 'rectangle',
      x: 75,
      y: by,
      width: barWidth,
      height: 24,
      fillColor: idx === bars.length - 1 ? '#0284c7' : '#38bdf8',
      borderRadius: 4,
    });

    doc.addText({
      text: `$${b.value}M`,
      x: 75 + barWidth + 12,
      y: by + 6,
      fontSize: 10,
      fontWeight: 'bold',
      color: '#0f172a',
    });
  });

  // Page 2 Footer
  doc.addText({
    text: `Page 2 of 2   •   ${data.companyName} Strategic Report`,
    x: 40,
    y: 720,
    width: 532,
    fontSize: 9,
    color: '#94a3b8',
    align: 'center',
  });

  return doc.toDefinition();
}
