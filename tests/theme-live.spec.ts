import { expect, test } from '@playwright/test';

type PreviewWindow = Window & {
  setSpellPreviewFrame?: (id: string, elapsed: number) => boolean;
  getActiveSpellCount?: () => number;
};

test('an active spell stays visible when switching modes without rebuilding the world', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as PreviewWindow).setSpellPreviewFrame));
  expect(await page.evaluate(() => (window as PreviewWindow).setSpellPreviewFrame?.('ice-glacial-spikes', 1))).toBe(true);
  const canvas = page.locator('.spell-world-canvas');
  const originalCanvas = await canvas.elementHandle();
  for (const mode of ['light', 'dark'] as const) {
    await page.evaluate(theme => {
      localStorage.setItem('portfolio-theme', theme);
      window.dispatchEvent(new Event('portfolio-theme-change'));
    }, mode);
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    expect(await page.evaluate(() => (window as PreviewWindow).getActiveSpellCount?.())).toBe(1);
    expect(await originalCanvas?.evaluate(node => node === document.querySelector('.spell-world-canvas'))).toBe(true);
    await canvas.screenshot({ path: testInfo.outputPath(`active-spell-${mode}.png`), scale: 'css' });
  }
  expect(errors).toEqual([]);
});
