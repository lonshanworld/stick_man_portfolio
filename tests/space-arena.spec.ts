import { expect, test } from '@playwright/test';

type ArenaFrameWindow = Window & { freezeArenaFrames: () => void; stepArenaFrames: (milliseconds: number) => void };


// Exercise Space's real arena presentation and character animation, not just the preview fixture.
test('Cosmus casts all three Space spells in the arena without rendering errors', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => {
    Math.random = () => .99;
    const nativeRequest = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const pending = new Map<number, FrameRequestCallback>();
    const active = new Map<number, number>();
    let frozen = false, time = 0, nextId = 1_000_000_000;
    window.requestAnimationFrame = callback => {
      const id = nextId++;
      if (frozen) pending.set(id, callback);
      else active.set(id, nativeRequest(timestamp => {
        active.delete(id);
        if (frozen) pending.set(id, callback);
        else callback(timestamp);
      }));
      return id;
    };
    window.cancelAnimationFrame = id => {
      const nativeId = active.get(id);
      if (nativeId !== undefined) nativeCancel(nativeId);
      active.delete(id); pending.delete(id);
    };
    const api = window as unknown as ArenaFrameWindow;
    api.freezeArenaFrames = () => { frozen = true; time = performance.now(); };
    api.stepArenaFrames = milliseconds => {
      // Stay below the engine's 50 ms delta limit while keeping GPU captures efficient.
      const frames = Math.ceil(milliseconds / 40);
      for (let i = 0; i < frames; i++) {
        time += milliseconds / frames;
        const callbacks = [...pending.values()]; pending.clear();
        callbacks.forEach(callback => callback(time));
      }
    };
  });
  await page.goto('/');
  const first = page.locator('#stickman-anchor-cosmos-ai');
  await expect(first).toBeAttached({ timeout: 10_000 });
  await first.dispatchEvent('click');
  await expect(first.locator('.fight-opponent-prompt')).toBeAttached({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator('#stickman-anchor-aurora-hero').dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Cosmus/ }).click();
  await page.getByRole('button', { name: 'Start as Cosmus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 20_000 });
  // Freeze the arena clock between steps so screenshot latency cannot consume a short discharge.
  await page.evaluate(() => (window as unknown as ArenaFrameWindow).freezeArenaFrames());
  await page.waitForTimeout(100);
  for (const [name, id] of [['Gravity Well', 'space-meteor-shower'], ['Portal Step', 'space-cosmic-ray'], ['Orbital Guardians', 'space-planetary-rings']]) {
    const button = page.getByRole('button', { name: `Cast ${name}` });
    await expect(button).toBeEnabled();
    await expect(async () => {
      if (await button.isEnabled()) await button.dispatchEvent('pointerdown');
      await page.evaluate(() => (window as unknown as ArenaFrameWindow).stepArenaFrames(120));
      await expect(button).toBeDisabled({ timeout: 300 });
    }).toPass({ timeout: 5_000, intervals: [200] });
    for (const [step, phase] of [[250, 'rise'], [400, 'flight'], [650, 'impact'], [650, 'settle']] as const) {
      await page.evaluate(step => (window as unknown as ArenaFrameWindow).stepArenaFrames(step), step);
      await page.screenshot({ path: `artifacts/space-refactor/${id}-arena-${phase}-${testInfo.project.name}.png` });
    }
    await page.evaluate(() => (window as unknown as ArenaFrameWindow).stepArenaFrames(500));
  }
  expect(errors).toEqual([]);
});
