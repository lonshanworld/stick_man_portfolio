import { expect, test } from '@playwright/test';

type PreviewWindow = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number) => boolean;
  setCharacterPalettePreview: (lighting: 'world') => { element: string }[];
};

test('theme switch follows system preference, persists, and keeps realm selection independent', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  const neutral = await page.evaluate(() => ({
    background: getComputedStyle(document.querySelector('main.folio')!).backgroundColor,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--folio-accent'),
  }));
  expect(neutral.background).toBe('rgb(247, 247, 245)');
  expect(neutral.accent.trim()).toBe('#292929');
  await page.locator('#stickman-anchor-zephyr-hero').dispatchEvent('click');
  await expect(page.locator('main.folio')).toHaveAttribute('data-realm', 'wind');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--folio-accent'))).not.toBe(neutral.accent);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('main.folio')!).backgroundColor)).toBe(neutral.background);
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('main.folio')).toHaveAttribute('data-realm', 'wind');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('main.folio')!).backgroundColor)).toBe('rgb(18, 18, 18)');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toHaveAttribute('aria-pressed', 'true');
});

for (const theme of ['light', 'dark'] as const) {
  test(`all 42 spells and 14 characters render visibly in ${theme} mode`, async ({ page }, testInfo) => {
    test.setTimeout(360_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
    });
    await page.addInitScript(mode => localStorage.setItem('portfolio-theme', mode), theme);
    await page.goto('/?spellPreview=qa&characterPalette=qa');
    await page.waitForFunction(() => Boolean((window as unknown as PreviewWindow).getSpellPreviewCatalog));
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const background = theme === 'light' ? '#f7f7f5' : '#121212';
    await page.addStyleTag({ content: `body.spell-preview-mode, main.folio { background: ${background} !important; }` });
    const catalog = await page.evaluate(() => (window as unknown as PreviewWindow).getSpellPreviewCatalog());
    expect(catalog).toHaveLength(42);
    for (const spell of catalog) {
      expect(await page.evaluate(s => (window as unknown as PreviewWindow).setSpellPreviewFrame(s.id, s.duration * .5), spell)).toBe(true);
      const selected = ['ice-glacial-spikes', 'light-sunburst-lance', 'dark-phantom-wave'].includes(spell.id);
      const screenshot = await page.locator('.spell-world-canvas').screenshot(selected
        ? { path: testInfo.outputPath(`${theme}-${spell.id}.png`), scale: 'css' } : { scale: 'css' });
      const visiblePixels = await page.evaluate(async ({ png, light }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${png}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(img, 0, 0);
        const pixels = context.getImageData(0, 0, img.width, img.height).data;
        const bg = light ? [247, 247, 245] : [18, 18, 18];
        let count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          if (Math.max(...bg.map((value, channel) => Math.abs(pixels[i + channel] - value))) > 45) count++;
        }
        return count;
      }, { png: screenshot.toString('base64'), light: theme === 'light' });
      expect(visiblePixels, spell.id).toBeGreaterThan(150);
      if (selected) {
        await testInfo.attach(`${theme}-${spell.id}`, { body: screenshot, contentType: 'image/png' });
      }
    }
    expect(await page.evaluate(() => (window as unknown as PreviewWindow).setCharacterPalettePreview('world'))).toHaveLength(14);
    await testInfo.attach(`${theme}-characters`, { body: await page.locator('.spell-world-canvas').screenshot({ path: testInfo.outputPath(`${theme}-characters.png`), scale: 'css' }), contentType: 'image/png' });
    expect(errors).toEqual([]);
  });
}
