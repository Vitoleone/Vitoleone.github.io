import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    __carouselMutations: number;
    __videoPauses: number;
  }
}

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

  await list.locator('[data-project-filter="all"]').click();
  await expect(allItems.filter({ visible: true })).toHaveCount(await allItems.count());
});

test('carousel keyboard controls clamp at the ends and announce genuine index changes', async ({ page }) => {
  await page.goto('/projects/ship-action-demo/');

  const viewport = page.locator('[data-carousel-viewport]');
  const status = page.locator('[data-carousel-status]');
  await viewport.focus();
  await page.keyboard.press('End');
  await expect(status).toContainText('2 / 2: Upgrades');
  await expect(page.locator('[data-carousel-next]')).toBeDisabled();

  await page.keyboard.press('ArrowRight');
  await expect(status).toContainText('2 / 2: Upgrades');

  await page.keyboard.press('Home');
  await expect(status).toContainText('1 / 2: Missions and Resources');
  await expect(page.locator('[data-carousel-previous]')).toBeDisabled();
});

test('horizontal swiping activates the nearest carousel slide', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/ship-action-demo/');

  const viewport = page.locator('[data-carousel-viewport]');
  await viewport.scrollIntoViewIfNeeded();
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();

  const client = await context.newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const startX = bounds!.x + bounds!.width * 0.8;
  const endX = bounds!.x + bounds!.width * 0.2;
  const y = bounds!.y + bounds!.height * 0.5;
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y }],
  });
  for (let step = 1; step <= 4; step += 1) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX + ((endX - startX) * step) / 4, y }],
    });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

  await expect(page.locator('[data-carousel-status]')).toContainText('2 / 2: Upgrades');
  await expect(page.locator('[data-carousel-dot="1"]')).toHaveAttribute('aria-current', 'true');
});

test('same-index navigation leaves live and media state untouched', async ({ page }) => {
  await page.goto('/projects/ship-action-demo/');

  await page.evaluate(() => {
    window.__carouselMutations = 0;
    window.__videoPauses = 0;

    const status = document.querySelector('[data-carousel-status]');
    if (status) {
      new MutationObserver((records) => {
        window.__carouselMutations += records.length;
      }).observe(status, { childList: true, characterData: true, subtree: true });
    }

    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function pause() {
      window.__videoPauses += 1;
      return originalPause.call(this);
    };
  });

  const viewport = page.locator('[data-carousel-viewport]');
  await viewport.focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(50);

  const state = await page.evaluate(() => ({
    mutations: window.__carouselMutations,
    pauses: window.__videoPauses,
  }));
  expect(state).toEqual({ mutations: 0, pauses: 0 });
});

test('videos stay metadata-only and inactive Drive frames load only when activated', async ({ page }) => {
  await page.route('https://drive.google.com/**', (route) => route.abort());
  await page.goto('/projects/ship-action-demo/');

  const videos = page.locator('[data-carousel-slide] video');
  await expect(videos).toHaveCount(2);
  await expect(videos.first()).toHaveAttribute('preload', 'metadata');
  await expect(videos.nth(1)).toHaveAttribute('preload', 'metadata');

  const frame = page.locator('[data-carousel-slide]').nth(1).locator('iframe[data-src]');
  await page.locator('[data-carousel-slide]').nth(1).evaluate((slide) => {
    const iframe = document.createElement('iframe');
    iframe.dataset.src = 'https://drive.google.com/file/d/Task6Fixture/preview';
    iframe.title = 'Deferred Drive fixture';
    slide.append(iframe);
  });
  await expect(frame).not.toHaveAttribute('src', /.+/);

  await page.locator('[data-carousel-next]').click();
  await expect(frame).toHaveAttribute('src', 'https://drive.google.com/file/d/Task6Fixture/preview');
});
