import { DocumentElement, Margins, PageDefinition, TextElement } from '../types';
import { resolveMargins } from '../core/page';

export interface PaginateOptions {
  elements: DocumentElement[];
  pageWidth: number;
  pageHeight: number;
  margins?: Partial<Margins>;
  pageBackground?: string;
  headerElement?: DocumentElement | DocumentElement[];
  footerElement?: DocumentElement | DocumentElement[];
  repeatHeadersAndFooters?: boolean;
}

/**
 * Splits overflowing elements into multiple sequential pages based on page height, margins,
 * and page-break constraints (breakBefore, breakAfter, breakInside: 'avoid', keepWithNext).
 * Also handles dynamic page numbers: {pageNumber} and {totalPages}.
 */
export function paginateElements(options: PaginateOptions): PageDefinition[] {
  const {
    elements,
    pageWidth,
    pageHeight,
    margins: rawMargins,
    pageBackground = '#ffffff',
    headerElement,
    footerElement,
    repeatHeadersAndFooters = true,
  } = options;

  const margins = resolveMargins(rawMargins);
  const printableTop = margins.top;
  const printableBottom = pageHeight - margins.bottom;
  const printableHeight = printableBottom - printableTop;

  const rawPages: { index: number; elements: DocumentElement[] }[] = [];
  let currentPageIndex = 1;
  let currentElements: DocumentElement[] = [];
  let pageOffsetY = 0;

  const headers = headerElement ? (Array.isArray(headerElement) ? headerElement : [headerElement]) : [];
  const footers = footerElement ? (Array.isArray(footerElement) ? footerElement : [footerElement]) : [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const elY = el.y ?? 0;
    const elHeight = el.height ?? 20;

    // Check constraint: pageBreakBefore
    const forceBreakBefore = el.pageBreakBefore && currentElements.length > 0;

    // Check constraint: pageBreakInside 'avoid'
    const exceedsBottom = elY + elHeight - pageOffsetY > printableBottom && currentElements.length > 0;

    // Check constraint: keepWithNext (e.g. section headings)
    const isKeepWithNext = el.keepWithNext && i < elements.length - 1;
    const nextEl = isKeepWithNext ? elements[i + 1] : null;
    const nextExceedsBottom = nextEl ? (nextEl.y ?? 0) + (nextEl.height ?? 20) - pageOffsetY > printableBottom : false;

    if (forceBreakBefore || exceedsBottom || (isKeepWithNext && nextExceedsBottom && currentElements.length > 0)) {
      rawPages.push({
        index: currentPageIndex,
        elements: currentElements,
      });

      currentPageIndex++;
      pageOffsetY += printableHeight;
      currentElements = [];
    }

    // Shift Y position relative to its target page
    const shiftedElement: DocumentElement = {
      ...el,
      y: elY - pageOffsetY + printableTop,
      pageId: `page-${currentPageIndex}`,
    };

    currentElements.push(shiftedElement);

    // Check constraint: pageBreakAfter
    if (el.pageBreakAfter && i < elements.length - 1) {
      rawPages.push({
        index: currentPageIndex,
        elements: currentElements,
      });

      currentPageIndex++;
      pageOffsetY += printableHeight;
      currentElements = [];
    }
  }

  if (currentElements.length > 0) {
    rawPages.push({
      index: currentPageIndex,
      elements: currentElements,
    });
  }

  const totalPages = Math.max(1, rawPages.length);

  // Helper to deep replace {pageNumber} and {totalPages} in text elements
  function replacePagePlaceholders(element: DocumentElement, pNum: number, pTotal: number): DocumentElement {
    if (element.type === 'text') {
      const textEl = element as TextElement;
      const replacedText = textEl.text
        .replace(/\{pageNumber\}/g, String(pNum))
        .replace(/\{totalPages\}/g, String(pTotal));
      return { ...textEl, text: replacedText };
    }
    return { ...element };
  }

  // Construct Final Pages with Headers & Footers
  const finalPages: PageDefinition[] = [];

  for (let p = 0; p < totalPages; p++) {
    const pageNum = p + 1;
    const pageItems: DocumentElement[] = [];

    // Add repeating headers
    if (repeatHeadersAndFooters || pageNum === 1) {
      for (const h of headers) {
        const injected = replacePagePlaceholders(h, pageNum, totalPages);
        pageItems.push({
          ...injected,
          id: `${h.id}_p${pageNum}`,
          pageId: `page-${pageNum}`,
        });
      }
    }

    // Add page content elements
    const pageData = rawPages[p];
    if (pageData) {
      for (const el of pageData.elements) {
        const injected = replacePagePlaceholders(el, pageNum, totalPages);
        pageItems.push(injected);
      }
    }

    // Add repeating footers
    if (repeatHeadersAndFooters || pageNum === totalPages) {
      for (const f of footers) {
        const injected = replacePagePlaceholders(f, pageNum, totalPages);
        pageItems.push({
          ...injected,
          id: `${f.id}_p${pageNum}`,
          y: f.y ?? pageHeight - margins.bottom + 5,
          pageId: `page-${pageNum}`,
        });
      }
    }

    finalPages.push({
      id: `page-${pageNum}`,
      width: pageWidth,
      height: pageHeight,
      backgroundColor: pageBackground,
      margins,
      elements: pageItems,
    });
  }

  return finalPages;
}
