import React, { ReactNode } from 'react';
import {
  DocumentDefinition,
  PageDefinition,
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

export interface DocumentProps {
  id?: string;
  metadata?: DocumentMetadata;
  defaultPageSize?: PageSizeName | PageDimensions;
  orientation?: PageOrientation;
  children?: ReactNode;
}

export interface PageProps {
  id?: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  children?: ReactNode;
}

export interface ViewProps extends Omit<Partial<ViewElement>, 'type' | 'children'> {
  children?: ReactNode;
}

export interface TextProps extends Omit<Partial<TextElement>, 'type' | 'text'> {
  children?: string | number | ReactNode;
}

export interface ShapeProps extends Omit<Partial<ShapeElement>, 'type'> {
  shapeType: ShapeElement['shapeType'];
}

export interface LineProps {
  x: number;
  y: number;
  x2: number;
  y2: number;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface ImageProps extends Omit<Partial<ImageElement>, 'type'> {
  src: string | Uint8Array;
}

function isType(type: any, target: any, name: string): boolean {
  return type === target || type?.displayName === name || type?.name === name;
}

/**
 * Helper to extract DocumentDefinition AST from React JSX tree.
 */
export function extractDocumentDefinition(element: React.ReactElement): DocumentDefinition {
  if (!isType(element.type, Document, 'Document')) {
    throw new Error('Root element must be a <Document>');
  }

  const props: DocumentProps = element.props;
  const pages: PageDefinition[] = [];

  React.Children.forEach(props.children, (child, pageIdx) => {
    if (React.isValidElement(child) && isType(child.type, Page, 'Page')) {
      const pageProps: PageProps = child.props;
      const elements: any[] = [];

      React.Children.forEach(pageProps.children, (elChild, elIdx) => {
        const parsed = parseChildElement(elChild, `p${pageIdx + 1}_el${elIdx + 1}`);
        if (parsed) elements.push(parsed);
      });

      pages.push({
        id: pageProps.id || `page-${pageIdx + 1}`,
        width: pageProps.width,
        height: pageProps.height,
        backgroundColor: pageProps.backgroundColor,
        elements,
      });
    }
  });

  return {
    id: props.id || 'doc',
    metadata: props.metadata,
    defaultPageSize: props.defaultPageSize ?? 'letter',
    orientation: props.orientation ?? 'portrait',
    pages,
  };
}

function parseChildElement(child: any, defaultId: string): any {
  if (!React.isValidElement(child)) return null;

  if (isType(child.type, Text, 'Text')) {
    const p = child.props as TextProps;
    const textContent = typeof p.children === 'string' || typeof p.children === 'number'
      ? String(p.children)
      : '';
    return {
      id: p.id || defaultId,
      type: 'text',
      x: p.x ?? 0,
      y: p.y ?? 0,
      width: p.width ?? 200,
      height: p.height ?? 20,
      text: textContent,
      fontSize: p.fontSize ?? 12,
      fontFamily: p.fontFamily ?? 'Helvetica',
      fontWeight: p.fontWeight ?? 'normal',
      fontStyle: p.fontStyle ?? 'normal',
      color: p.color ?? '#000000',
      align: p.align ?? 'left',
      lineHeight: p.lineHeight ?? 1.35,
      letterSpacing: p.letterSpacing ?? 0,
      underline: p.underline ?? false,
      strike: p.strike ?? false,
      wrap: p.wrap ?? true,
      maxLines: p.maxLines,
      opacity: p.opacity ?? 1,
      rotation: p.rotation ?? 0,
    } as TextElement;
  }

  if (isType(child.type, Shape, 'Shape')) {
    const p = child.props as ShapeProps;
    return {
      id: p.id || defaultId,
      type: 'shape',
      shapeType: p.shapeType,
      x: p.x ?? 0,
      y: p.y ?? 0,
      width: p.width ?? 100,
      height: p.height ?? 100,
      fillColor: p.fillColor,
      strokeColor: p.strokeColor,
      strokeWidth: p.strokeWidth ?? 1,
      borderRadius: p.borderRadius,
      x2: p.x2,
      y2: p.y2,
      points: p.points,
      pathData: p.pathData,
      opacity: p.opacity ?? 1,
      rotation: p.rotation ?? 0,
    } as ShapeElement;
  }

  if (isType(child.type, Line, 'Line')) {
    const p = child.props as LineProps;
    return {
      id: defaultId,
      type: 'shape',
      shapeType: 'line',
      x: p.x,
      y: p.y,
      x2: p.x2,
      y2: p.y2,
      strokeColor: p.strokeColor ?? '#000000',
      strokeWidth: p.strokeWidth ?? 1,
      opacity: p.opacity ?? 1,
    } as ShapeElement;
  }

  if (isType(child.type, Image, 'Image')) {
    const p = child.props as ImageProps;
    return {
      id: p.id || defaultId,
      type: 'image',
      src: p.src,
      x: p.x ?? 0,
      y: p.y ?? 0,
      width: p.width ?? 100,
      height: p.height ?? 100,
      fit: p.fit ?? 'contain',
      maskShape: p.maskShape ?? 'none',
      borderRadius: p.borderRadius,
      opacity: p.opacity ?? 1,
      rotation: p.rotation ?? 0,
    } as ImageElement;
  }

  if (isType(child.type, View, 'View')) {
    const p = child.props as ViewProps;
    const children: any[] = [];
    React.Children.forEach(p.children, (vc, idx) => {
      const parsed = parseChildElement(vc, `${defaultId}_c${idx}`);
      if (parsed) children.push(parsed);
    });

    return {
      id: p.id || defaultId,
      type: 'view',
      x: p.x ?? 0,
      y: p.y ?? 0,
      width: p.width ?? 100,
      height: p.height ?? 100,
      backgroundColor: p.backgroundColor,
      borderColor: p.borderColor,
      borderWidth: p.borderWidth,
      borderRadius: p.borderRadius,
      padding: p.padding,
      layout: p.layout ?? 'absolute',
      flexDirection: p.flexDirection ?? 'column',
      gap: p.gap ?? 0,
      justifyContent: p.justifyContent,
      alignItems: p.alignItems,
      children,
      opacity: p.opacity ?? 1,
      rotation: p.rotation ?? 0,
    } as ViewElement;
  }

  return null;
}

// Declarative JSX Components
export const Document: React.FC<DocumentProps> = ({ children }) => <>{children}</>;
Document.displayName = 'Document';

export const Page: React.FC<PageProps> = ({ children }) => <>{children}</>;
Page.displayName = 'Page';

export const View: React.FC<ViewProps> = ({ children }) => <>{children}</>;
View.displayName = 'View';

export const Text: React.FC<TextProps> = ({ children }) => <>{children}</>;
Text.displayName = 'Text';

export const Shape: React.FC<ShapeProps> = () => null;
Shape.displayName = 'Shape';

export const Line: React.FC<LineProps> = () => null;
Line.displayName = 'Line';

export const Image: React.FC<ImageProps> = () => null;
Image.displayName = 'Image';

export interface TableComponentProps extends Omit<Partial<TableElement>, 'type'> {
  children?: ReactNode;
}
export const Table: React.FC<TableComponentProps> = ({ children }) => <>{children}</>;
Table.displayName = 'Table';

export interface GridComponentProps extends Omit<Partial<GridElement>, 'type' | 'children'> {
  children?: ReactNode;
}
export const Grid: React.FC<GridComponentProps> = ({ children }) => <>{children}</>;
Grid.displayName = 'Grid';

export interface ColumnsComponentProps {
  count?: number;
  gap?: number;
  children?: ReactNode;
}
export const Columns: React.FC<ColumnsComponentProps> = ({ children }) => <>{children}</>;
Columns.displayName = 'Columns';

export const Column: React.FC<{ children?: ReactNode }> = ({ children }) => <>{children}</>;
Column.displayName = 'Column';
