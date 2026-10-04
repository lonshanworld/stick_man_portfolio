import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd(), output = path.join(root, 'artifacts', 'lightning-refactor');
await mkdir(output, { recursive: true });
const folders = (await readdir(path.join(root, 'test-results'))).filter(folder => folder.startsWith('lightning-visual-all-three-'));
if (folders.length !== 2) throw new Error('Run the Lightning visual tests on desktop and mobile before building the review.');
const spells = [
  { id: 'lightning-thunderbolt', name: 'Thunderbolt Strike', detail: 'Staggered sky leaders, connected forks, ground discharges.' },
  { id: 'lightning-plasma-railgun', name: 'Sparkbolt Barrage', detail: 'Nine jagged electrical lances, blue coronas, forked wakes.' },
  { id: 'lightning-chain-nova', name: 'Arc Snare', detail: 'Six conductive anchors, inward currents, pulsing arc cage.' },
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
      : source.resize(360, 264, { fit: 'contain', background: '#080610' })).toBuffer();
    const caption = Buffer.from(`<svg width="360" height="34"><rect width="360" height="34" fill="#151020"/><text x="12" y="22" fill="#e9d8ef" font-size="12" font-family="sans-serif">${spell.name} — ${phase.name}</text></svg>`);
    tiles.push({ input: screenshot, left: col * 360, top: row * 298 });
    tiles.push({ input: caption, left: col * 360, top: row * 298 + 264 });
    if (phase.p === 50) await copyFile(path.join(output, name), path.join(root, 'artifacts', 'magic-power', `${spell.id}-${device}.png`));
  }
  await sharp({ create: { width: 1440, height: 894, channels: 4, background: '#080610' } }).composite(tiles).png().toFile(path.join(output, `lightning-${device}-phases.png`));
}
const arenaFolders = (await readdir(path.join(root, 'test-results-arena')).catch(() => []))
  .filter(folder => folder.startsWith('lightning-arena-Volt-'));
let arenaSection = '';
if (arenaFolders.length === 2) {
  for (const device of ['desktop', 'mobile']) {
    const folder = arenaFolders.find(folder => folder.endsWith(`${device}-chromium`));
    for (const spell of spells) await copyFile(
      path.join(root, 'test-results-arena', folder, `${spell.id}-arena.png`),
      path.join(output, `${spell.id}-arena-${device}.png`));
  }
  arenaSection = `<section><h2>Volt in the arena</h2><div class="phases">${spells.map(spell =>
    `<figure><img loading="lazy" src="${spell.id}-arena-desktop.png" alt="${spell.name} in the arena"><figcaption>${spell.name}</figcaption><img class="mobile" loading="lazy" src="${spell.id}-arena-mobile.png" alt="${spell.name} in the mobile arena"></figure>`).join('')}</div></section>`;
}
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lightning — refactored abilities</title><style>body{margin:0;padding:32px;background:#080610;color:#ebdfef;font:15px system-ui}h1{font-size:32px}p{color:#b8a2c2}section{margin-top:40px}h2{font-size:21px}.phases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;background:#151020;border:1px solid #36243d;border-radius:10px;overflow:hidden}figcaption{padding:12px;font-size:12px;color:#ddbae8}img{width:100%;display:block}.mobile{max-width:180px;margin:auto}@media(max-width:800px){body{padding:16px}.phases{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Lightning / Volt</h1><p>White hot leaders, blue coronas, amber discharges, and rapid restrikes. Three different silhouettes and three distinct animation sequences.</p>${spells.map(spell => `<section><h2>${spell.name}</h2><p>${spell.detail}</p><div class="phases">${phases.map(phase => `<figure><img loading="lazy" src="${spell.id}-${phase.p}-desktop.png" alt="${spell.name}, ${phase.name}, desktop"><figcaption>${phase.name}</figcaption><img class="mobile" loading="lazy" src="${spell.id}-${phase.p}-mobile.png" alt="${spell.name}, ${phase.name}, mobile"></figure>`).join('')}</div></section>`).join('')}${arenaSection}</html>`);
console.log(`Saved 24 phase screenshots and desktop/mobile contact sheets to ${output}`);
