import { DocumentDefinition } from '../types';

export class DocumentHistory {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxDepth: number;

  constructor(maxDepth = 50) {
    this.maxDepth = maxDepth;
  }

  public push(state: DocumentDefinition) {
    this.undoStack.push(JSON.stringify(state));
    this.redoStack = [];
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public undo(currentState: DocumentDefinition): DocumentDefinition | null {
    if (!this.canUndo()) return null;

    this.redoStack.push(JSON.stringify(currentState));
    const previousJson = this.undoStack.pop()!;
    return JSON.parse(previousJson);
  }

  public redo(currentState: DocumentDefinition): DocumentDefinition | null {
    if (!this.canRedo()) return null;

    this.undoStack.push(JSON.stringify(currentState));
    const nextJson = this.redoStack.pop()!;
    return JSON.parse(nextJson);
  }

  public clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
