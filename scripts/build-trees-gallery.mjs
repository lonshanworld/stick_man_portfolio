import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd(), output = path.join(root, 'artifacts', 'trees-refactor');
await mkdir(output, { recursive: true });
const spells = [
  { id: 'trees-root-entanglement', name: 'Root Entanglement', detail: 'Woody roots branch across the ground before curling into a leafy grip around the target.' },
  { id: 'trees-spore-bloom', name: 'Heartwood Grove', detail: 'Three branching saplings unfold leaf canopies and release restorative amber sap pollen.' },
  { id: 'trees-ironwood-slam', name: 'Ancient Arbor', detail: 'Two rooted trees interweave their thick boughs into a living timber vault, with leaf canopies and falling foliage.' },
];
const phases = [{ p: 18, name: 'Formation' }, { p: 50, name: 'Active' }, { p: 70, name: 'Living Form' }, { p: 90, name: 'Leaf Fall' }];
const arenaPhases = ['sprout', 'grow', 'canopy', 'release'];
const sourceFolders = (await readdir(path.join(root, 'test-results'))).filter(name => name.startsWith('trees-visual-all-three-'));
const arenaFolders = (await readdir(path.join(root, 'test-results-arena'))).filter(name => name.startsWith('trees-arena-Groot-'));
if (sourceFolders.length !== 2 || arenaFolders.length !== 2) throw new Error('Run Trees visual and arena tests on both desktop and mobile first.');

for (const device of ['desktop', 'mobile']) {
  const source = sourceFolders.find(name => name.endsWith(`${device}-chromium`));
  const arena = arenaFolders.find(name => name.endsWith(`${device}-chromium`));
  if (!source || !arena) throw new Error(`Missing ${device} captures.`);
  for (const spell of spells) {
    for (const phase of phases) await copyFile(path.join(root, 'test-results', source, `${spell.id}-${phase.p}.png`), path.join(output, `${spell.id}-${phase.p}-${device}.png`));
    for (const phase of arenaPhases) await copyFile(path.join(root, 'test-results-arena', arena, `${spell.id}-arena-${phase}.png`), path.join(output, `${spell.id}-arena-${phase}-${device}.png`));
  }
  for (const mode of ['world', 'arena']) {
    const tiles = [];
    for (const [row, spell] of spells.entries()) for (let col = 0; col < 4; col++) {
      const file = mode === 'world' ? `${spell.id}-${phases[col].p}-${device}.png` : `${spell.id}-arena-${arenaPhases[col]}-${device}.png`;
      const source = sharp(path.join(output, file));
      const screenshot = await (device === 'desktop' && mode === 'world'
        ? source.extract({ left: 320, top: 40, width: 640, height: 470 }).resize(360, 264)
        : source.resize(360, 264, { fit: 'contain', background: '#0D150E' })).toBuffer();
      const caption = Buffer.from(`<svg width="360" height="34"><rect width="360" height="34" fill="#1D2E20"/><text x="12" y="22" fill="#E0ECD0" font-size="12" font-family="sans-serif">${spell.name} / ${mode === 'world' ? phases[col].name : arenaPhases[col]}</text></svg>`);
      tiles.push({ input: screenshot, left: col * 360, top: row * 298 }, { input: caption, left: col * 360, top: row * 298 + 264 });
    }
    await sharp({ create: { width: 1440, height: 894, channels: 4, background: '#0D150E' } }).composite(tiles).png().toFile(path.join(output, `trees-${mode}-${device}-phases.png`));
  }
}
const figure = (file, label) => `<figure><img loading="lazy" src="${file}-desktop.png" alt="${label}, desktop"><figcaption>${label}</figcaption><img class="mobile" loading="lazy" src="${file}-mobile.png" alt="${label}, mobile"></figure>`;
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trees and Living Wood / Groot</title><style>body{margin:0;padding:32px;background:#0D150E;color:#E0ECD0;font:15px system-ui}h1{font-size:32px}p{color:#A6BD97;max-width:850px;line-height:1.6}section{margin-top:40px}h2{font-size:21px}.phases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;background:#1D2E20;border:1px solid #3A593E;border-radius:10px;overflow:hidden}figcaption{padding:12px;font-size:12px}img{width:100%;display:block}.mobile{max-width:180px;margin:auto}a{color:#AAD777}@media(max-width:800px){body{padding:16px}.phases{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Trees and Living Wood / Groot</h1><p>Carved cedar bark, tapering woody roots, branching trunks, leaf veins, sap pollen, and swaying foliage. Groot wears a living branch crown and rooted toes. Each spell has its own growth sequence and planted gesture: sowing and gripping, nurturing a grove, or raising a protective canopy.</p>${spells.map(spell => `<section><h2>${spell.name}</h2><p>${spell.detail}</p><div class="phases">${phases.map(phase => figure(`${spell.id}-${phase.p}`, phase.name)).join('')}</div><h3>Real arena cast</h3><div class="phases">${arenaPhases.map(phase => figure(`${spell.id}-arena-${phase}`, phase)).join('')}</div></section>`).join('')}<section><h2>Contact sheets</h2>${['world', 'arena'].map(mode => `<p><a href="trees-${mode}-desktop-phases.png">${mode} / desktop</a> · <a href="trees-${mode}-mobile-phases.png">${mode} / mobile</a></p>`).join('')}</section></html>`);
console.log(`Saved 48 phase screenshots, four contact sheets, and the Trees/Living Wood review to ${output}`);
