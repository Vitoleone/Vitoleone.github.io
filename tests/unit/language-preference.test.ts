import { describe, expect, it, vi } from 'vitest';

import {
  getLanguagePreferenceRedirect,
  restoreLanguagePreference,
} from '../../src/lib/ui/language-preference';

describe('saved language restoration', () => {
  it.each([
    [
      { storedLanguage: 'tr', language: 'en', page: 'home', isRootEntry: true, base: '/' },
      '/tr/',
    ],
    [
      { storedLanguage: 'tr', language: 'en', page: 'home', isRootEntry: true, base: '/portfolio/' },
      '/portfolio/tr/',
    ],
    [
      { storedLanguage: 'en', language: 'en', page: 'home', isRootEntry: true, base: '/' },
      undefined,
    ],
    [
      { storedLanguage: null, language: 'en', page: 'home', isRootEntry: true, base: '/' },
      undefined,
    ],
    [
      { storedLanguage: 'de', language: 'en', page: 'home', isRootEntry: true, base: '/' },
      undefined,
    ],
  ] as const)('resolves a root-entry redirect without changing the English default', (context, expected) => {
    expect(getLanguagePreferenceRedirect(context)).toBe(expected);
  });

  it.each([
    { storedLanguage: 'tr', language: 'en', page: 'about', isRootEntry: false, base: '/' },
    { storedLanguage: 'en', language: 'tr', page: 'home', isRootEntry: false, base: '/' },
    { storedLanguage: 'en', language: 'tr', page: 'about', isRootEntry: false, base: '/' },
  ] as const)('preserves an explicit language-specific route: %o', (context) => {
    expect(getLanguagePreferenceRedirect(context)).toBeUndefined();
  });

  it('restores Turkish on the root entry while preserving query and hash', () => {
    const replace = vi.fn();

    restoreLanguagePreference(
      { language: 'en', page: 'home', isRootEntry: true, base: '/portfolio/' },
      {
        storage: { getItem: () => 'tr' },
        location: {
          pathname: '/portfolio/',
          search: '?from=resume',
          hash: '#projects',
          replace,
        },
      },
    );

    expect(replace).toHaveBeenCalledOnce();
    expect(replace).toHaveBeenCalledWith('/portfolio/tr/?from=resume#projects');
  });

  it('keeps the English root when storage is unavailable', () => {
    const replace = vi.fn();

    restoreLanguagePreference(
      { language: 'en', page: 'home', isRootEntry: true, base: '/' },
      {
        storage: { getItem: () => { throw new Error('blocked'); } },
        location: { pathname: '/', search: '', hash: '', replace },
      },
    );

    expect(replace).not.toHaveBeenCalled();
  });
});
