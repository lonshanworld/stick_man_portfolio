import { expect, test } from '@playwright/test';

test('arena hits show damage and impact feedback on desktop and touch layouts', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?spellPreview=qa');
  await expect(page.locator('#stickman-anchor-robot-proj')).toBeAttached({ timeout: 30_000 });
  await page.evaluate(() => {
    document.body.classList.remove('spell-preview-mode');
    document.getElementById('stickman-anchor-robot-proj')!.click();
  });
  await page.waitForTimeout(1100);
  await page.evaluate(() => document.getElementById('stickman-anchor-aurora-hero')!.click());
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible();
  await page.getByRole('radio', { name: /Nexus/ }).click();
  await page.getByRole('button', { name: 'Start as Nexus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible();
  await page.evaluate(() => {
    const pending = new Map<number, FrameRequestCallback>();
    let time = performance.now(), id = 1_000_000;
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
    window.cancelAnimationFrame = frame => { if (!pending.delete(frame)) cancel(frame); };
    const api = window as unknown as { stepFight: (ms: number) => void; damageObserved: string[] };
    api.damageObserved = [];
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('fight-damage-number')) api.damageObserved.push(node.textContent ?? '');
      }
    }).observe(document.querySelector('.fight-impact-layer')!, { childList: true });
    api.stepFight = milliseconds => {
      const frames = Math.ceil(milliseconds / 40);
      for (let frame = 0; frame < frames; frame++) {
        time += milliseconds / frames;
        const callbacks = [...pending.values()]; pending.clear();
        callbacks.forEach(callback => callback(time));
      }
    };
  });
  await page.waitForTimeout(150);
  const step = (ms: number) => page.evaluate(ms => (window as unknown as { stepFight: (ms: number) => void }).stepFight(ms), ms);
  await step(3000);
  await expect(page.locator('.fight-intro')).toHaveCount(0);
  // Move into range with the same input path used by the on-screen controls.
  await page.keyboard.down('d');
  await step(1400);
  await page.keyboard.up('d');
  await page.keyboard.press('1');
  await step(1500);
  expect(await page.evaluate(() => (window as unknown as { damageObserved: string[] }).damageObserved)).toEqual(expect.arrayContaining([expect.stringMatching(/−\d+/)]));
  await page.getByRole('button', { name: 'Pause fight' }).click();
  await expect(page.getByRole('dialog', { name: 'Fight paused' })).toBeVisible();
  const before = await page.locator('.fight-timer').getAttribute('aria-label');
  await step(1500);
  expect(await page.locator('.fight-timer').getAttribute('aria-label')).toBe(before);
  expect(errors).toEqual([]);
});
