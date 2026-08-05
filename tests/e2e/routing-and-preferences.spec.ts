import { expect, test } from '@playwright/test';

const localizedRoutes = [
  { english: '/', turkish: '/tr/', heading: /building responsive gameplay experiences with unity/i },
  { english: '/about/', turkish: '/tr/about/', heading: /I turn game ideas/i },
  {
    english: '/projects/ship-action-demo/',
    turkish: '/tr/projects/ship-action-demo/',
    heading: /ship action demo/i,
  },
] as const;

test.describe('localized routing', () => {
  for (const route of localizedRoutes) {
    test(`pairs ${route.english} with ${route.turkish}`, async ({ page }) => {
      await page.goto(route.english);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();

      await page.locator('[data-language-choice="tr"]').click();
      await expect(page).toHaveURL(new RegExp(`${route.turkish.replaceAll('/', '\\/')}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'tr');

      await page.locator('[data-language-choice="en"]').click();
      await expect(page).toHaveURL(new RegExp(`${route.english.replaceAll('/', '\\/')}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  }
});

test('persists the selected theme across navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-theme-toggle]').click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/about/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBe('dark');
});

test('restores a stored Turkish preference only from the English root entry', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-language-choice="tr"]').click();
  await expect(page).toHaveURL(/\/tr\/$/);

  await page.goto('/');
  await expect(page).toHaveURL(/\/tr\/$/);

  await page.goto('/about/');
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('legacy HTML entries preserve the query and hash while redirecting', async ({ page }) => {
  await page.goto('/ship-action.html?source=legacy#projects');

  await expect(page).toHaveURL(/\/projects\/ship-action-demo\/\?source=legacy#projects$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Ship Action Demo' })).toBeVisible();
});
