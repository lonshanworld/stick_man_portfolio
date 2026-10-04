import { expect, test, type Page } from '@playwright/test';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';

async function freezeClock(page: Page) {
  await page.evaluate(() => {
    const pending = new Map<number, FrameRequestCallback>();
    let time = performance.now(), id = 1_000_000;
    const cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
    window.cancelAnimationFrame = frame => { if (!pending.delete(frame)) cancel(frame); };
    const api = window as unknown as { stepMagic: (ms: number) => void; magicFeedback: string[] };
    api.magicFeedback = [];
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('fight-damage-number')) api.magicFeedback.push(node.textContent ?? '');
      }
    }).observe(document.querySelector('.fight-impact-layer')!, { childList: true });
    api.stepMagic = milliseconds => {
      const frames = Math.ceil(milliseconds / 40);
      for (let frame = 0; frame < frames; frame++) {
        time += milliseconds / frames;
        const callbacks = [...pending.values()]; pending.clear();
        callbacks.forEach(callback => callback(time));
      }
    };
  });
  await page.waitForTimeout(150);
  return (ms: number) => page.evaluate(ms => (window as unknown as { stepMagic: (ms: number) => void }).stepMagic(ms), ms);
}

for (const [element, id, index] of [
  ['water', 'aqua-proj', 1], ['ice', 'glacius-proj', 1], ['soil', 'terra-exp', 2],
  ['trees', 'sylvan-exp', 2], ['space', 'cosmos-ai', 2],
] as const) {
  test(`${element} ward protects against an actual opponent and remains visible after recovery`, async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /WebGL|THREE|shader|GL_INVALID/i.test(message.text())) errors.push(message.text()); });
    await page.addInitScript(() => { Math.random = () => .5; });
    if (!testInfo.project.name.startsWith('mobile')) await page.setViewportSize({ width: 960, height: 640 });
    await page.goto('/?spellPreview=qa');
    await expect(page.locator(`#stickman-anchor-${id}`)).toBeAttached({ timeout: 30_000 });
    await page.evaluate(id => new Promise<void>(resolve => {
      document.body.classList.remove('spell-preview-mode');
      document.getElementById(`stickman-anchor-${id}`)!.click();
      setTimeout(() => { document.getElementById('stickman-anchor-ignis-hero')!.click(); resolve(); }, 1100);
    }), id);
    const name = STICK_MAN_ARCHETYPES[element].name;
    await page.getByRole('radio', { name: new RegExp(name) }).click();
    await page.getByRole('button', { name: `Start as ${name}` }).click();
    await expect(page.locator('.fight-arena')).toBeVisible();
    await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 45_000 });
    const step = await freezeClock(page);
    const button = page.getByRole('button', { name: `Cast ${ELEMENTAL_SPELLS[element][index].name}` });
    await expect(async () => {
      if (await button.isEnabled()) await button.dispatchEvent('pointerdown');
      await step(160);
      expect(Number(await button.getAttribute('data-cooldown'))).toBeGreaterThan(0);
    }).toPass({ timeout: 10_000, intervals: [150] });
    await expect(button).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Punch', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Kick', exact: true })).toBeDisabled();
    await step(900);
    const shield = page.locator('.fight-fighter-meters.left .fight-shield-status');
    await expect(shield).toBeVisible();
    await expect(shield).toContainText('SHIELD');
    const health = await page.locator('.fight-fighter-meters.left .fight-health-track').getAttribute('aria-label');
    await page.keyboard.down('d');
    await step(1400);
    await page.keyboard.up('d');
    for (let frame = 0; frame < 5; frame++) {
      await step(400);
      const blocked = await page.evaluate(() => (window as unknown as { magicFeedback: string[] }).magicFeedback.some(text => text.startsWith('BLOCK')));
      if (blocked) break;
    }
    expect(await page.evaluate(() => (window as unknown as { magicFeedback: string[] }).magicFeedback)).toEqual(expect.arrayContaining([expect.stringMatching(/^BLOCK/)]));
    expect(await page.locator('.fight-fighter-meters.left .fight-health-track').getAttribute('aria-label')).toBe(health);
    await expect(shield).toBeVisible();
    await page.screenshot({ path: `artifacts/magic-gameplay/${element}-shield-${testInfo.project.name}.png` });
    await step(7000);
    await expect(shield).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
