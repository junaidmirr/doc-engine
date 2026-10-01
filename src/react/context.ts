import React, { createContext, useContext } from 'react';
import { DocumentDefinition, PageDefinition } from '../types';

export interface DocumentContextValue {
  document: DocumentDefinition;
  currentPageIndex: number;
  setCurrentPageIndex: (index: number) => void;
  scale: number;
  setScale: (scale: number) => void;
}

export const DocumentContext = createContext<DocumentContextValue | null>(null);

export function useDocumentContext(): DocumentContextValue {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error('useDocumentContext must be used within a <Document> component');
  }
  return ctx;
}
