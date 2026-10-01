import { FontWeight, FontStyle } from '../types';

export interface FontDescriptor {
  family: string;
  weight: FontWeight;
  style: FontStyle;
  data?: Uint8Array; // Optional raw font bytes for custom TTF/OTF
}

export type Standard14FontKey =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-Oblique'
  | 'Helvetica-BoldOblique'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Times-Italic'
  | 'Times-BoldItalic'
  | 'Courier'
  | 'Courier-Bold'
  | 'Courier-Oblique'
  | 'Courier-BoldOblique'
  | 'Symbol'
  | 'ZapfDingbats';

export class FontManager {
  private customFonts = new Map<string, FontDescriptor>();

  /**
   * Resolves standard font variant or registered font.
   */
  public resolveFontName(
    family = 'Helvetica',
    weight: FontWeight = 'normal',
    style: FontStyle = 'normal'
  ): Standard14FontKey {
    const isBold = weight === 'bold' || (typeof weight === 'number' && weight >= 600);
    const isItalic = style === 'italic' || style === 'oblique';

    const normalized = family.toLowerCase().trim();

    if (normalized.includes('times') || normalized.includes('serif')) {
      if (isBold && isItalic) return 'Times-BoldItalic';
      if (isBold) return 'Times-Bold';
      if (isItalic) return 'Times-Italic';
      return 'Times-Roman';
    }

    if (normalized.includes('courier') || normalized.includes('mono')) {
      if (isBold && isItalic) return 'Courier-BoldOblique';
      if (isBold) return 'Courier-Bold';
      if (isItalic) return 'Courier-Oblique';
      return 'Courier';
    }

    // Default to Helvetica / Sans-Serif
    if (isBold && isItalic) return 'Helvetica-BoldOblique';
    if (isBold) return 'Helvetica-Bold';
    if (isItalic) return 'Helvetica-Oblique';
    return 'Helvetica';
  }

  /**
   * Registers a custom TrueType or OpenType font buffer.
   */
  public registerFont(name: string, data: Uint8Array, weight: FontWeight = 'normal', style: FontStyle = 'normal') {
    this.customFonts.set(name.toLowerCase(), {
      family: name,
      weight,
      style,
      data,
    });
  }

  public getCustomFont(name: string): FontDescriptor | undefined {
    return this.customFonts.get(name.toLowerCase());
  }

  public hasCustomFont(name: string): boolean {
    return this.customFonts.has(name.toLowerCase());
  }
}

export const defaultFontManager = new FontManager();
