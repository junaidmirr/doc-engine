import { describe, it, expect } from 'vitest';
import { createDocument, DocumentBuilder } from '../src/core/document';
import { DocumentEngine } from '../src/core/engine';

describe('Document Builder & JSON AST', () => {
  it('should build a document fluently', () => {
    const doc = createDocument({
      defaultPageSize: 'a4',
      metadata: { title: 'Test Document', author: 'Test Author' },
    });

    doc.addText({
      text: 'Hello World',
      x: 50,
      y: 50,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#1e293b',
    });

    doc.addShape({
      shapeType: 'rectangle',
      x: 50,
      y: 80,
      width: 200,
      height: 40,
      fillColor: '#38bdf8',
    });

    const def = doc.toDefinition();
    expect(def.pages.length).toBe(1);
    expect(def.pages[0].elements.length).toBe(2);
    expect(def.metadata?.title).toBe('Test Document');
  });

  it('should serialize to JSON and deserialize back losslessly', () => {
    const doc = createDocument();
    doc.addText({ text: 'AST Serialization Test', x: 20, y: 30 });
    doc.addShape({ shapeType: 'circle', x: 100, y: 100, width: 60, height: 60 });

    const json = doc.toJson();
    const parsed = DocumentBuilder.fromJson(json);

    expect(parsed.pages[0].elements.length).toBe(2);
    expect(parsed.pages[0].elements[0].type).toBe('text');
    expect(parsed.pages[0].elements[1].type).toBe('shape');
  });
});

describe('Document Engine & Undo/Redo', () => {
  it('should manage element lifecycle and undo/redo', () => {
    const engine = new DocumentEngine();

    const id = engine.addElement({
      id: 'txt_1',
      type: 'text',
      x: 10,
      y: 10,
      width: 100,
      height: 20,
      text: 'Initial Text',
      fontSize: 12,
    });

    expect(engine.getDocument().pages[0].elements.length).toBe(1);

    // Update element
    engine.updateElement(id, { text: 'Updated Text' });
    const updated = engine.getDocument().pages[0].elements[0] as any;
    expect(updated.text).toBe('Updated Text');

    // Undo update
    expect(engine.undo()).toBe(true);
    const undone = engine.getDocument().pages[0].elements[0] as any;
    expect(undone.text).toBe('Initial Text');

    // Redo update
    expect(engine.redo()).toBe(true);
    const redone = engine.getDocument().pages[0].elements[0] as any;
    expect(redone.text).toBe('Updated Text');

    // Delete element
    expect(engine.deleteElement(id)).toBe(true);
    expect(engine.getDocument().pages[0].elements.length).toBe(0);

    // Undo delete
    expect(engine.undo()).toBe(true);
    expect(engine.getDocument().pages[0].elements.length).toBe(1);
  });
});
