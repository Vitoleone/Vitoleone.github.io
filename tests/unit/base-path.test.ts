import { describe, expect, it } from 'vitest';

import { normalizeBasePath } from '../../src/lib/config/base-path';

describe('GitHub Pages base paths', () => {
  it.each([
    ['/', '/'],
    ['', '/'],
    ['portfolio', '/portfolio'],
    ['/portfolio/', '/portfolio'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(normalizeBasePath(input)).toBe(expected);
  });
});
