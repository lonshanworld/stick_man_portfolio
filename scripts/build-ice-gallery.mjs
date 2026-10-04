import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd(), output = path.join(root, 'artifacts', 'ice-refactor');
await mkdir(output, { recursive: true });
const folders = (await readdir(path.join(root, 'test-results'))).filter(folder => folder.startsWith('ice-visual-all-three-'));
if (folders.length !== 2) throw new Error('Run the Ice visual tests on desktop and mobile before building the review.');
const spells = [
  { id: 'ice-glacial-spikes', name: 'Glacial Ice Spikes', detail: 'Grounded six-sided crystal clusters erupt through branching frost.' },
  { id: 'ice-blizzard-vortex', name: 'Frost Mirror', detail: 'Seven beveled hexagonal plates assemble into a thick frozen shield.' },
  { id: 'ice-absolute-zero', name: 'Snowflake Prison', detail: 'Six glacial pillars rise from a frost lattice and close around the target.' },
];
const phases = [{ p: 18, name: 'Wind-up' }, { p: 50, name: 'Climax' }, { p: 70, name: 'Collapse' }, { p: 90, name: 'Release' }];
for (const device of ['desktop', 'mobile']) {
  const folder = folders.find(folder => folder.endsWith(`${device}-chromium`));
  if (!folder) throw new Error(`Missing ${device} previews.`);
  const tiles = [];
  for (let row = 0; row < spells.length; row++) for (let col = 0; col < phases.length; col++) {
    const spell = spells[row], phase = phases[col];
    const name = `${spell.id}-${phase.p}-${device}.png`;
    await copyFile(path.join(root, 'test-results', folder, `${spell.id}-${phase.p}.png`), path.join(output, name));
    const source = sharp(path.join(output, name));
    const screenshot = await (device === 'desktop'
      ? source.extract({ left: 320, top: 40, width: 640, height: 470 }).resize(360, 264)
      : source.resize(360, 264, { fit: 'contain', background: '#08111e' })).toBuffer();
    const caption = Buffer.from(`<svg width="360" height="34"><rect width="360" height="34" fill="#111e31"/><text x="12" y="22" fill="#e5f1ff" font-size="12" font-family="sans-serif">${spell.name} — ${phase.name}</text></svg>`);
    tiles.push({ input: screenshot, left: col * 360, top: row * 298 });
    tiles.push({ input: caption, left: col * 360, top: row * 298 + 264 });
    if (phase.p === 50) await copyFile(path.join(output, name), path.join(root, 'artifacts', 'magic-power', `${spell.id}-${device}.png`));
  }
  await sharp({ create: { width: 1440, height: 894, channels: 4, background: '#08111e' } }).composite(tiles).png().toFile(path.join(output, `ice-${device}-phases.png`));
}
const arenaFolders = (await readdir(path.join(root, 'test-results-arena')).catch(() => []))
  .filter(folder => folder.startsWith('ice-arena-Glacies-'));
let arenaSection = '';
if (arenaFolders.length === 2) {
  for (const device of ['desktop', 'mobile']) {
    const folder = arenaFolders.find(folder => folder.endsWith(`${device}-chromium`));
    for (const spell of spells) await copyFile(
      path.join(root, 'test-results-arena', folder, `${spell.id}-arena.png`),
      path.join(output, `${spell.id}-arena-${device}.png`));
  }
  arenaSection = `<section><h2>Glacies in the arena</h2><div class="phases">${spells.map(spell =>
    `<figure><img loading="lazy" src="${spell.id}-arena-desktop.png" alt="${spell.name} in the arena"><figcaption>${spell.name}</figcaption><img class="mobile" loading="lazy" src="${spell.id}-arena-mobile.png" alt="${spell.name} in the mobile arena"></figure>`).join('')}</div></section>`;
}
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ice — refactored abilities</title><style>body{margin:0;padding:32px;background:#08111e;color:#e5f1ff;font:15px system-ui}h1{font-size:32px}p{color:#a8bdd7}section{margin-top:40px}h2{font-size:21px}.phases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;background:#111e31;border:1px solid #304763;border-radius:10px;overflow:hidden}figcaption{padding:12px;font-size:12px;color:#c9ddf5}img{width:100%;display:block}.mobile{max-width:180px;margin:auto}@media(max-width:800px){body{padding:16px}.phases{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Ice / Glacies</h1><p>Solid blue ice facets, frosted white edges, sixfold crystal growth, and gently falling shavings. Three distinct silhouettes and animation sequences.</p>${spells.map(spell => `<section><h2>${spell.name}</h2><p>${spell.detail}</p><div class="phases">${phases.map(phase => `<figure><img loading="lazy" src="${spell.id}-${phase.p}-desktop.png" alt="${spell.name}, ${phase.name}, desktop"><figcaption>${phase.name}</figcaption><img class="mobile" loading="lazy" src="${spell.id}-${phase.p}-mobile.png" alt="${spell.name}, ${phase.name}, mobile"></figure>`).join('')}</div></section>`).join('')}${arenaSection}</html>`);
console.log(`Saved 24 phase screenshots and desktop/mobile contact sheets to ${output}`);
