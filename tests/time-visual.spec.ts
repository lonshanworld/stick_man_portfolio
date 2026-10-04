import { expect, test } from '@playwright/test';

type TimePreview = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number, heading: number) => boolean;
  getActiveSpellCount: () => number;
  getSpellPreviewState: () => { caster: { x: number; y: number; startX: number; startY: number }; target?: { pose?: { kind: string } } };
};

test('time renders all three spells at multiple phases and headings with working rewind and stasis', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(m.text())) errors.push(m.text()); });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as TimePreview).setSpellPreviewFrame));
  const spells = await page.evaluate(() => (window as unknown as TimePreview).getSpellPreviewCatalog().filter(s => s.id.startsWith('time-')));
  expect(spells).toHaveLength(3);
  for (const spell of spells) {
    for (const [p, heading] of [[.18, .35], [.5, .35], [.7, .35], [.9, .35], [.5, 0], [.5, Math.PI / 2], [.5, Math.PI]]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as TimePreview).setSpellPreviewFrame(id, elapsed, heading), { id: spell.id, elapsed: p * spell.duration, heading })).toBe(true);
      if (p === .5 && spell.id === 'time-stasis-field') {
        const state = await page.evaluate(() => (window as unknown as TimePreview).getSpellPreviewState());
        expect(state.target?.pose?.kind).toBe('frozen');
      }
      if (p === .7 && spell.id === 'time-chrono-rewind') {
        const { caster } = await page.evaluate(() => (window as unknown as TimePreview).getSpellPreviewState());
        expect(Math.hypot(caster.x - caster.startX, caster.y - caster.startY)).toBeGreaterThan(.1);
      }
      await page.screenshot({ path: `artifacts/time-refactor/${spell.id}-${Math.round(p * 100)}-heading-${Math.round(heading * 100)}-${testInfo.project.name}.png` });
    }
    await page.evaluate(s => (window as unknown as TimePreview).setSpellPreviewFrame(s.id, s.duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as TimePreview).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
