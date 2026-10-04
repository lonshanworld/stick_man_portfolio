import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/magic-ui';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 820, 1180], ['mobile', 393, 852], ['narrow', 320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:3100');
    await page.locator('[id^="stickman-anchor-"]').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    await page.screenshot({ path: `${output}/${name}-full.png`, fullPage: true });
    for (const section of ['projects', 'experience', 'skills', 'ai-terminal', 'contact']) {
      await page.locator(`#${section}`).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${name}-${section}.png` });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(JSON.stringify({ name, width, overflow, errors }));
    if (overflow || errors.length) throw new Error(`UI capture failed: ${name}`);
    await page.close();
  }
} finally {
  await browser.close();
}
