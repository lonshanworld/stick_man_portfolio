import { expect, test } from '@playwright/test';
type RobotPreviewWindow = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number, heading: number) => boolean;
  getActiveSpellCount: () => number;
  getSpellPreviewState: () => {
    caster: { x: number; startX: number; pose?: { hidden?: boolean; shielded?: boolean; spellId?: string } };
    target?: { x: number; y: number; startX: number; startY: number };
  };
};

test('all three Robot spells render their phases and headings, show mechanical hardware, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as RobotPreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as RobotPreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('robot-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as RobotPreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      await page.screenshot({ path: `artifacts/robot-refactor/${spell.id}-${Math.round(progress * 100)}-${testInfo.project.name}.png` });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as RobotPreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
      await page.screenshot({ path: `artifacts/robot-refactor/${spell.id}-heading-${Math.round(heading * 100)}-${testInfo.project.name}.png` });
    }
    await page.evaluate(({ id, duration }) => (window as unknown as RobotPreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as RobotPreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
