import { expect, test } from '@playwright/test';

const FIRST = '#stickman-anchor-ignis-hero';
const SECOND = '#stickman-anchor-zephyr-hero';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
    window.sessionStorage.removeItem('stickman_visit_dialogue_deck');
  });
  await page.goto('/');
  await expect(page.locator(FIRST)).toBeAttached({ timeout: 10_000 });
});

test('a nearby pair has a visible, turn-based conversation', async ({ page }) => {
  const thread = page.getByRole('log');

  await expect(thread).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('.dialogue-thread')).toHaveCount(1);
  await expect(page.locator('.character-speech-bubble')).toHaveCount(0);
  await expect(thread).toContainText('Ignis');
  await expect(thread).toContainText('Aura');
  const ignis = await page.locator('#stickman-anchor-ignis-hero').boundingBox();
  const aura = await page.locator('#stickman-anchor-aurora-hero').boundingBox();
  const threadBox = await thread.boundingBox();
  await expect(thread.locator('.dialogue-message')).toHaveCount(2, { timeout: 6_000 });
  expect(ignis).not.toBeNull();
  expect(aura).not.toBeNull();
  expect(threadBox).not.toBeNull();
  if (ignis && aura) {
    expect(Math.hypot(ignis.x - aura.x, ignis.y - aura.y)).toBeLessThan(100);
  }
  if (ignis && aura && threadBox) {
    const pairCenterX = (ignis.x + aura.x) / 2;
    const pairTop = Math.min(ignis.y, aura.y);
    const threadBottom = threadBox.y + threadBox.height;
    expect(Math.abs(threadBox.x + threadBox.width / 2 - pairCenterX)).toBeLessThan(90);
    expect(Math.abs(threadBottom - pairTop)).toBeLessThan(90);
  }
});

test('clicking two heroes opens the player-vs-AI fighter picker', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });

  // The selection window is five seconds; the small guard against accidental
  // double taps is part of the original interaction and expires after one second.
  await page.waitForTimeout(1_100);
  await page.locator(SECOND).dispatchEvent('click');

  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Choose a fighter' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: /Ventus/ })).toBeVisible();
});

test('choosing a fighter launches the arena with the other hero as AI', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();

  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-touch-controls')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
});

test('arena spell casts render the hand-mounted magic seal', async ({ page }, testInfo) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 20_000 });

  const spellButton = page.getByRole('button', { name: 'Cast Tornado Gale' });
  await spellButton.dispatchEvent('pointerdown');
  await expect(spellButton).toBeDisabled({ timeout: 3_000 });
  await page.screenshot({ path: testInfo.outputPath('arena-hand-magic-seal.png') });
});

test('canceling the arena returns the heroes to the world', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Fight paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to portfolio' }).click();
  await expect(page.locator('.fight-arena')).toHaveCount(0);
  await expect(page.locator(FIRST)).toBeAttached();
  await expect(page.locator(SECOND)).toBeAttached();
});

test('random combat and bullying encounters remain paused', async ({ page }) => {
  await page.waitForTimeout(2_000);
  await expect(page.locator('.fight-opponent-prompt')).toHaveCount(0);
  await expect(page.locator('.fight-confirmation-panel')).toHaveCount(0);
  await expect(page.locator('.fight-arena')).toHaveCount(0);
  await expect(page.getByText(/Sneaking Up|BOO! PRANKED|STARTLED|Prank \/ Bully/i)).toHaveCount(0);
});

test('double-tap still opens spells without arming a fight', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('dblclick');
  await expect(page.getByText('Ignis Spells', { exact: false })).toBeVisible();
  await expect(page.locator('.fight-opponent-prompt')).toHaveCount(0);
});
