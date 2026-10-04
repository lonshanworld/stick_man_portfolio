import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const output = 'artifacts/robot-refactor';
await mkdir(output, { recursive: true });
const spells = [
  ['robot-hyper-beam', 'Twin Laser Lock', 'Armored cannons, cooling fins, square collimators and a bracketed target lock.'],
  ['robot-overclock-grid', 'Repair Drones', 'Quadrotor cameras, articulated welding tools and rectangular diagnostics.'],
  ['robot-missile-salvo', 'Micro-Missile Salvo', 'Steel fuselages, pointed noses, four tail fins, hot exhaust and compact orange impacts with smoke.'],
];
for (const device of ['desktop', 'mobile']) {
  const tiles = [];
  for (const [row, [id, name]] of spells.entries()) for (const [col, phase] of [18, 50, 70, 90].entries()) {
    const source = sharp(`${output}/${id}-${phase}-${device}-chromium.png`);
    const tile = await (device === 'desktop' ? source.extract({ left: 460, top: 120, width: 380, height: 320 }) : source)
      .resize(380, 320, { fit: 'contain', background: '#101016' }).toBuffer();
    const caption = Buffer.from(`<svg width="380" height="32"><rect width="380" height="32" fill="#25343F"/><text x="12" y="22" font-size="13" font-family="sans-serif" fill="#C5E6EA">${name} / ${phase}%</text></svg>`);
    tiles.push({ input: tile, left: col * 380, top: row * 352 }, { input: caption, left: col * 380, top: row * 352 + 320 });
  }
  await sharp({ create: { width: 1520, height: 1056, channels: 4, background: '#101016' } }).composite(tiles).png().toFile(`${output}/robot-${device}-phases.png`);
}
await writeFile(`${output}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus / AI Robot</title><style>body{background:#101016;color:#C5E6EA;font:16px system-ui;margin:32px}p{max-width:850px;line-height:1.6}img{max-width:100%;display:block;margin:16px 0}a{color:#37DFEA}section{margin:32px 0}</style><h1>Nexus / AI Robot</h1><p>Titanium armor, digital eyes, dark servo joints, processor telemetry and physical shoulder launch pods. Robot owns mechanical weapons and computer diagnostics instead of magical rings or elemental sheets.</p>${spells.map(([id, name, description]) => `<section><h2>${name}</h2><p>${description}</p><a href="${id}-50-desktop-chromium.png">Desktop active phase</a> · <a href="${id}-70-mobile-chromium.png">Mobile impact phase</a><p>Arena: <a href="${id}-arena-flight-desktop-chromium.png">desktop flight</a> ? <a href="${id}-arena-impact-mobile-chromium.png">mobile impact</a></p></section>`).join('')}<h2>Desktop phases</h2><img src="robot-desktop-phases.png" alt="All three robot spells, four phases each"><h2>Mobile phases</h2><img src="robot-mobile-phases.png" alt="Robot spell phases on mobile"></html>`);
console.log(`Robot review saved to ${output}/index.html`);
