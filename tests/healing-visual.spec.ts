import { expect, test } from '@playwright/test';

type PreviewWindow = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number, heading: number) => boolean;
  getActiveSpellCount: () => number;
};

test('all healing spells render on desktop and mobile, across phases and headings, then clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(m.text())) errors.push(m.text()); });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as PreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as PreviewWindow).getSpellPreviewCatalog().filter(s => s.id.startsWith('healing-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const p of [.18,.5,.72,.9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as PreviewWindow).setSpellPreviewFrame(id, elapsed, .35), { id: spell.id, elapsed: spell.duration*p })).toBe(true);
      await page.screenshot({ path: `artifacts/healing-refactor/${spell.id}-${p*100}-${testInfo.project.name}.png` });
    }
    for (const heading of [0,Math.PI/2,Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as PreviewWindow).setSpellPreviewFrame(id, elapsed, heading), { id: spell.id, elapsed: spell.duration*.5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as PreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as PreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
