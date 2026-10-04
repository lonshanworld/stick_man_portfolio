import { expect, test } from '@playwright/test';

type PaletteWindow = Window & {
  setCharacterPalettePreview?: (lighting: 'world') => { element: string; x: number; y: number }[];
};

test('light companion keeps ivory and gold when toggling themes', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?characterPalette=qa');
  await page.waitForFunction(() => Boolean((window as PaletteWindow).setCharacterPalettePreview));
  const characters = await page.evaluate(() => (window as PaletteWindow).setCharacterPalettePreview?.('world'));
  expect(characters).toHaveLength(14);
  const light = characters!.find(character => character.element === 'light')!;
  for (const mode of ['dark', 'light', 'dark'] as const) {
    await page.evaluate(theme => {
      localStorage.setItem('portfolio-theme', theme);
      window.dispatchEvent(new Event('portfolio-theme-change'));
    }, mode);
    await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
    const png = await page.locator('.spell-world-canvas').screenshot({
      path: testInfo.outputPath(`ivory-gold-${mode}.png`), scale: 'css',
    });
    const colors = await page.evaluate(async ({ image, x, y }) => {
      const img = new Image(); img.src = `data:image/png;base64,${image}`; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0);
      const columns = img.width < 700 ? 2 : 7, rows = Math.ceil(14 / columns);
      const left = Math.floor(x - img.width / columns / 2), top = Math.floor(y - img.height / rows * .75);
      const pixels = ctx.getImageData(left, top, Math.floor(img.width / columns), Math.floor(img.height / rows)).data;
      let ivory = 0, gold = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        if (r > 205 && g > 195 && b > 160 && r - b > 8) ivory++;
        if (r > 90 && r > g && g > b && r - b > 35) gold++;
      }
      return { ivory, gold };
    }, { image: png.toString('base64'), x: light.x, y: light.y });
    expect(colors.ivory, `${mode} ivory`).toBeGreaterThan(20);
    expect(colors.gold, `${mode} gold`).toBeGreaterThan(50);
  }
  expect(errors).toEqual([]);
});
