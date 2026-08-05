import { describe, expect, it } from 'vitest';

import {
  assertUniqueProjectSlugs,
  createUniqueSlugIdGenerator,
  getPublishedProjects,
  getVisibleCtas,
} from '../../src/lib/content/helpers';

describe('project collection helpers', () => {
  it('reports every source file involved in a duplicate slug', () => {
    expect(() =>
      assertUniqueProjectSlugs([
        { slug: 'same-game', source: 'first.yml' },
        { slug: 'other-game', source: 'other.yml' },
        { slug: 'same-game', source: 'duplicate.yml' },
      ]),
    ).toThrow(/same-game.*first\.yml.*duplicate\.yml/i);
  });

  it('turns duplicate project loader IDs into a build error instead of a warning', () => {
    const generateId = createUniqueSlugIdGenerator();
    const base = new URL('file:///content/projects/');

    expect(generateId({ data: { slug: 'same-game' }, entry: 'first.yml', base })).toBe('same-game');
    expect(() =>
      generateId({ data: { slug: 'same-game' }, entry: 'duplicate.yml', base }),
    ).toThrow(/same-game.*first\.yml.*duplicate\.yml/i);
  });

  it('returns only published projects in ascending display order', () => {
    const projects = [
      { id: 'third', data: { published: true, order: 3 } },
      { id: 'draft', data: { published: false, order: 1 } },
      { id: 'first', data: { published: true, order: 1 } },
    ];

    expect(getPublishedProjects(projects).map(({ id }) => id)).toEqual(['first', 'third']);
  });

  it('does not expose CTA buttons for missing or empty URLs', () => {
    expect(
      getVisibleCtas({
        play: ' ',
        source: undefined,
        store: 'https://store.steampowered.com/app/123/example',
      }),
    ).toEqual([
      {
        kind: 'store',
        href: 'https://store.steampowered.com/app/123/example',
      },
    ]);
  });
});
