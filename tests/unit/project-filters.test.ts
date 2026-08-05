import { describe, expect, it } from 'vitest';

import {
  getTechnologyFilters,
  normalizeFilterKey,
  projectMatchesFilter,
} from '../../src/lib/ui/project-filters';

describe('project technology filters', () => {
  it.each([
    ['Unity', 'unity'],
    ['C#', 'c'],
    ['Express.js', 'express-js'],
    ['Design Patterns', 'design-patterns'],
  ])('normalizes %j into the shared DOM filter key %j', (technology, expected) => {
    expect(normalizeFilterKey(technology)).toBe(expected);
  });

  it('deduplicates filters and orders them by project coverage then label', () => {
    const projects = [
      { technologies: ['Unity', 'C#'] },
      { technologies: ['Unity', 'UGUI'] },
      { technologies: ['Unity', 'C#', 'Design Patterns'] },
      { technologies: [] },
    ];

    expect(getTechnologyFilters(projects)).toEqual([
      { key: 'unity', label: 'Unity', count: 3 },
      { key: 'c', label: 'C#', count: 2 },
      { key: 'design-patterns', label: 'Design Patterns', count: 1 },
      { key: 'ugui', label: 'UGUI', count: 1 },
    ]);
  });

  it('matches all projects for the all filter and exact normalized technologies otherwise', () => {
    const technologies = ['Unity', 'C#'];

    expect(projectMatchesFilter(technologies, 'all')).toBe(true);
    expect(projectMatchesFilter(technologies, 'unity')).toBe(true);
    expect(projectMatchesFilter(technologies, 'c')).toBe(true);
    expect(projectMatchesFilter(technologies, 'unreal')).toBe(false);
    expect(projectMatchesFilter([], 'unity')).toBe(false);
  });
});
