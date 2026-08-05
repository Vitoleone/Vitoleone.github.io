import { expect, test } from '@playwright/test';

const pages = [
  { name: 'home', path: '/' },
  { name: 'project', path: '/projects/the-boss-gangster-criminal-empire/' },
] as const;
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
const themes = ['light', 'dark'] as const;

for (const pageCase of pages) {
  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`${pageCase.name} ${theme} ${viewport.name} visual`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.addInitScript((selectedTheme) => {
          localStorage.setItem('portfolio-theme', selectedTheme);
        }, theme);
        await page.goto(pageCase.path);
        await page.evaluate(() => document.fonts.ready);

        await expect(page).toHaveScreenshot(
          `${pageCase.name}-${theme}-${viewport.name}.png`,
          {
            animations: 'disabled',
            fullPage: true,
            maxDiffPixelRatio: 0.02,
            mask: [page.locator('img[src$=".gif"], video, iframe')],
            maskColor: '#6f7782',
          },
        );
      });
    }
  }
}
