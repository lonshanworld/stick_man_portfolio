import { readdir, readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const output = path.join(root, 'artifacts', 'magic-power');
await mkdir(output, { recursive: true });
const folders = await readdir(path.join(root, 'test-results'));
const desktopOnly = process.argv.includes('--desktop-only');
const reuseArtifacts = process.argv.includes('--from-artifacts');
const captures = folders.filter(name => name.startsWith('spell-visual-captures-all-') &&
  (desktopOnly ? /desktop-chromium$/.test(name) : /(?:desktop|mobile)-chromium$/.test(name)));
if (!reuseArtifacts && captures.length !== (desktopOnly ? 1 : 2)) throw new Error('Run npm run test:spells first: complete screenshot captures are required.');
const schools = ['fire', 'water', 'lightning', 'ice', 'wind', 'soil', 'trees', 'dark', 'light', 'space', 'time', 'robot', 'healing', 'void'];
const catalogSource = await readFile(path.join(root, 'data', 'elementalSpells.ts'), 'utf8');
const spells = [...catalogSource.matchAll(/id: '([^']+)',\s+element: '[^']+',\s+name: '([^']+)'/g)]
  .map(([, id, name]) => ({ id, name, school: id.split('-')[0] }));
if (spells.length !== 42) throw new Error('Expected the complete catalog of 42 spells.');
const iconSource = await readFile(path.join(root, 'components', 'ui', 'SpellIcon.tsx'), 'utf8');
const glyphs = new Map([...iconSource.matchAll(/'([^']+)': '([^']+)'/g)].map(([, id, glyph]) => [id, glyph]));
if (spells.some(spell => !glyphs.has(spell.id)) || new Set(glyphs.values()).size !== 42)
  throw new Error('Every ability must have its own complete, unique glyph.');
for (const folder of reuseArtifacts ? [] : captures) {
  const device = folder.endsWith('mobile-chromium') ? 'mobile' : 'desktop';
  for (const spell of spells) await copyFile(path.join(root, 'test-results', folder, `${spell.id}.png`), path.join(output, `${spell.id}-${device}.png`));
}

// Screenshot contact sheets let reviewers assess every school side by side.
for (const device of desktopOnly ? ['desktop'] : ['desktop', 'mobile']) for (let half = 0; half < 2; half++) {
  const subset = spells.filter(spell => schools.slice(half * 7, half * 7 + 7).includes(spell.school));
  const tiles = [];
  for (let i = 0; i < subset.length; i++) {
    const spell = subset[i];
    const source = sharp(path.join(output, `${spell.id}-${device}.png`));
    const screenshot = await (device === 'desktop'
      ? source.extract({ left: 320, top: 40, width: 640, height: 470 }).resize(400, 294)
      : source.resize(400, 294, { fit: 'contain', background: '#070a12' })).toBuffer();
    const caption = Buffer.from(`<svg width="400" height="36"><rect width="400" height="36" fill="#101522"/><text x="14" y="23" fill="#e3e8f0" font-size="13" font-family="sans-serif">${spell.name}</text></svg>`);
    tiles.push({ input: screenshot, left: (i % 3) * 400, top: Math.floor(i / 3) * 330 });
    tiles.push({ input: caption, left: (i % 3) * 400, top: Math.floor(i / 3) * 330 + 294 });
  }
  await sharp({ create: { width: 1200, height: 2310, channels: 4, background: '#070a12' } }).composite(tiles).png().toFile(path.join(output, `spell-atlas-${device === 'desktop' ? '' : 'mobile-'}${half + 1}.png`));
}

const cards = schools.map(school => `<section><h2>${school}</h2><div class="spells">${spells.filter(spell => spell.school === school).map(spell => `<article><h3>${spell.name}</h3><div class="screens"><img src="${spell.id}-desktop.png" alt="${spell.name}, desktop">${desktopOnly ? '' : `<img class="mobile" src="${spell.id}-mobile.png" alt="${spell.name}, mobile">`}</div></article>`).join('')}</div></section>`).join('');
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Elemental magic — all 42 abilities</title><style>body{margin:0;padding:32px;background:#070a12;color:#e4e9f2;font-family:system-ui}h1{font-size:28px;margin-bottom:8px}p{color:#96a3b7}h2{text-transform:uppercase;font-size:15px;letter-spacing:.2em;margin-top:48px}h3{font-size:14px;margin:16px}.spells{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}article{border:1px solid #263044;border-radius:12px;overflow:hidden;background:#101522}.screens{display:flex;align-items:center}img{width:73%;height:auto;display:block}.mobile{width:27%}@media(max-width:900px){.spells{grid-template-columns:1fr}body{padding:16px}}</style><h1>Elemental magic &amp; power</h1><p>All 14 schools · 42 unique abilities · desktop and mobile · captured at 50% duration.</p>${cards}</html>`);
console.log(`Saved ${desktopOnly ? 42 : 84} screenshots, ${desktopOnly ? 'two' : 'four'} contact sheets, and a review gallery to ${output}`);
