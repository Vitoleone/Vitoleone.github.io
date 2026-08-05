import { describe, expect, it } from 'vitest';

import {
  formatExperienceRange,
  getAlternateLanguage,
  getLocalizedPath,
  localize,
} from '../../src/lib/ui/presentation';

describe('localized portfolio presentation', () => {
  it('selects the requested localized value', () => {
    const value = { en: 'Game Developer', tr: 'Oyun Geliştiricisi' };

    expect(localize(value, 'en')).toBe('Game Developer');
    expect(localize(value, 'tr')).toBe('Oyun Geliştiricisi');
  });

  it.each([
    ['/', 'home', 'en', '/'],
    ['/', 'home', 'tr', '/tr/'],
    ['/', 'about', 'en', '/about/'],
    ['/', 'about', 'tr', '/tr/about/'],
    ['/portfolio', 'home', 'en', '/portfolio/'],
    ['/portfolio/', 'about', 'tr', '/portfolio/tr/about/'],
  ] as const)('builds a base-aware %s %s route for %s', (base, page, language, expected) => {
    expect(getLocalizedPath(page, language, base)).toBe(expected);
  });

  it('returns the other supported language', () => {
    expect(getAlternateLanguage('en')).toBe('tr');
    expect(getAlternateLanguage('tr')).toBe('en');
  });

  it.each([
    ['2025-01', '2025-12', 'en', 'Jan 2025 — Dec 2025'],
    ['2024-06', 'present', 'en', 'Jun 2024 — Present'],
    ['2025-01', '2025-12', 'tr', 'Oca 2025 — Ara 2025'],
    ['2024-06', 'present', 'tr', 'Haz 2024 — Günümüz'],
    ['2024-08', '2024-08', 'en', 'Aug 2024'],
    ['2024-08', '2024-08', 'tr', 'Ağu 2024'],
  ] as const)(
    'formats %s to %s as a compact %s date range',
    (startDate, endDate, language, expected) => {
      expect(formatExperienceRange(startDate, endDate, language)).toBe(expected);
    },
  );
});
