import { expect, test } from '@playwright/test';

// Exercise Water's real arena presentation and character animation, not just the preview fixture.
test('Marina casts all three Water spells in the arena without rendering errors', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => { Math.random = () => .99; });
  await page.goto('/');
  const first = page.locator('#stickman-anchor-cascade-exp');
  await expect(first).toBeAttached({ timeout: 10_000 });
  await first.dispatchEvent('click');
  await expect(first.locator('.fight-opponent-prompt')).toBeAttached({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator('#stickman-anchor-terra-exp').dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Marina/ }).click();
  await page.getByRole('button', { name: 'Start as Marina' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 20_000 });
  for (const [name, id] of [['Curling Tidal Crest', 'water-tidal-surge'], ['Tideguard', 'water-whirlpool-vortex'], ['Restoring Spring', 'water-oceanic-geyser']]) {
    const button = page.getByRole('button', { name: `Cast ${name}` });
    await expect(button).toBeEnabled();
    await expect(async () => {
      if (await button.isEnabled()) await button.dispatchEvent('pointerdown');
      await expect(button).toBeDisabled({ timeout: 300 });
    }).toPass({ timeout: 5_000, intervals: [200] });
    await page.waitForTimeout(800);
    await page.screenshot({ path: testInfo.outputPath(`${id}-arena.png`) });
    await page.waitForTimeout(700);
  }
  expect(errors).toEqual([]);
});
