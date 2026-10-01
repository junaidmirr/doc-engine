export interface RGBAColor {
  r: number; // 0..1
  g: number; // 0..1
  b: number; // 0..1
  a: number; // 0..1
}

const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  transparent: 'rgba(0,0,0,0)',
  none: 'rgba(0,0,0,0)',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#f59e0b',
  gray: '#6b7280',
  grey: '#6b7280',
  slate: '#475569',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  emerald: '#059669',
  teal: '#0d9488',
  cyan: '#06b6d4',
  sky: '#0284c7',
  rose: '#f43f5e',
  amber: '#d97706',
  orange: '#f97316',
};

/**
 * Parses any color format (Hex, RGB, RGBA, named colors) into normalized 0..1 RGBA values.
 */
export function parseColor(colorInput?: string | null): RGBAColor {
  if (!colorInput) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }

  const str = colorInput.trim().toLowerCase();

  if (NAMED_COLORS[str]) {
    return parseColor(NAMED_COLORS[str]);
  }

  // Handle rgba(...) / rgb(...)
  if (str.startsWith('rgb')) {
    const match = str.match(/rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      return {
        r: Math.max(0, Math.min(1, parseFloat(match[1]) / 255)),
        g: Math.max(0, Math.min(1, parseFloat(match[2]) / 255)),
        b: Math.max(0, Math.min(1, parseFloat(match[3]) / 255)),
        a: match[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(match[4]))) : 1,
      };
    }
  }

  // Handle Hex
  let hex = str.startsWith('#') ? str.slice(1) : str;

  // Short hex: #rgb or #rgba
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b, a: 1 };
    }
  } else if (hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b) && !isNaN(a)) {
      return { r, g, b, a };
    }
  }

  // Fallback to solid black
  return { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * Formats RGBAColor back to css rgba string.
 */
export function toCssRgba(color: RGBAColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

/**
 * Checks if a color is completely transparent.
 */
export function isTransparent(color?: string | null): boolean {
  if (!color) return true;
  const parsed = parseColor(color);
  return parsed.a <= 0.001;
}
