import { expect, test } from '@playwright/test';
type DarkPreviewWindow = Window & {getSpellPreviewCatalog:()=>{id:string;duration:number}[];setSpellPreviewFrame:(id:string,elapsed:number,heading:number)=>boolean;getActiveSpellCount:()=>number;getSpellPreviewState:()=>{caster:{pose?:{hidden?:boolean;demonTime?:number;spellId?:string;kind?:string}};target?:{x:number;y:number;startX:number;startY:number;pose?:{kind?:string;speedMultiplier?:number}}}};
test('all three Dark spells render through their phases, retain their powers, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as DarkPreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as DarkPreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('dark-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as DarkPreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      if (progress === .5) {
        const state = await page.evaluate(() => (window as unknown as DarkPreviewWindow).getSpellPreviewState());
        if (spell.id === 'dark-eclipse-nova') {
          expect(state.caster.pose?.hidden).toBe(false);
          expect(state.caster.pose?.demonTime).toBeGreaterThan(6.8);
          expect(state.caster.pose?.spellId).toBe(spell.id);
        }
        if (spell.id === 'dark-abyssal-grasp' || spell.id === 'dark-phantom-wave') expect(state.target?.pose?.speedMultiplier).toBe(.38);
      }
      await page.screenshot({ path: `artifacts/lucifer-refactor/${spell.id}-${Math.round(progress * 100)}-${testInfo.project.name}.png` });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as DarkPreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as DarkPreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as DarkPreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
