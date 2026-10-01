import {
  DocumentDefinition,
  PageDefinition,
  DocumentElement,
  TextElement,
  ShapeElement,
  ImageElement,
  ViewElement,
  TableElement,
  GridElement,
  PageSizeName,
  PageDimensions,
  PageOrientation,
  DocumentMetadata,
} from '../types';
import { resolvePageDimensions } from './page';
import { PdfRenderer } from '../renderers/pdf/pdf-renderer';

let elementIdCounter = 1;

function generateId(prefix: string): string {
  return `${prefix}_${elementIdCounter++}`;
}

/**
 * Fluent Builder for creating and modifying documents.
 */
export class DocumentBuilder {
  private def: DocumentDefinition;

  constructor(initial?: Partial<DocumentDefinition>) {
    const defaultDims = resolvePageDimensions(
      initial?.defaultPageSize ?? 'letter',
      initial?.orientation ?? 'portrait'
    );

    this.def = {
      id: initial?.id || generateId('doc'),
      metadata: initial?.metadata || {},
      coordinateOrigin: initial?.coordinateOrigin ?? 'top-left',
      defaultPageSize: initial?.defaultPageSize ?? 'letter',
      orientation: initial?.orientation ?? 'portrait',
      pages: initial?.pages && initial.pages.length > 0 ? initial.pages : [
        {
          id: 'page-1',
          width: defaultDims.width,
          height: defaultDims.height,
          backgroundColor: '#ffffff',
          elements: [],
        },
      ],
    };
  }

  public setMetadata(metadata: Partial<DocumentMetadata>): this {
    this.def.metadata = { ...this.def.metadata, ...metadata };
    return this;
  }

  public setPageSize(size: PageSizeName | PageDimensions, orientation: PageOrientation = 'portrait'): this {
    this.def.defaultPageSize = size;
    this.def.orientation = orientation;
    const dims = resolvePageDimensions(size, orientation);

    for (const page of this.def.pages) {
      if (!page.width) page.width = dims.width;
      if (!page.height) page.height = dims.height;
    }
    return this;
  }

  public addPage(options: Partial<PageDefinition> = {}): this {
    const dims = resolvePageDimensions(this.def.defaultPageSize, this.def.orientation);
    const newPage: PageDefinition = {
      id: options.id || `page-${this.def.pages.length + 1}`,
      width: options.width ?? dims.width,
      height: options.height ?? dims.height,
      backgroundColor: options.backgroundColor ?? '#ffffff',
      margins: options.margins,
      elements: options.elements ?? [],
    };
    this.def.pages.push(newPage);
    return this;
  }

  public getActivePage(): PageDefinition {
    return this.def.pages[this.def.pages.length - 1];
  }

  public addElement(element: DocumentElement, targetPageId?: string): this {
    const page = targetPageId
      ? this.def.pages.find((p) => p.id === targetPageId) || this.getActivePage()
      : this.getActivePage();

    element.pageId = page.id;
    element.zIndex = element.zIndex ?? page.elements.length;
    page.elements.push(element);
    return this;
  }

  public addText(options: Omit<Partial<TextElement>, 'type'> & { text: string }): this {
    const element: TextElement = {
      id: options.id || generateId('text'),
      type: 'text',
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 200,
      height: options.height ?? 30,
      text: options.text,
      fontSize: options.fontSize ?? 12,
      fontFamily: options.fontFamily ?? 'Helvetica',
      fontWeight: options.fontWeight ?? 'normal',
      fontStyle: options.fontStyle ?? 'normal',
      color: options.color ?? '#000000',
      align: options.align ?? 'left',
      lineHeight: options.lineHeight ?? 1.35,
      letterSpacing: options.letterSpacing ?? 0,
      underline: options.underline ?? false,
      strike: options.strike ?? false,
      wrap: options.wrap ?? true,
      maxLines: options.maxLines,
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public addShape(options: Omit<Partial<ShapeElement>, 'type'> & { shapeType: ShapeElement['shapeType'] }): this {
    const element: ShapeElement = {
      id: options.id || generateId('shape'),
      type: 'shape',
      shapeType: options.shapeType,
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 100,
      height: options.height ?? 100,
      fillColor: options.fillColor,
      strokeColor: options.strokeColor,
      strokeWidth: options.strokeWidth ?? 1,
      borderRadius: options.borderRadius,
      x2: options.x2,
      y2: options.y2,
      points: options.points,
      pathData: options.pathData,
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public addImage(options: Omit<Partial<ImageElement>, 'type'> & { src: string | Uint8Array }): this {
    const element: ImageElement = {
      id: options.id || generateId('img'),
      type: 'image',
      src: options.src,
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 100,
      height: options.height ?? 100,
      fit: options.fit ?? 'contain',
      maskShape: options.maskShape ?? 'none',
      borderRadius: options.borderRadius,
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public addView(options: Omit<Partial<ViewElement>, 'type'>): this {
    const element: ViewElement = {
      id: options.id || generateId('view'),
      type: 'view',
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 100,
      height: options.height ?? 100,
      backgroundColor: options.backgroundColor,
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      borderRadius: options.borderRadius,
      padding: options.padding,
      layout: options.layout ?? 'absolute',
      flexDirection: options.flexDirection ?? 'column',
      gap: options.gap ?? 0,
      justifyContent: options.justifyContent,
      alignItems: options.alignItems,
      children: options.children ?? [],
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public addTable(options: Omit<Partial<TableElement>, 'type'> & { rows: TableElement['rows'] }): this {
    const element: TableElement = {
      id: options.id || generateId('table'),
      type: 'table',
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 532,
      height: options.height ?? 100,
      columns: options.columns,
      header: options.header,
      rows: options.rows,
      repeatHeaderOnNewPage: options.repeatHeaderOnNewPage ?? true,
      borderWidth: options.borderWidth ?? 0.5,
      borderColor: options.borderColor ?? '#e2e8f0',
      cellPadding: options.cellPadding ?? 6,
      zebra: options.zebra ?? true,
      zebraColor: options.zebraColor ?? '#f8fafc',
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public addGrid(options: Omit<Partial<GridElement>, 'type'> & { children: DocumentElement[] }): this {
    const element: GridElement = {
      id: options.id || generateId('grid'),
      type: 'grid',
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width ?? 532,
      height: options.height ?? 100,
      columns: options.columns ?? 2,
      gap: options.gap ?? 12,
      children: options.children,
      zIndex: options.zIndex,
      opacity: options.opacity ?? 1,
      rotation: options.rotation ?? 0,
    };
    return this.addElement(element, options.pageId);
  }

  public toDefinition(): DocumentDefinition {
    return JSON.parse(JSON.stringify(this.def));
  }

  public toJson(): string {
    return JSON.stringify(this.def, null, 2);
  }

  public static fromJson(json: string): DocumentDefinition {
    return JSON.parse(json) as DocumentDefinition;
  }

  public async renderToPdf(): Promise<Uint8Array> {
    return await PdfRenderer.renderToBytes(this.def);
  }

  public async renderToBlob(): Promise<Blob> {
    return await PdfRenderer.renderToBlob(this.def);
  }
}

/**
 * Creates a new document builder instance.
 */
export function createDocument(options?: Partial<DocumentDefinition>): DocumentBuilder {
  return new DocumentBuilder(options);
}
