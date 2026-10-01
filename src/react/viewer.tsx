import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DocumentDefinition } from '../types';
import { CanvasRenderer } from '../renderers/canvas/canvas-renderer';
import { PdfRenderer } from '../renderers/pdf/pdf-renderer';
import { extractDocumentDefinition } from './components';

export interface DocumentViewerProps {
  document: DocumentDefinition | React.ReactElement;
  initialScale?: number;
  showToolbar?: boolean;
  className?: string;
  onElementClick?: (elementId: string) => void;
  selectedElementId?: string;
}

/**
 * Interactive React viewer for instantaneous client-side document preview and export.
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  initialScale = 1.0,
  showToolbar = true,
  className = '',
  onElementClick,
  selectedElementId,
}) => {
  const docDef: DocumentDefinition = useMemo(() => {
    return React.isValidElement(document)
      ? extractDocumentDefinition(document)
      : (document as DocumentDefinition);
  }, [document]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [scale, setScale] = useState<number>(initialScale);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const totalPages = docDef.pages.length || 1;
  const activePage = docDef.pages[currentPageIndex] || docDef.pages[0];

  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !activePage) return;
    CanvasRenderer.renderPage(canvasRef.current, activePage, {
      scale,
      selectedElementId,
    });
  }, [activePage, scale, selectedElementId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const bytes = await PdfRenderer.renderToBytes(docDef);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${docDef.metadata?.title || 'document'}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onElementClick || !canvasRef.current || !activePage) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Hit test elements from top z-index downwards
    const sorted = [...activePage.elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
    for (const el of sorted) {
      if (
        clickX >= el.x &&
        clickX <= el.x + el.width &&
        clickY >= el.y &&
        clickY <= el.y + el.height
      ) {
        onElementClick(el.id);
        return;
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#f1f5f9',
        padding: '16px',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      className={className}
    >
      {showToolbar && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '800px',
            marginBottom: '12px',
            padding: '8px 12px',
            background: '#ffffff',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontSize: '13px',
            color: '#334155',
          }}
        >
          {/* Page Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              disabled={currentPageIndex === 0}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: currentPageIndex === 0 ? '#f8fafc' : '#ffffff',
                cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Prev
            </button>
            <span>
              Page {currentPageIndex + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPageIndex >= totalPages - 1}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: currentPageIndex >= totalPages - 1 ? '#f8fafc' : '#ffffff',
                cursor: currentPageIndex >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>

          {/* Zoom Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(1))))}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              -
            </button>
            <span style={{ minWidth: '45px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.1).toFixed(1))))}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              +
            </button>
            <button
              onClick={() => setScale(1.0)}
              style={{
                padding: '4px 8px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            style={{
              padding: '6px 12px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 500,
              cursor: isExporting ? 'wait' : 'pointer',
            }}
          >
            {isExporting ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        style={{
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          lineHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            display: 'block',
            cursor: onElementClick ? 'pointer' : 'default',
          }}
        />
      </div>
    </div>
  );
};
