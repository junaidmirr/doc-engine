import { PDFDocument, PDFPage, degrees } from 'pdf-lib';
import { ImageElement } from '../../types';
import { toPdfCoordinates } from '../../core/geometry';

/**
 * Converts a base64 string or data URL to Uint8Array.
 */
function toUint8Array(src: string | Uint8Array): Uint8Array {
  if (src instanceof Uint8Array) return src;

  let base64 = src;
  if (src.includes(',')) {
    base64 = src.split(',')[1];
  }

  // Cross-environment base64 decode (Browser + Node)
  if (typeof atob === 'function') {
    const binStr = atob(base64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  } else if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  throw new Error('No base64 decoder available in current environment');
}

/**
 * Embeds and draws an image element onto a PDF page.
 */
export async function drawImageOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  element: ImageElement,
  pageHeight: number,
  coordinateOrigin: 'top-left' | 'bottom-left'
) {
  const {
    src,
    width = 100,
    height = 100,
    opacity = 1,
    rotation = 0,
  } = element;

  if (!src) return;

  try {
    const bytes = toUint8Array(src);

    // Detect image type by magic bytes
    // PNG: 89 50 4E 47 (0x89, 0x50, 0x4e, 0x47)
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

    const embeddedImage = isPng
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);

    const { x, y } = toPdfCoordinates(
      element.x,
      element.y,
      height,
      pageHeight,
      coordinateOrigin
    );

    page.drawImage(embeddedImage, {
      x,
      y,
      width,
      height,
      opacity,
      rotate: rotation ? degrees(rotation) : undefined,
    });
  } catch (err) {
    console.warn(`[doc-engine] Failed to embed image on page: ${err}`);
  }
}
