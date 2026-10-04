import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { createElectricArc } from '../systems/electricArc';

type LightningPreviewWindow = Window & {getSpellPreviewCatalog:()=>{id:string;duration:number}[];setSpellPreviewFrame:(id:string,elapsed:number,heading:number)=>boolean;getActiveSpellCount:()=>number;getSpellPreviewState:()=>{caster:{pose?:{shielded?:boolean;kind?:string}};target?:{x:number;y:number;startX:number;startY:number;pose?:{kind?:string}}}};
test('electrical forks stay joined to changing leaders without replacing their geometry', () => {
  const leader = createElectricArc([0, 0, 0], [0, 80, 0], 3, 71);
  const fork = createElectricArc(t => leader.pointAt(.5, t), [23, 25, 0], 2, 29);
  const mesh = leader.root.children[0] as THREE.Mesh;
  const original = mesh.geometry.attributes.position;
  let first: number[] = [];
  for (const time of [.1, .25, .5, .8]) {
    leader.update(time); fork.update(time);
    expect(mesh.geometry.attributes.position).toBe(original);
    const position = (fork.root.children[0] as THREE.Mesh).geometry.attributes.position;
    const junction = leader.pointAt(.5, time);
    for (const [axis, value] of junction.entries()) {
      const center = (position.array[axis] + position.array[axis + 3]) / 2;
      expect(center).toBeCloseTo(value, 4);
    }
    if (!first.length) first = Array.from(original.array);
  }
  expect(Array.from(original.array)).not.toEqual(first);
  leader.root.traverse(node => { if (node instanceof THREE.Mesh) node.geometry.dispose(); });
  fork.root.traverse(node => { if (node instanceof THREE.Mesh) node.geometry.dispose(); });
  leader.material.dispose(); fork.material.dispose();
});

test('all three Lightning spells render through their phases, retain their powers, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as LightningPreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as LightningPreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('lightning-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as LightningPreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      if (progress === .5 && spell.id === 'lightning-chain-nova') {
        const state = await page.evaluate(() => (window as unknown as LightningPreviewWindow).getSpellPreviewState());
        expect(state.target?.pose?.kind).toBe('stunned');
      }
      await page.screenshot({ path: testInfo.outputPath(`${spell.id}-${Math.round(progress * 100)}.png`) });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as LightningPreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as LightningPreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as LightningPreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
