import { expect, test } from '@playwright/test';

test('mobile menu opens, closes with Escape, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggle = page.locator('[data-menu-toggle]');
  const panel = page.locator('[data-menu-panel]');
  await expect(panel).toBeHidden();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(panel).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(panel).toBeHidden();
  await expect(toggle).toBeFocused();
});

test('project technology filters update cards, pressed state, and result announcement', async ({ page }) => {
  await page.goto('/#projects');

  const list = page.locator('[data-project-list]');
  const unityFilter = list.locator('[data-project-filter="unity"]');
  const allItems = list.locator('[data-project-item]');
  const unityItems = list.locator('[data-project-item][data-technologies~="unity"]');
  const expectedVisible = await unityItems.count();

  await unityFilter.click();

  await expect(unityFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(allItems.filter({ visible: true })).toHaveCount(expectedVisible);
  await expect(list.locator('[data-filter-status]')).toContainText(String(expectedVisible));
});

test('a project places mechanics media in overview with no standalone work section', async ({ page }) => {
  await page.goto('/projects/ship-action-demo/');

  const overview = page.locator('.project-overview');
  const mechanics = overview.locator('[data-editor-block="mechanics"]');
  await expect(mechanics).toHaveCount(1);
  await expect(mechanics.getByRole('heading', { name: 'Missions and Resources' })).toBeVisible();
  await expect(overview.locator('video[controls][preload="metadata"]')).toHaveCount(1);
  await expect(page.locator('.project-work')).toHaveCount(0);
  await expect(page.locator('[data-project-carousel]')).toHaveCount(0);
});
