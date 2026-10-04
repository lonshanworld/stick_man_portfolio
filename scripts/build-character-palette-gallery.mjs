import { readdir, readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = path.resolve('artifacts/character-palettes');
await mkdir(output, { recursive: true });
const folders = [];
for (const folder of await readdir('test-results')) {
  if (folder.startsWith('character-palettes-') && (await readdir(path.join('test-results', folder))).includes('palettes-world-front.png')) folders.push(folder);
}
if (folders.length !== 2) throw new Error('Run the character palette browser tests on desktop and mobile first.');
const shots = [];
for (const lighting of ['world', 'arena']) for (const view of ['front', 'turned']) {
  for (const device of ['desktop', 'mobile']) {
    const folder = folders.find(folder => folder.endsWith(`${device}-chromium`));
    if (!folder) throw new Error(`Missing ${device} character captures.`);
    const filename = `palettes-${lighting}-${view}-${device}.png`;
    await copyFile(path.join('test-results', folder, `palettes-${lighting}-${view}.png`), path.join(output, filename));
    shots.push({ lighting, view, device, filename });
  }
}
const source = await readFile('data/elementPalettes.ts', 'utf8');
const palettes = [...source.matchAll(/  (\w+): \{ name: '([^']+)', primary: '(#[A-F0-9]+)'(?:, body: '(#[A-F0-9]+)')?, secondary: '(#[A-F0-9]+)'/g)]
  .map(([, element, name, primary, body, secondary]) => ({ element, name, body: body ?? primary, secondary }));
if (palettes.length !== 14) throw new Error('Expected all fourteen palette definitions.');
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fourteen spirit character palettes</title>
<style>body{margin:0;padding:32px;background:#080d17;color:#e9eef8;font:15px system-ui}p{color:#aebbd0}h1{font-size:30px}.swatches{display:grid;grid-template-columns:repeat(7,1fr);gap:12px}.swatch{background:#151e30;border:1px solid #2b3852;border-radius:12px;padding:14px}.colors{display:flex;margin:12px 0;height:38px;border-radius:6px;overflow:hidden}.colors span:first-child{flex:3}.colors span:last-child{flex:1}small{display:block;margin-top:5px;color:#b8c6dd}section{margin-top:36px}.shots{display:grid;grid-template-columns:3fr 1fr;gap:16px;align-items:start}figure{margin:0;background:#151e30;border-radius:10px;overflow:hidden}img{width:100%;display:block}figcaption{padding:12px;font-size:12px}@media(max-width:800px){body{padding:16px}.swatches{grid-template-columns:repeat(2,1fr)}.shots{grid-template-columns:1fr}}</style>
<h1>Spirit character colors</h1><p>Fourteen distinct body palettes, captured with the production models under world and arena lighting. Dark represents darkness and mortality; Void represents the abyss.</p>
<div class="swatches">${palettes.map(palette => `<article class="swatch"><strong>${palette.element.toUpperCase()}</strong><small>${palette.name}</small><div class="colors"><span style="background:${palette.body}"></span><span style="background:${palette.secondary}"></span></div><small>Body ${palette.body}</small><small>Accent ${palette.secondary}</small></article>`).join('')}</div>
${['world', 'arena'].flatMap(lighting => ['front', 'turned'].map(view => `<section><h2>${lighting === 'world' ? 'World' : 'Arena'} lighting / ${view}</h2><div class="shots">${shots.filter(shot => shot.lighting === lighting && shot.view === view).map(shot => `<figure><img src="${shot.filename}" alt="All fourteen characters, ${lighting} lighting, ${view} view, ${shot.device}"><figcaption>${shot.device}</figcaption></figure>`).join('')}</div></section>`)).join('')}</html>`);
console.log(`Saved 8 character lineups and 14 palette swatches to ${output}`);
