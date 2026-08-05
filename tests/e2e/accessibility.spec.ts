import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const route of ['/', '/projects/ship-action-demo/'] as const) {
  test(`${route} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(route);

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('the Turkish sentence on the English not-found page declares its language', async ({ page }) => {
  await page.goto('/route-that-does-not-exist/');

  await expect(page.getByText('Aradığınız sayfa bu yapıda bulunamadı.')).toHaveAttribute('lang', 'tr');
});
