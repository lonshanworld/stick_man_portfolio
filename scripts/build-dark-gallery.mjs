import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd(), output = path.join(root, 'artifacts', 'dark-refactor');
await mkdir(output, { recursive: true });
const spells = [
  { id: 'dark-abyssal-grasp', name: 'Abyssal Grasp', detail: 'Three jointed skeletal shadow hands rise and close around the target, with hooded death-mask revenants and drifting grave ash.' },
  { id: 'dark-phantom-wave', name: 'Phantom Bat Swarm', detail: 'The original seven bats now have cambered, scalloped wing membranes, articulated wing bones, cold soul eyes and flowing shadow wakes.' },
  { id: 'dark-eclipse-nova', name: 'Dread Sovereign', detail: 'A towering armored skeletal guardian with sweeping bone horns, a spiked cuirass, curved ribs, crushing fists and restrained soul light.' },
];
const phases = [{ p: 18, name: 'Formation' }, { p: 50, name: 'Active' }, { p: 70, name: 'Shadow Form' }, { p: 90, name: 'Dissolution' }];
const arenaPhases = ['emergence', 'active', 'linger', 'dissolve'];
const sourceFolders = (await readdir(path.join(root, 'test-results'))).filter(name => name.startsWith('dark-visual-all-three-'));
const arenaResultDirectory = (await readdir(path.join(root, 'test-results'))).some(name => name.startsWith('dark-arena-Umbra-')) ? 'test-results' : 'test-results-arena';
const arenaFolders = (await readdir(path.join(root, arenaResultDirectory))).filter(name => name.startsWith('dark-arena-Umbra-'));
if (sourceFolders.length !== 2 || arenaFolders.length !== 2) throw new Error('Run Dark visual and arena tests on both desktop and mobile first.');

for (const device of ['desktop', 'mobile']) {
  const source = sourceFolders.find(name => name.endsWith(`${device}-chromium`));
  const arena = arenaFolders.find(name => name.endsWith(`${device}-chromium`));
  if (!source || !arena) throw new Error(`Missing ${device} captures.`);
  for (const spell of spells) {
    for (const phase of phases) await copyFile(path.join(root, 'test-results', source, `${spell.id}-${phase.p}.png`), path.join(output, `${spell.id}-${phase.p}-${device}.png`));
    for (const phase of arenaPhases) await copyFile(path.join(root, arenaResultDirectory, arena, `${spell.id}-arena-${phase}.png`), path.join(output, `${spell.id}-arena-${phase}-${device}.png`));
  }
  await copyFile(path.join(root, arenaResultDirectory, arena, 'dark-eclipse-nova-arena-cloaked.png'), path.join(output, `dark-eclipse-nova-arena-cloaked-${device}.png`));
  for (const mode of ['world', 'arena']) {
    const tiles = [];
    for (const [row, spell] of spells.entries()) for (let col = 0; col < 4; col++) {
      const file = mode === 'world' ? `${spell.id}-${phases[col].p}-${device}.png` : `${spell.id}-arena-${arenaPhases[col]}-${device}.png`;
      const source = sharp(path.join(output, file));
      const screenshot = await (device === 'desktop' && mode === 'world'
        ? source.extract({ left: 320, top: 40, width: 640, height: 470 }).resize(360, 264)
        : source.resize(360, 264, { fit: 'contain', background: '#0C1118' })).toBuffer();
      const caption = Buffer.from(`<svg width="360" height="34"><rect width="360" height="34" fill="#202A32"/><text x="12" y="22" fill="#D6DDD7" font-size="12" font-family="sans-serif">${spell.name} / ${mode === 'world' ? phases[col].name : arenaPhases[col]}</text></svg>`);
      tiles.push({ input: screenshot, left: col * 360, top: row * 298 }, { input: caption, left: col * 360, top: row * 298 + 264 });
    }
    await sharp({ create: { width: 1440, height: 894, channels: 4, background: '#0C1118' } }).composite(tiles).png().toFile(path.join(output, `dark-${mode}-${device}-phases.png`));
  }
}
const figure = (file, label) => `<figure><img loading="lazy" src="${file}-desktop.png" alt="${label}, desktop"><figcaption>${label}</figcaption><img class="mobile" loading="lazy" src="${file}-mobile.png" alt="${label}, mobile"></figure>`;
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dark and Mortality / Umbra</title><style>body{margin:0;padding:32px;background:#0C1118;color:#D6DDD7;font:15px system-ui}h1{font-size:32px}p{color:#A1B1AE;max-width:850px;line-height:1.6}section{margin-top:40px}h2{font-size:21px}.phases{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}figure{margin:0;background:#202A32;border:1px solid #465652;border-radius:10px;overflow:hidden}figcaption{padding:12px;font-size:12px}img{width:100%;display:block}.mobile{max-width:180px;margin:auto}a{color:#B8CEC2}@media(max-width:800px){body{padding:16px}.phases{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>Dark and Mortality / Umbra</h1><p>Charcoal shadow, bone details, spectral smoke, torn cloth and faint soul light. Umbra wears curved reaper horns, grave wisps and a swaying shoulder mantle. The bat swarm is preserved and refined. Each spell has a distinct grounded gesture: grasping, beckoning the swarm, or raising the sovereign.</p>${spells.map(spell => `<section><h2>${spell.name}</h2><p>${spell.detail}</p><div class="phases">${phases.map(phase => figure(`${spell.id}-${phase.p}`, phase.name)).join('')}</div>${spell.id === 'dark-eclipse-nova' ? `<h3>Invulnerable cloak beat</h3>${figure('dark-eclipse-nova-arena-cloaked', 'Umbra disappears inside the sovereign ward')}` : ''}<h3>Real arena cast</h3><div class="phases">${arenaPhases.map(phase => figure(`${spell.id}-arena-${phase}`, phase)).join('')}</div></section>`).join('')}<section><h2>Contact sheets</h2>${['world', 'arena'].map(mode => `<p><a href="dark-${mode}-desktop-phases.png">${mode} / desktop</a> · <a href="dark-${mode}-mobile-phases.png">${mode} / mobile</a></p>`).join('')}</section></html>`);
console.log(`Saved 50 phase screenshots, four contact sheets, and the Dark/Mortality review to ${output}`);
