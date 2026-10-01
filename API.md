# API Reference: doc-engine

## Core Engine

### `createDocument(options?: Partial<DocumentDefinition>): DocumentBuilder`
Initializes a new fluent document builder.

#### `DocumentBuilder` Methods
- `.setMetadata(metadata: Partial<DocumentMetadata>): this`
- `.setPageSize(size: PageSizeName | PageDimensions, orientation?: PageOrientation): this`
- `.addPage(options?: Partial<PageDefinition>): this`
- `.addText(options: Partial<TextElement>): this`
- `.addShape(options: Partial<ShapeElement>): this`
- `.addImage(options: Partial<ImageElement>): this`
- `.addView(options: Partial<ViewElement>): this`
- `.toDefinition(): DocumentDefinition`
- `.toJson(): string`
- `.renderToPdf(): Promise<Uint8Array>`
- `.renderToBlob(): Promise<Blob>`

---

### `DocumentEngine`
Stateful engine manager with atomic undo/redo history.

#### Methods
- `getDocument(): DocumentDefinition`
- `setDocument(doc: DocumentDefinition): void`
- `addPage(options?: Partial<PageDefinition>): PageDefinition`
- `removePage(pageId: string): boolean`
- `addElement(element: DocumentElement, pageId?: string): string`
- `updateElement(elementId: string, updates: Partial<DocumentElement>): boolean`
- `deleteElement(elementId: string): boolean`
- `duplicateElement(elementId: string): string | null`
- `undo(): boolean`
- `redo(): boolean`
- `renderToPdf(): Promise<Uint8Array>`
- `renderToBlob(): Promise<Blob>`
- `renderToDataUrl(): Promise<string>`
- `renderToCanvas(canvas: HTMLCanvasElement, pageIndex?: number, scale?: number): void`
- `downloadPdf(filename?: string): Promise<void>`

---

## Renderers

### `PdfRenderer`
- `PdfRenderer.renderToBytes(doc: DocumentDefinition, options?: RenderPdfOptions): Promise<Uint8Array>`
- `PdfRenderer.renderToBlob(doc: DocumentDefinition): Promise<Blob>`
- `PdfRenderer.renderToDataUrl(doc: DocumentDefinition): Promise<string>`

### `CanvasRenderer`
- `CanvasRenderer.renderPage(canvas: HTMLCanvasElement, page: PageDefinition, options?: CanvasRenderOptions): void`

### `SvgRenderer`
- `SvgRenderer.renderPageToSvg(page: PageDefinition): string`

---

## React Package (`doc-engine/react`)

### Components
- `<Document defaultPageSize="letter" orientation="portrait" metadata={...}>`
- `<Page width={...} height={...} backgroundColor={...}>`
- `<View layout="flex" flexDirection="row" gap={12} padding={16} ...>`
- `<Text fontSize={14} fontWeight="bold" color="#1e293b">`
- `<Shape shapeType="rectangle" fillColor="#38bdf8" ...>`
- `<Line x={0} y={0} x2={100} y2={0} strokeColor="#cbd5e1">`
- `<Image src="..." width={80} height={80} fit="cover">`
- `<DocumentViewer document={...} initialScale={1.0} showToolbar={true}>`

### Hooks
- `usePDF(document: DocumentDefinition | null): UsePDFResult`
- `useDocument(initialDocument?: Partial<DocumentDefinition>): UseDocumentResult`
