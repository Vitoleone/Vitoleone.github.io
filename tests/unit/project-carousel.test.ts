import { describe, expect, it } from 'vitest';

import {
  getDirectionalSlideIndex,
  getNearestSlideIndex,
} from '../../src/lib/ui/project-carousel';

describe('project carousel state', () => {
  it.each([
    [1, 'previous', 3, 0],
    [1, 'next', 3, 2],
    [0, 'previous', 3, 0],
    [2, 'next', 3, 2],
  ] as const)('moves %s %s within %s slides', (current, direction, count, expected) => {
    expect(getDirectionalSlideIndex(current, direction, count)).toBe(expected);
  });

  it('selects the slide nearest the horizontal scroll position', () => {
    expect(getNearestSlideIndex(615, [0, 600, 1200])).toBe(1);
    expect(getNearestSlideIndex(950, [0, 600, 1200])).toBe(2);
  });

  it('falls back safely when a carousel has no measurable slides', () => {
    expect(getNearestSlideIndex(500, [])).toBe(0);
    expect(getDirectionalSlideIndex(0, 'next', 0)).toBe(0);
  });
});
