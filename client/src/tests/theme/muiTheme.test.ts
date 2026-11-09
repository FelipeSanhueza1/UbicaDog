import { describe, it, expect } from 'vitest';
import { lightPalette, darkPalette } from '../../theme/muiTheme';

describe('Design System Theme Palettes (MUI)', () => {
  it('should verify that primary 500 equals primary main in light palette', () => {
    expect(lightPalette.primary[500]).toBe(lightPalette.primary.main);
    expect(lightPalette.secondary[500]).toBe(lightPalette.secondary.main);
    expect(lightPalette.tertiary[500]).toBe(lightPalette.tertiary.main);
  });

  it('should verify that primary 500 equals primary main in dark palette', () => {
    expect(darkPalette.primary[500]).toBe(darkPalette.primary.main);
    expect(darkPalette.secondary[500]).toBe(darkPalette.secondary.main);
    expect(darkPalette.tertiary[500]).toBe(darkPalette.tertiary.main);
  });

  it('should verify complete 50 to 900 scale for primary colors', () => {
    const scales = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'] as const;
    scales.forEach((s) => {
      expect(lightPalette.primary[s]).toBeDefined();
      expect(lightPalette.primary[s]).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(darkPalette.primary[s]).toBeDefined();
      expect(darkPalette.primary[s]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should have proper contrastText and background tokens', () => {
    expect(lightPalette.primary.contrastText).toBe('#FFFFFF');
    expect(lightPalette.background.default).toBe('#F8FAFC');
    expect(darkPalette.background.default).toBe('#0B0F19');
    expect(lightPalette.text.primary).toBe('#0F172A');
    expect(darkPalette.text.primary).toBe('#F8FAFC');
  });
});
