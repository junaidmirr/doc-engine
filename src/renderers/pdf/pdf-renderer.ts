import { PDFDocument, StandardFonts, PDFFont, rgb } from 'pdf-lib';
import {
  DocumentDefinition,
  DocumentElement,
  TextElement,
  ShapeElement,
  ImageElement,
  ViewElement,
  TableElement,
  GridElement,
} from '../../types';
import { resolvePageDimensions } from '../../core/page';
import { parseColor, isTransparent } from '../../core/colors';
import { defaultFontManager, Standard14FontKey } from '../../fonts/font-manager';
import { drawTextOnPage } from './text-drawer';
import { drawShapeOnPage } from './shape-drawer';
import { drawImageOnPage } from './image-drawer';
import { computeFlexLayout } from '../../layout/auto-layout';
import { computeTableLayout } from '../../layout/table-layout';
import { computeGridLayout } from '../../layout/grid-layout';

export interface RenderPdfOptions {
  compress?: boolean;
}

/**
 * Main PDF renderer producing native, professional vector PDFs from a DocumentDefinition AST.
 */
export class PdfRenderer {
  /**
   * Renders a document AST into raw PDF bytes (Uint8Array).
   */
  public static async renderToBytes(
    docDef: DocumentDefinition,
    options: RenderPdfOptions = {}
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Set Document Metadata
    if (docDef.metadata) {
      if (docDef.metadata.title) pdfDoc.setTitle(docDef.metadata.title);
      if (docDef.metadata.author) pdfDoc.setAuthor(docDef.metadata.author);
      if (docDef.metadata.subject) pdfDoc.setSubject(docDef.metadata.subject);
      if (docDef.metadata.keywords) pdfDoc.setKeywords(docDef.metadata.keywords);
      if (docDef.metadata.creator) pdfDoc.setCreator(docDef.metadata.creator);
      if (docDef.metadata.producer) pdfDoc.setProducer(docDef.metadata.producer);
      if (docDef.metadata.creationDate) pdfDoc.setCreationDate(docDef.metadata.creationDate);
      if (docDef.metadata.modificationDate) pdfDoc.setModificationDate(docDef.metadata.modificationDate);
    }

    // Cache embedded fonts across document
    const fontCache = new Map<Standard14FontKey, PDFFont>();

    async function getFont(key: Standard14FontKey): Promise<PDFFont> {
      if (fontCache.has(key)) {
        return fontCache.get(key)!;
      }
      let font: PDFFont;
      switch (key) {
        case 'Helvetica-Bold':
          font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          break;
        case 'Helvetica-Oblique':
          font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
          break;
        case 'Helvetica-BoldOblique':
          font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
          break;
        case 'Times-Roman':
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
          break;
        case 'Times-Bold':
          font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
          break;
        case 'Times-Italic':
          font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
          break;
        case 'Times-BoldItalic':
          font = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
          break;
        case 'Courier':
          font = await pdfDoc.embedFont(StandardFonts.Courier);
          break;
        case 'Courier-Bold':
          font = await pdfDoc.embedFont(StandardFonts.CourierBold);
          break;
        case 'Courier-Oblique':
          font = await pdfDoc.embedFont(StandardFonts.CourierOblique);
          break;
        case 'Courier-BoldOblique':
          font = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
          break;
        case 'Helvetica':
        default:
          font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          break;
      }
      fontCache.set(key, font);
      return font;
    }

    const defaultDims = resolvePageDimensions(docDef.defaultPageSize, docDef.orientation);
    const coordinateOrigin = docDef.coordinateOrigin ?? 'top-left';

    // Render Each Page
    for (const pageDef of docDef.pages) {
      const pageWidth = pageDef.width || defaultDims.width;
      const pageHeight = pageDef.height || defaultDims.height;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Page Background
      if (pageDef.backgroundColor && !isTransparent(pageDef.backgroundColor)) {
        const bg = parseColor(pageDef.backgroundColor);
        page.drawRectangle({
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
          color: rgb(bg.r, bg.g, bg.b),
          opacity: bg.a,
        });
      }

      // Flatten Views and Sort Elements by Z-Index
      const flattenedElements = PdfRenderer.flattenElements(pageDef.elements);
      flattenedElements.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

      // Draw Elements
      for (const el of flattenedElements) {
        if (el.type === 'text') {
          const textEl = el as TextElement;
          const fontKey = defaultFontManager.resolveFontName(
            textEl.fontFamily,
            textEl.fontWeight,
            textEl.fontStyle
          );
          const font = await getFont(fontKey);
          drawTextOnPage(page, textEl, font, pageHeight, coordinateOrigin);
        } else if (el.type === 'shape') {
          drawShapeOnPage(page, el as ShapeElement, pageHeight, coordinateOrigin);
        } else if (el.type === 'image') {
          await drawImageOnPage(pdfDoc, page, el as ImageElement, pageHeight, coordinateOrigin);
        }
      }
    }

    return await pdfDoc.save({ useObjectStreams: options.compress !== false });
  }

  /**
   * Renders document AST to a Blob (ideal for browser downloads / previews).
   */
  public static async renderToBlob(docDef: DocumentDefinition): Promise<Blob> {
    const bytes = await PdfRenderer.renderToBytes(docDef);
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Renders document AST to a Data URL (ideal for iframe previews).
   */
  public static async renderToDataUrl(docDef: DocumentDefinition): Promise<string> {
    const blob = await PdfRenderer.renderToBlob(docDef);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Recursively resolves containers and views into flat positioned elements.
   */
  private static flattenElements(elements: DocumentElement[]): DocumentElement[] {
    const flattened: DocumentElement[] = [];

    for (const el of elements) {
      if (el.type === 'view') {
        const view = el as ViewElement;

        // Render view background as a rectangle shape if styled
        if (view.backgroundColor || (view.borderColor && view.borderWidth)) {
          const shape: ShapeElement = {
            id: `${view.id}_bg`,
            type: 'shape',
            shapeType: 'rectangle',
            x: view.x,
            y: view.y,
            width: view.width,
            height: view.height,
            fillColor: view.backgroundColor,
            strokeColor: view.borderColor,
            strokeWidth: view.borderWidth ?? 0,
            borderRadius: view.borderRadius ?? 0,
            zIndex: view.zIndex,
            opacity: view.opacity,
          };
          flattened.push(shape);
        }

        if (view.layout === 'flex') {
          const computed = computeFlexLayout(view);
          for (const box of computed.boxes) {
            flattened.push({
              ...box.element,
              x: box.x,
              y: box.y,
              width: box.width,
              height: box.height,
            });
          }
        } else if (view.children) {
          // Absolute layout with offset
          for (const child of view.children) {
            flattened.push({
              ...child,
              x: (view.x || 0) + (child.x || 0),
              y: (view.y || 0) + (child.y || 0),
            });
          }
        }
      } else if (el.type === 'table') {
        const computed = computeTableLayout(el as TableElement);
        flattened.push(...computed.elements);
      } else if (el.type === 'grid') {
        const computed = computeGridLayout(el as GridElement);
        flattened.push(...computed.elements);
      } else {
        flattened.push(el);
      }
    }

    return flattened;
  }
}
