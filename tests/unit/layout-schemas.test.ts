import { describe, expect, it } from 'vitest';

import {
  homeLayoutSchema,
  normalizeBlocks,
} from '../../src/lib/content/layout-schemas';

describe('editable layout schemas', () => {
  it('rejects duplicate ids and unknown variants', () => {
    expect(() => homeLayoutSchema.parse({
      kind: 'home',
      blocks: [
        { id: 'hero', enabled: true, order: 1, variant: 'neon', spacing: 'standard' },
        { id: 'hero', enabled: true, order: 2, variant: 'standard', spacing: 'standard' },
      ],
    })).toThrow();
  });

  it('fills missing home blocks as disabled defaults', () => {
    const blocks = normalizeBlocks([
      { id: 'hero', enabled: true, order: 1, variant: 'accent', spacing: 'spacious' },
    ], 'home');

    expect(blocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'contact', enabled: false }),
    ]));
  });
});
