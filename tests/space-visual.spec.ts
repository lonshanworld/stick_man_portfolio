import { expect, test } from '@playwright/test';
type SpacePreviewWindow = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number, heading: number) => boolean;
  getActiveSpellCount: () => number;
  getSpellPreviewState: () => {
    caster: { x: number; startX: number; pose?: { hidden?: boolean; shielded?: boolean; spellId?: string } };
    target?: { x: number; y: number; startX: number; startY: number };
  };
};

test('all three Space spells render their phases and headings, preserve pull/teleport/shield, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as SpacePreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as SpacePreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('space-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as SpacePreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      const state = await page.evaluate(() => (window as unknown as SpacePreviewWindow).getSpellPreviewState());
      if (spell.id === 'space-planetary-rings' && progress === .5) expect(state.caster.pose?.shielded).toBe(true);
      if (spell.id === 'space-cosmic-ray' && progress === .5) expect(state.caster.x).not.toBe(state.caster.startX);
      if (spell.id === 'space-meteor-shower' && progress === .5) {
        expect(state.target).toBeDefined();
        expect(Math.hypot(state.target!.x - state.target!.startX, state.target!.y - state.target!.startY)).toBeGreaterThan(0);
      }
      await page.screenshot({ path: `artifacts/space-refactor/${spell.id}-${Math.round(progress * 100)}-${testInfo.project.name}.png` });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as SpacePreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
      await page.screenshot({ path: `artifacts/space-refactor/${spell.id}-heading-${Math.round(heading * 100)}-${testInfo.project.name}.png` });
    }
    if (spell.id === 'space-cosmic-ray') {
      await page.evaluate(id => (window as unknown as SpacePreviewWindow).setSpellPreviewFrame(id, .65, .35), spell.id);
      const state = await page.evaluate(() => (window as unknown as SpacePreviewWindow).getSpellPreviewState());
      expect(state.caster.pose?.hidden).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as SpacePreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as SpacePreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
