import { expect, test } from '@playwright/test';
type WindPreviewWindow = Window & {getSpellPreviewCatalog:()=>{id:string;duration:number}[];setSpellPreviewFrame:(id:string,elapsed:number,heading:number)=>boolean;getActiveSpellCount:()=>number;getSpellPreviewState:()=>{caster:{pose?:{lift?:number;kind?:string}};target?:{x:number;y:number;startX:number;startY:number;pose?:{kind?:string}}}};
test('all three Wind spells render through their phases, retain their powers, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as WindPreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as WindPreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('wind-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as WindPreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      if (progress === .5) {
        const state = await page.evaluate(() => (window as unknown as WindPreviewWindow).getSpellPreviewState());
        if (spell.id === 'wind-aero-burst') {
          expect(state.caster.pose?.kind).toBe('levitate');
          expect(state.caster.pose?.lift).toBeGreaterThan(40);
        }
        if (spell.id === 'wind-tornado-gale') {
          expect(state.target).toBeDefined();
          expect(Math.hypot(state.target!.x-state.target!.startX,state.target!.y-state.target!.startY)).toBeGreaterThan(.05);
        }
      }
      await page.screenshot({ path: testInfo.outputPath(`${spell.id}-${Math.round(progress * 100)}.png`) });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as WindPreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as WindPreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as WindPreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
