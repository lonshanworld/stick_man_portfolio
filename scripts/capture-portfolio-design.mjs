import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Run against a running site: node scripts/capture-portfolio-design.mjs [URL]
const url = process.argv[2] || 'http://localhost:3000';
const output = 'artifacts/portfolio-design';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(url);
  await page.locator('[id^="stickman-anchor-"]').first().waitFor();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    const layout = await page.evaluate(() => {
      const title = document.createRange();
      title.selectNodeContents(document.querySelector('h1'));
      const heading = title.getBoundingClientRect();
      return {
        width: innerWidth,
        noOverflow: document.documentElement.scrollWidth <= innerWidth,
        headingFits: heading.left >= 0 && heading.right <= innerWidth,
        descriptionSize: getComputedStyle(document.querySelector('.folio-hero-description')).fontSize,
        projectGap: getComputedStyle(document.querySelector('.folio-projects')).columnGap,
      };
    });
    console.log(JSON.stringify(layout));
    if (!layout.noOverflow || !layout.headingFits) throw new Error(`Content overflows at ${width}px`);
    await page.screenshot({ path: `${output}/hero-${width}.png`, animations: 'disabled' });
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `${output}/full-${width}.png`, fullPage: true, animations: 'disabled' });
      for (const section of ['projects', 'experience', 'skills', 'ai-terminal', 'contact']) {
        await page.evaluate(id => {
          const section = document.getElementById(id);
          if (!section) throw new Error(`Missing section: ${id}`);
          window.scrollTo({ top: section.offsetTop - 88, behavior: 'instant' });
        }, section);
        await page.screenshot({ path: `${output}/${section}-${width}.png`, animations: 'disabled' });
      }
    }
  }
} finally {
  await browser.close();
}
