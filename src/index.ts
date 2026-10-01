// Types & AST
export * from './types';

// Core Document API
export { DocumentBuilder, createDocument } from './core/document';
export { DocumentEngine } from './core/engine';
export { DocumentHistory } from './core/history';
export {
  PAGE_SIZES,
  resolvePageDimensions,
  resolveMargins,
  DEFAULT_MARGINS,
} from './core/page';
export {
  parseColor,
  toCssRgba,
  isTransparent,
} from './core/colors';
export type { RGBAColor } from './core/colors';
export {
  toPdfCoordinates,
  toScreenCoordinates,
  getAlignmentOffsetX,
  getRotatedBounds,
} from './core/geometry';
export type { Point, Rect } from './core/geometry';

// Layout & Text Processing
export { measureTextWidth, findMaxFitIndex } from './layout/text-measure';
export { wrapText } from './layout/text-wrap';
export type { WrapTextOptions, WrappedLineResult } from './layout/text-wrap';
export { computeFlexLayout, normalizePadding } from './layout/auto-layout';
export type { LayoutBox, ComputedLayoutResult } from './layout/auto-layout';
export { computeTableLayout } from './layout/table-layout';
export type { ComputedTableResult } from './layout/table-layout';
export { computeGridLayout } from './layout/grid-layout';
export type { ComputedGridResult } from './layout/grid-layout';
export { paginateElements } from './layout/pagination';
export type { PaginateOptions } from './layout/pagination';

// Font Management
export { FontManager, defaultFontManager } from './fonts/font-manager';
export type { Standard14FontKey, FontDescriptor } from './fonts/font-manager';
export { getCharWidthInPoints, HELVETICA_WIDTHS, HELVETICA_BOLD_WIDTHS, COURIER_WIDTH } from './fonts/metrics';

// Renderers
export { PdfRenderer } from './renderers/pdf/pdf-renderer';
export type { RenderPdfOptions } from './renderers/pdf/pdf-renderer';
export { CanvasRenderer } from './renderers/canvas/canvas-renderer';
export type { CanvasRenderOptions } from './renderers/canvas/canvas-renderer';
export { SvgRenderer } from './renderers/svg/svg-renderer';
