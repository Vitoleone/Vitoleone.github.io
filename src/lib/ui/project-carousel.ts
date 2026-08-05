export type CarouselDirection = 'previous' | 'next';

export function getDirectionalSlideIndex(
  currentIndex: number,
  direction: CarouselDirection,
  slideCount: number,
): number {
  if (slideCount <= 0) return 0;
  const delta = direction === 'previous' ? -1 : 1;
  return Math.min(Math.max(currentIndex + delta, 0), slideCount - 1);
}

export function getNearestSlideIndex(scrollLeft: number, slideOffsets: readonly number[]): number {
  if (slideOffsets.length === 0) return 0;

  return slideOffsets.reduce((nearestIndex, offset, index) => {
    const nearestDistance = Math.abs(slideOffsets[nearestIndex] - scrollLeft);
    const candidateDistance = Math.abs(offset - scrollLeft);
    return candidateDistance < nearestDistance ? index : nearestIndex;
  }, 0);
}
