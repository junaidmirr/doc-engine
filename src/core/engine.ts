import {
  DocumentDefinition,
  DocumentElement,
  PageDefinition,
  PageSizeName,
  PageDimensions,
  PageOrientation,
} from '../types';
import { resolvePageDimensions } from './page';
import { PdfRenderer } from '../renderers/pdf/pdf-renderer';
import { CanvasRenderer } from '../renderers/canvas/canvas-renderer';
import { DocumentHistory } from './history';
import { deepClone } from '../utils/clone';

export class DocumentEngine {
  private doc: DocumentDefinition;
  private history: DocumentHistory;

  constructor(initialDocument?: Partial<DocumentDefinition>) {
    const defaultDims = resolvePageDimensions(
      initialDocument?.defaultPageSize ?? 'letter',
      initialDocument?.orientation ?? 'portrait'
    );

    this.doc = {
      id: initialDocument?.id || `doc_${Date.now()}`,
      metadata: initialDocument?.metadata || {},
      coordinateOrigin: initialDocument?.coordinateOrigin ?? 'top-left',
      defaultPageSize: initialDocument?.defaultPageSize ?? 'letter',
      orientation: initialDocument?.orientation ?? 'portrait',
      pages: initialDocument?.pages && initialDocument.pages.length > 0 ? initialDocument.pages : [
        {
          id: 'page-1',
          width: defaultDims.width,
          height: defaultDims.height,
          backgroundColor: '#ffffff',
          elements: [],
        },
      ],
    };

    this.history = new DocumentHistory();
  }

  public getDocument(): DocumentDefinition {
    return this.doc;
  }

  public setDocument(doc: DocumentDefinition) {
    this.history.push(this.doc);
    this.doc = doc;
  }

  // -------------------------------------------------------------
  // Pages API
  // -------------------------------------------------------------

  public getPages(): PageDefinition[] {
    return this.doc.pages;
  }

  public getPage(pageId: string): PageDefinition | undefined {
    return this.doc.pages.find((p) => p.id === pageId);
  }

  public addPage(options: Partial<PageDefinition> = {}): PageDefinition {
    this.history.push(this.doc);
    const dims = resolvePageDimensions(this.doc.defaultPageSize, this.doc.orientation);
    const newPage: PageDefinition = {
      id: options.id || `page-${this.doc.pages.length + 1}`,
      width: options.width ?? dims.width,
      height: options.height ?? dims.height,
      backgroundColor: options.backgroundColor ?? '#ffffff',
      margins: options.margins,
      elements: options.elements ?? [],
    };
    this.doc.pages.push(newPage);
    return newPage;
  }

  public removePage(pageId: string): boolean {
    if (this.doc.pages.length <= 1) return false;
    this.history.push(this.doc);
    this.doc.pages = this.doc.pages.filter((p) => p.id !== pageId);
    return true;
  }

  // -------------------------------------------------------------
  // Elements CRUD API
  // -------------------------------------------------------------

  public addElement(element: DocumentElement, pageId?: string): string {
    this.history.push(this.doc);
    const targetPage = pageId
      ? this.doc.pages.find((p) => p.id === pageId) || this.doc.pages[0]
      : this.doc.pages[0];

    element.pageId = targetPage.id;
    element.zIndex = element.zIndex ?? targetPage.elements.length;
    targetPage.elements.push(element);
    return element.id;
  }

  public updateElement(elementId: string, updates: Partial<DocumentElement>): boolean {
    for (const page of this.doc.pages) {
      const idx = page.elements.findIndex((e) => e.id === elementId);
      if (idx !== -1) {
        this.history.push(this.doc);
        page.elements[idx] = { ...page.elements[idx], ...updates } as DocumentElement;
        return true;
      }
    }
    return false;
  }

  public deleteElement(elementId: string): boolean {
    for (const page of this.doc.pages) {
      const idx = page.elements.findIndex((e) => e.id === elementId);
      if (idx !== -1) {
        this.history.push(this.doc);
        page.elements.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  public duplicateElement(elementId: string): string | null {
    for (const page of this.doc.pages) {
      const el = page.elements.find((e) => e.id === elementId);
      if (el) {
        this.history.push(this.doc);
        const newId = `${el.id}_copy_${Date.now()}`;
        const copy: DocumentElement = {
          ...deepClone(el),
          id: newId,
          x: (el.x || 0) + 15,
          y: (el.y || 0) + 15,
          zIndex: page.elements.length,
        };
        page.elements.push(copy);
        return newId;
      }
    }
    return null;
  }

  // -------------------------------------------------------------
  // Undo / Redo
  // -------------------------------------------------------------

  public undo(): boolean {
    const prevState = this.history.undo(this.doc);
    if (prevState) {
      this.doc = prevState;
      return true;
    }
    return false;
  }

  public redo(): boolean {
    const nextState = this.history.redo(this.doc);
    if (nextState) {
      this.doc = nextState;
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // Rendering & Export
  // -------------------------------------------------------------

  public async renderToPdf(): Promise<Uint8Array> {
    return await PdfRenderer.renderToBytes(this.doc);
  }

  public async renderToBlob(): Promise<Blob> {
    return await PdfRenderer.renderToBlob(this.doc);
  }

  public async renderToDataUrl(): Promise<string> {
    return await PdfRenderer.renderToDataUrl(this.doc);
  }

  public renderToCanvas(
    canvas: HTMLCanvasElement,
    pageIndex = 0,
    scale = 1,
    selectedElementId?: string
  ) {
    const page = this.doc.pages[pageIndex] || this.doc.pages[0];
    if (!page) return;
    CanvasRenderer.renderPage(canvas, page, { scale, selectedElementId });
  }

  public async downloadPdf(fileName = 'document.pdf') {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('downloadPdf is only available in browser environments');
    }
    const blob = await this.renderToBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public toJson(): string {
    return JSON.stringify(this.doc, null, 2);
  }

  public loadJson(json: string) {
    this.history.push(this.doc);
    this.doc = JSON.parse(json);
  }
}
