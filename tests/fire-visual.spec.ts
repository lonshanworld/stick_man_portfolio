import { expect, test } from '@playwright/test';
type FirePreviewWindow = Window & {getSpellPreviewCatalog:()=>{id:string;duration:number}[];setSpellPreviewFrame:(id:string,elapsed:number,heading:number)=>boolean;getActiveSpellCount:()=>number};
test('all three Fire spells render through their phases, retain their powers, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as FirePreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as FirePreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('fire-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as FirePreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`${spell.id}-${Math.round(progress * 100)}.png`) });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as FirePreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as FirePreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as FirePreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
