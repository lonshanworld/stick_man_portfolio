import { expect, test } from '@playwright/test';
import { INITIAL_POPULATION_CONFIG } from '../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES, ALL_ELEMENTS } from '../data/stickManArchetypes';

test('seals hydrate consistently across floating-point differences', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (/hydrat|server rendered HTML/i.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => {
    const sin = Math.sin;
    Math.sin = value => sin(value) + Number.EPSILON;
  });
  await page.goto('/');
  // The world mounts after hydration, so this also waits for client rendering.
  await expect(page.locator('[id^="stickman-anchor-"]')).toHaveCount(28, { timeout: 20_000 });
  for (const selector of ['.folio-portal', '.folio-contact-seal']) {
    const markers = page.locator(`${selector} svg > g[fill="currentColor"] circle`);
    await expect(markers).toHaveCount(12);
    await expect(markers.last()).toHaveAttribute('cx', '132.50');
    await expect(markers.last()).toHaveAttribute('cy', '83.09');
  }
  expect(errors).toEqual([]);
});

test('the full portfolio stays usable with 28 characters and no background particles', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Lon Shan✳',
  );
  await expect(page.locator('[id^="stickman-anchor-"]')).toHaveCount(28, {
    timeout: 20_000,
  });
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas')).toHaveClass(/spell-world-canvas/);
  await expect(page.locator('.folio-section, .folio-contact')).toHaveCount(5);
  await expect(page.locator('.folio-nav')).toHaveCSS('border-bottom-width', '1px');
  await expect(page.getByRole('group', { name: 'Choose a magic element' })).toHaveCount(0);
  await page.locator('#stickman-anchor-ignis-hero').dispatchEvent('click');
  await expect(page.locator('main')).toHaveAttribute('data-realm', 'fire');
  await page.getByRole('button', { name: 'Conjure ignis magic' }).click();
  await expect(page.locator('.folio-cast-wave')).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  const mobile = testInfo.project.name.includes('mobile');
  if (mobile)
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await navigation.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(page).toHaveURL(/#projects$/);
  if (mobile)
    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toHaveAttribute('aria-expanded', 'false');

  await expect(page.locator('.folio-project')).toHaveCount(6);
  await expect(page.locator('.project-study')).toHaveCount(6);
  await page.getByRole('button', { name: 'Creative Dev', exact: true }).click();
  await expect(page.locator('.folio-project')).toHaveCount(1);
  await expect(page.locator('.folio-project h3')).toHaveText(
    'Elemental Stick Man Realm 3D',
  );
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('.folio-project')).toHaveCount(6);

  const notes = page.locator('.folio-project details').first();
  await notes.locator('summary').click();
  await expect(notes).toHaveAttribute('open', '');
  await expect(notes).toContainText('offline transaction queue');
  await notes.locator('summary').click();
  const experience = page.locator('.folio-experience details').first();
  await experience.locator('summary').click();
  await expect(experience).toContainText('35%');
  await expect(page.locator('.folio-skill-group li')).toHaveCount(15);

  await page.getByRole('button', { name: 'Smart Retail Project' }).click();
  await expect(page.locator('.folio-message.ai').last()).toContainText(
    'Business Central',
  );
  await page
    .getByRole('textbox', { name: 'Ask a question about Lon Shan' })
    .fill('Tell me about mobile engineering');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.locator('.folio-message.ai').last()).toContainText(
    'Flutter',
  );
  await page.getByRole('button', { name: 'How does the magic work?' }).click();
  await expect(page.locator('.folio-message.ai').last()).toContainText('original SVG seals');

  await page.getByRole('button', { name: 'Mute audio' }).click();
  await expect(
    page.getByRole('button', { name: 'Unmute audio' }),
  ).toBeVisible();
  await expect(page.locator('.folio-email')).toHaveAttribute(
    'href',
    'mailto:lonshan3010@gmail.com',
  );
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy email address' }).click();
  await expect(page.getByRole('status')).toHaveText('Email copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'lonshan3010@gmail.com',
  );

  await expect(page.locator('[id^="stickman-anchor-"]')).toHaveCount(28);
  expect(errors).toEqual([]);
});

test('narrow screens support keyboard navigation and readable content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#hero-title')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(
    page.getByRole('link', { name: 'Toolkit', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Open navigation' }),
  ).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  const email = await page.locator('.folio-email').boundingBox();
  expect(email).not.toBeNull();
  expect(email!.x + email!.width).toBeLessThanOrEqual(320);
});


test('every roaming stickman changes the full theme and all fourteen seals are distinct', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await expect(page.locator('[id^="stickman-anchor-"]')).toHaveCount(28, { timeout: 20_000 });
  const signatures = new Map<string, string>();
  const backgrounds = new Map<string, string>();
  const accents = new Map<string, string>();
  for (const character of INITIAL_POPULATION_CONFIG) {
    const anchor = page.locator(`#stickman-anchor-${character.id}`);
    await anchor.dispatchEvent('click');
    await expect(page.locator('main')).toHaveAttribute('data-realm', character.element);
    await expect(page.locator('.folio-portal svg')).toHaveAttribute('data-seal', character.element);
    await expect(page.locator('.folio-contact-seal svg')).toHaveAttribute('data-seal', character.element);
    await expect(page.locator('.folio-conjuring-caption')).toContainText(STICK_MAN_ARCHETYPES[character.element].title);
    const styles = await page.evaluate(() => {
      const main = getComputedStyle(document.querySelector('main')!);
      const nav = getComputedStyle(document.querySelector('.folio-nav')!);
      const card = getComputedStyle(document.querySelector('.folio-skill-group')!);
      return { bg: main.backgroundColor, accent: getComputedStyle(document.querySelector('.folio-portal')!).color,
        nav: nav.backgroundColor, card: card.backgroundImage };
    });
    backgrounds.set(character.element, styles.bg);
    accents.set(character.element, styles.accent);
    expect(styles.nav).not.toBe('rgba(0, 0, 0, 0)');
    expect(styles.card).toContain('gradient');
    signatures.set(character.element, await page.locator('.folio-portal .sigil-inner').innerHTML());
    await expect(anchor.locator('.character-spell-menu button')).toHaveCount(3);
    await expect(page.locator('main')).toHaveAttribute('data-realm', character.element);
    await page.keyboard.press('Escape');
  }
  expect(signatures.size).toBe(ALL_ELEMENTS.length);
  expect(new Set(signatures.values()).size).toBe(ALL_ELEMENTS.length);
  expect(new Set(backgrounds.values()).size).toBe(ALL_ELEMENTS.length);
  expect(new Set(accents.values()).size).toBe(ALL_ELEMENTS.length);
});
