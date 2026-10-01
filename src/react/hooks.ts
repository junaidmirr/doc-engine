import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DocumentDefinition } from '../types';
import { PdfRenderer } from '../renderers/pdf/pdf-renderer';
import { DocumentEngine } from '../core/engine';
import { extractDocumentDefinition } from './components';

export interface UsePDFResult {
  pdfBytes: Uint8Array | null;
  blob: Blob | null;
  dataUrl: string | null;
  loading: boolean;
  error: Error | null;
  download: (filename?: string) => void;
  refresh: () => Promise<void>;
}

/**
 * React hook that compiles a DocumentDefinition AST or React JSX document tree into PDF bytes, Blob, and data URL.
 */
export function usePDF(
  document: DocumentDefinition | React.ReactElement | null
): UsePDFResult {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Extract AST if React Element
  const docDef: DocumentDefinition | null = useMemo(() => {
    if (!document) return null;
    if (React.isValidElement(document)) {
      return extractDocumentDefinition(document);
    }
    return document as DocumentDefinition;
  }, [document]);

  // Serialize to prevent infinite re-render loops when JSX element is created inline
  const serialized = useMemo(() => (docDef ? JSON.stringify(docDef) : null), [docDef]);
  const prevSerializedRef = useRef<string | null>(null);
  const activeUrlRef = useRef<string | null>(null);

  const generate = useCallback(async () => {
    if (!docDef) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bytes = await PdfRenderer.renderToBytes(docDef);
      const pdfBlob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);

      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
      activeUrlRef.current = url;

      setPdfBytes(bytes);
      setBlob(pdfBlob);
      setDataUrl(url);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [docDef]);

  useEffect(() => {
    if (serialized !== prevSerializedRef.current) {
      prevSerializedRef.current = serialized;
      generate();
    }
  }, [serialized, generate]);

  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  const download = useCallback(
    (filename = 'document.pdf') => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [blob]
  );

  return {
    pdfBytes,
    blob,
    dataUrl,
    loading,
    error,
    download,
    refresh: generate,
  };
}

/**
 * React hook for managing an interactive DocumentEngine instance with reactive state.
 */
export function useDocument(initialDocument?: Partial<DocumentDefinition>) {
  const engine = useMemo(() => new DocumentEngine(initialDocument), []);
  const [doc, setDocState] = useState<DocumentDefinition>(engine.getDocument());

  const update = useCallback(() => {
    setDocState({ ...engine.getDocument() });
  }, [engine]);

  const addElement = useCallback(
    (element: any, pageId?: string) => {
      const id = engine.addElement(element, pageId);
      update();
      return id;
    },
    [engine, update]
  );

  const updateElement = useCallback(
    (elementId: string, updates: any) => {
      const res = engine.updateElement(elementId, updates);
      if (res) update();
      return res;
    },
    [engine, update]
  );

  const deleteElement = useCallback(
    (elementId: string) => {
      const res = engine.deleteElement(elementId);
      if (res) update();
      return res;
    },
    [engine, update]
  );

  const undo = useCallback(() => {
    const res = engine.undo();
    if (res) update();
    return res;
  }, [engine, update]);

  const redo = useCallback(() => {
    const res = engine.redo();
    if (res) update();
    return res;
  }, [engine, update]);

  return {
    engine,
    document: doc,
    addElement,
    updateElement,
    deleteElement,
    undo,
    redo,
    downloadPdf: (filename?: string) => engine.downloadPdf(filename),
  };
}
