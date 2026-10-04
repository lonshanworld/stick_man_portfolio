import { expect, test } from '@playwright/test';

type ArenaFrameWindow = Window & { freezeArenaFrames: () => void; stepArenaFrames: (milliseconds: number) => void };


// Exercise healing's actual arena effects, casting poses, and cooldowns.
test('Aura casts all three healing spells in the arena without rendering errors', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/');
  const first = page.locator('#stickman-anchor-lumina-hero');
  await expect(first).toBeAttached({ timeout: 60_000 });
  await first.dispatchEvent('click');
  await expect(first.locator('.fight-opponent-prompt')).toBeAttached({ timeout: 5_000 });
  await page.waitForTimeout(1_100);
  await page.locator('#stickman-anchor-aurora-hero').dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Aura/ }).click();
  await page.getByRole('button', { name: 'Start as Aura' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 20_000 });
  await page.evaluate(() => {
    // Keep opponent ability choices deterministic.
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
      const frames = Math.ceil(milliseconds / 40);
      for (let i = 0; i < frames; i++) {
        time += milliseconds / frames;
        const callbacks = [...pending.values()]; pending.clear();
        callbacks.forEach(callback => callback(time));
      }
    };
  });
  // Freeze the arena clock between steps so screenshot latency cannot consume a short discharge.
  await page.evaluate(() => (window as unknown as ArenaFrameWindow).freezeArenaFrames());
  await page.waitForTimeout(100);
  for (const [name, id] of [['Heartweaver Sanctuary', 'healing-sakura-sanctuary'], ['Mender Moth', 'healing-petal-breeze'], ['Cleansing Dew', 'healing-vitality-rain']]) {
    const button = page.getByRole('button', { name: `Cast ${name}` });
    await expect(button).toBeEnabled();
    await expect(async () => {
      if (await button.isEnabled()) await button.dispatchEvent('pointerdown');
      await page.evaluate(() => (window as unknown as ArenaFrameWindow).stepArenaFrames(120));
      await expect(button).toBeDisabled({ timeout: 300 });
    }).toPass({ timeout: 5_000, intervals: [200] });
    await page.evaluate(() => (window as unknown as ArenaFrameWindow).stepArenaFrames(350));
    await page.screenshot({ path: `artifacts/healing-refactor/${id}-arena-${testInfo.project.name}.png` });
    await page.evaluate(() => (window as unknown as ArenaFrameWindow).stepArenaFrames(3500));
  }
  expect(errors).toEqual([]);
});
