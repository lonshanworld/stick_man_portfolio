import { expect, test } from '@playwright/test';
import { INITIAL_POPULATION_CONFIG } from '../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';

const FIRST = '#stickman-anchor-ignis-hero';
const SECOND = '#stickman-anchor-zephyr-hero';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0.99;
    window.sessionStorage.removeItem('stickman_visit_dialogue_deck');
  });
  await page.goto('/');
  await expect(page.locator(FIRST)).toBeAttached({ timeout: 30_000 });
});

test('a nearby pair has a visible, turn-based conversation', async ({ page }) => {
  const thread = page.locator('.dialogue-thread[role="log"]');

  await expect(thread).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('.dialogue-thread')).toHaveCount(1);
  await expect(page.locator('.character-speech-bubble')).toHaveCount(0);
  await expect(thread.locator('.dialogue-thread-header, .dialogue-thread-participants, .dialogue-thread-footer')).toHaveCount(0);
  const heroes = INITIAL_POPULATION_CONFIG.filter(character => character.district === 0)
    .map(character => ({ id: character.id, name: STICK_MAN_ARCHETYPES[character.element].name }));
  // Read the active pair, messages, and geometry in one browser task. A new
  // conversation can replace the old one between separate Playwright calls.
  await expect.poll(() => page.evaluate((characters) => {
    const conversation = document.querySelector('.dialogue-thread[role="log"]');
    if (!conversation) return null;
    const names = conversation.getAttribute('aria-label')!.replace(/ conversation$/, '').split(' and ');
    const boxes = names.map(name => {
      const character = characters.find(item => item.name === name);
      return character && document.getElementById(`stickman-anchor-${character.id}`)?.getBoundingClientRect();
    });
    const [first, second] = boxes;
    if (!first || !second) return null;
    const threadBox = conversation.getBoundingClientRect();
    const messages = conversation.querySelectorAll('.dialogue-message');
    return {
      turns: messages.length,
      bothSpeakers: names.every(name => Array.from(messages).some(message => message.querySelector('strong')?.textContent?.endsWith(name))),
      nearby: Math.hypot(first.x - second.x, first.y - second.y) < 100,
      centered: Math.abs(threadBox.x + threadBox.width / 2 - (first.x + second.x) / 2) < 90,
      above: Math.abs(threadBox.bottom - Math.min(first.y, second.y)) < 90,
    };
  }, heroes), { timeout: 8_000 }).toEqual({ turns: 2, bothSpeakers: true, nearby: true, centered: true, above: true });
});

test('clicking two heroes opens the player-vs-AI fighter picker', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });

  await page.locator(SECOND).dispatchEvent('click');

  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Choose a fighter' })).toBeDisabled();
  await expect(page.getByRole('radio', { name: /Ventus/ })).toBeVisible();
});

test('choosing a fighter launches the arena with the other hero as AI', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();

  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-touch-controls')).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
});

test('arena spell casts render the hand-mounted magic seal', async ({ page }, testInfo) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.fight-intro')).toHaveCount(0, { timeout: 20_000 });

  const spellButton = page.getByRole('button', { name: 'Cast Tornado Gale' });
  await spellButton.dispatchEvent('pointerdown');
  await expect(spellButton).toBeDisabled({ timeout: 3_000 });
  await page.screenshot({ path: testInfo.outputPath('arena-hand-magic-seal.png') });
});

test('canceling the arena returns the heroes to the world', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator(`${FIRST} .fight-opponent-prompt`)).toBeVisible({ timeout: 5_000 });
  await page.locator(SECOND).dispatchEvent('click');
  await expect(page.locator('.fight-confirmation-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByRole('radio', { name: /Ventus/ }).click();
  await page.getByRole('button', { name: 'Start as Ventus' }).click();
  await expect(page.locator('.fight-arena')).toBeVisible({ timeout: 10_000 });

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: 'Fight paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to portfolio' }).click();
  await expect(page.locator('.fight-arena')).toHaveCount(0);
  await expect(page.locator(FIRST)).toBeAttached();
  await expect(page.locator(SECOND)).toBeAttached();
});

test('random combat and bullying encounters remain paused', async ({ page }) => {
  await page.waitForTimeout(2_000);
  await expect(page.locator('.fight-opponent-prompt')).toHaveCount(0);
  await expect(page.locator('.fight-confirmation-panel')).toHaveCount(0);
  await expect(page.locator('.fight-arena')).toHaveCount(0);
  await expect(page.getByText(/Sneaking Up|BOO! PRANKED|STARTLED|Prank \/ Bully/i)).toHaveCount(0);
});

test('one click changes theme and opens three clean spells with an opponent footer', async ({ page }, testInfo) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator('main')).toHaveAttribute('data-realm', 'fire');
  const menu = page.locator(`${FIRST} .character-spell-menu`);
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await expect(menu.getByRole('button')).toHaveCount(3);
  await expect(menu.locator('button svg')).toHaveCount(3);
  await expect(menu.locator('button p')).toHaveCount(0);
  expect(await menu.locator('button').evaluateAll(buttons => buttons.every(button => {
    const rect = button.getBoundingClientRect();
    return button.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
  }))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('single-tap-menu.png') });
  await expect(menu.locator('.fight-opponent-prompt')).toHaveText('Choose an opponent within 5 seconds');
  await expect(page.locator('.character-speech-bubble, .dialogue-thread')).toHaveCount(0);
  await page.locator(FIRST).dispatchEvent('dblclick');
  await expect(menu).toBeVisible();
  await expect(page.locator('.fight-confirmation-panel')).toHaveCount(0);
  await expect(menu).toHaveCount(0, { timeout: 7_000 });
});

test('casting from the single-click menu closes opponent selection', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await page.locator(`${FIRST} .character-spell-menu button`).first().click();
  await expect(page.locator('.character-spell-menu, .fight-opponent-prompt')).toHaveCount(0);
  await expect(page.locator('.fight-confirmation-panel')).toHaveCount(0);
});

test('background click and Escape dismiss the combined spell menu', async ({ page }) => {
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator('.character-spell-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.character-spell-menu')).toHaveCount(0);
  await page.locator(FIRST).dispatchEvent('click');
  await expect(page.locator('.character-spell-menu')).toBeVisible();
  await page.locator('main').dispatchEvent('click');
  await expect(page.locator('.character-spell-menu')).toHaveCount(0);
});
