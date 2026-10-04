/**
 * Deep clones an object while preserving Uint8Array buffers, Date objects,
 * RegExp, and nested arrays/objects.
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Fallback if structuredClone fails on DOM elements or functions
    }
  }

  if (obj instanceof Uint8Array) {
    return new Uint8Array(obj) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone) as unknown as T;
  }

  const clonedObj: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    clonedObj[key] = deepClone((obj as Record<string, unknown>)[key]);
  }

  return clonedObj as T;
}
