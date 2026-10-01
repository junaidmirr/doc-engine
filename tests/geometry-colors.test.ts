import { describe, it, expect } from 'vitest';
import { parseColor, isTransparent, toCssRgba } from '../src/core/colors';
import { toPdfCoordinates, toScreenCoordinates, getAlignmentOffsetX } from '../src/core/geometry';
import { resolvePageDimensions } from '../src/core/page';

describe('Color System', () => {
  it('should parse 6-digit hex colors', () => {
    const col = parseColor('#ffffff');
    expect(col.r).toBe(1);
    expect(col.g).toBe(1);
    expect(col.b).toBe(1);
    expect(col.a).toBe(1);
  });

  it('should parse 3-digit hex colors', () => {
    const col = parseColor('#000');
    expect(col.r).toBe(0);
    expect(col.g).toBe(0);
    expect(col.b).toBe(0);
    expect(col.a).toBe(1);
  });

  it('should parse rgba strings', () => {
    const col = parseColor('rgba(255, 128, 0, 0.5)');
    expect(col.r).toBe(1);
    expect(col.g).toBeCloseTo(0.501, 2);
    expect(col.b).toBe(0);
    expect(col.a).toBe(0.5);
  });

  it('should recognize transparent / none', () => {
    expect(isTransparent('transparent')).toBe(true);
    expect(isTransparent('none')).toBe(true);
    expect(isTransparent('rgba(0,0,0,0)')).toBe(true);
    expect(isTransparent('#000000')).toBe(false);
  });
});

describe('Coordinate System', () => {
  it('should convert top-left to PDF bottom-left coordinates', () => {
    const pageHeight = 792;
    const elementHeight = 50;
    const yTopLeft = 100;

    // PDF Y = 792 - 100 - 50 = 642
    const pt = toPdfCoordinates(50, yTopLeft, elementHeight, pageHeight, 'top-left');
    expect(pt.x).toBe(50);
    expect(pt.y).toBe(642);

    // Reversible back to top-left
    const screen = toScreenCoordinates(pt.x, pt.y, elementHeight, pageHeight);
    expect(screen.y).toBe(100);
  });

  it('should calculate alignment offsets', () => {
    expect(getAlignmentOffsetX('left', 200, 100)).toBe(0);
    expect(getAlignmentOffsetX('center', 200, 100)).toBe(50);
    expect(getAlignmentOffsetX('right', 200, 100)).toBe(100);
  });
});

describe('Page Sizing', () => {
  it('should resolve standard page presets', () => {
    const letter = resolvePageDimensions('letter', 'portrait');
    expect(letter.width).toBe(612);
    expect(letter.height).toBe(792);

    const letterLandscape = resolvePageDimensions('letter', 'landscape');
    expect(letterLandscape.width).toBe(792);
    expect(letterLandscape.height).toBe(612);

    const a4 = resolvePageDimensions('a4', 'portrait');
    expect(a4.width).toBeCloseTo(595.28, 1);
    expect(a4.height).toBeCloseTo(841.89, 1);
  });
});
