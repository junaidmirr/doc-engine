/**
 * Document Rendering Engine - Core Type Definitions & Document AST
 *
 * Designed as a standalone, declarative document model capable of powering
 * resumes, invoices, certificates, reports, and arbitrary vector documents.
 */

export type PageSizeName = 'letter' | 'a4' | 'a3' | 'a5' | 'legal' | 'tabloid';

export interface PageDimensions {
  width: number;
  height: number;
}

export type PageOrientation = 'portrait' | 'landscape';

export type CoordinateOrigin = 'top-left' | 'bottom-left';

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type FontWeight = 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type FontStyle = 'normal' | 'italic' | 'oblique';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'polygon' | 'path';
export type ImageMaskShape = 'none' | 'circle' | 'rounded';
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none';

export type ElementType = 'text' | 'shape' | 'image' | 'view' | 'table' | 'grid';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  opacity?: number;
  rotation?: number; // In degrees
  locked?: boolean;
  pageId?: string;

  // Layout Constraints
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Page Break Constraints
  pageBreakBefore?: boolean;
  pageBreakAfter?: boolean;
  pageBreakInside?: 'auto' | 'avoid';
  keepWithNext?: boolean;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: FontWeight;
  fontStyle?: FontStyle;
  color?: string;
  align?: TextAlign;
  lineHeight?: number; // Multiplier, e.g., 1.2, 1.4
  letterSpacing?: number; // Points
  underline?: boolean;
  strike?: boolean;
  wrap?: boolean;
  maxLines?: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  dashArray?: number[];
  // For Line and Arrow
  x2?: number;
  y2?: number;
  controlX?: number; // Quadratic Bezier control X
  controlY?: number; // Quadratic Bezier control Y
  // For Polygons: flat coordinate array [x1, y1, x2, y2, ...]
  points?: number[];
  // For custom SVG paths (e.g., icons, logos, decorative waves)
  pathData?: string;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string | Uint8Array; // data URL, https URL, or raw bytes
  fit?: ObjectFit;
  maskShape?: ImageMaskShape;
  borderRadius?: number;
  tintColor?: string; // Optional color overlay (for icons/monochrome vectors)
}

export interface ViewElement extends BaseElement {
  type: 'view';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number | [number, number] | [number, number, number, number];
  layout?: 'absolute' | 'flex';
  flexDirection?: 'row' | 'column';
  gap?: number;
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  children?: DocumentElement[];
}

export interface TableCell {
  id?: string;
  content: string | DocumentElement | DocumentElement[];
  width?: number;
  colSpan?: number;
  rowSpan?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  align?: TextAlign;
  padding?: number | [number, number];
}

export interface TableColumnConfig {
  header?: string;
  width?: number | string; // e.g. 50, '2fr', '30%'
  align?: TextAlign;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  fontWeight?: FontWeight;
}

export type TableColumnSpec = number | string | TableColumnConfig;

export interface TableRow {
  id?: string;
  cells: TableCell[];
  height?: number;
  backgroundColor?: string;
  isHeader?: boolean;
}

export interface TableElement extends BaseElement {
  type: 'table';
  columns?: TableColumnSpec[]; // e.g. [100, 200, 'auto', '2fr'] or [{ header: 'Item', width: '2fr' }]
  header?: TableRow;
  rows: TableRow[];
  repeatHeaderOnNewPage?: boolean;
  borderWidth?: number;
  borderColor?: string;
  cellPadding?: number;
  zebra?: boolean;
  zebraColor?: string;
  autoWrap?: boolean;
}

export interface GridElement extends BaseElement {
  type: 'grid';
  columns: number | (number | string)[]; // Column count or column widths
  gap?: number | [number, number]; // [rowGap, colGap]
  children: DocumentElement[];
}

export type DocumentElement =
  | TextElement
  | ShapeElement
  | ImageElement
  | ViewElement
  | TableElement
  | GridElement;

export interface PageDefinition {
  id: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  margins?: Partial<Margins>;
  elements: DocumentElement[];
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface DocumentDefinition {
  id?: string;
  metadata?: DocumentMetadata;
  coordinateOrigin?: CoordinateOrigin; // defaults to 'top-left' for web/design ergonomics
  defaultPageSize?: PageSizeName | PageDimensions;
  orientation?: PageOrientation;
  pages: PageDefinition[];
}

export interface TextRun {
  text: string;
  fontFamily: string;
  isBold: boolean;
  isItalic: boolean;
  fontSize: number;
}

export interface WrappedLine {
  text: string;
  width: number;
  runs: TextRun[];
}

export interface RenderContext {
  pageWidth: number;
  pageHeight: number;
  coordinateOrigin: CoordinateOrigin;
  scale?: number;
}
