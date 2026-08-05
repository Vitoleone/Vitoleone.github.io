import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/projects/ship-action-demo/'] as const) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('carousel slides expose group semantics on neutral containers', async ({ page }) => {
  await page.goto('/projects/ship-action-demo/');

  const slides = page.locator('[data-carousel-slide]');
  await expect(slides.first()).toHaveAttribute('role', 'group');
  await expect.poll(() => slides.first().evaluate((slide) => slide.tagName)).toBe('DIV');
});
test('the Turkish sentence on the English not-found page declares its language', async ({ page }) => {
  await page.goto('/route-that-does-not-exist/');

  await expect(page.getByText('Aradığınız sayfa bu yapıda bulunamadı.')).toHaveAttribute('lang', 'tr');
});
