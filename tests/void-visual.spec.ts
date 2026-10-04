import { expect, test } from '@playwright/test';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { SPELL_BUILDERS } from '../systems/spellEffectSystem';
import * as THREE from 'three';

type VoidPreviewWindow = Window & {
  getSpellPreviewCatalog: () => { id: string; duration: number }[];
  setSpellPreviewFrame: (id: string, elapsed: number, heading: number) => boolean;
  getActiveSpellCount: () => number;
  getSpellPreviewState: () => { target?: { silenced: boolean; x: number; y: number; startX: number; startY: number } };
};

test('Void owns three distinct aperture designs and keeps its breach open through the climax', () => {
  const designs = new Set<string>();
  for (const spell of ELEMENTAL_SPELLS.void) {
    const effect = SPELL_BUILDERS[spell.id](spell, 0, 190);
    designs.add(effect.root.userData.voidDesign);
    const surfaces: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
    effect.root.traverse(node => {
      if (node instanceof THREE.Mesh && node.name.startsWith('void-') && node.material instanceof THREE.ShaderMaterial) surfaces.push(node);
    });
    expect(surfaces.length).toBeGreaterThan(0);
    effect.update(0, spell.duration * .5, spell.duration);
    expect(surfaces.every(surface => surface.material.uniforms.uOpacity.value > .9)).toBe(true);
    if (spell.id === 'void-catastrophic-collapse') {
      expect(surfaces[0].material.uniforms.uOpen.value).toBe(1);
      effect.update(0, spell.duration * .9, spell.duration);
      expect(surfaces[0].material.uniforms.uOpen.value).toBe(0);
    }
    const geometry = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    effect.root.traverse(node => {
      if (node instanceof THREE.Mesh) {
        geometry.add(node.geometry);
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
        if (node instanceof THREE.InstancedMesh) node.dispose();
      }
      if (node instanceof THREE.Sprite) materials.add(node.material);
    });
    materials.forEach(material => { const map = (material as THREE.MeshBasicMaterial).map; if (map) textures.add(map); material.dispose(); });
    geometry.forEach(item => item.dispose()); textures.forEach(item => item.dispose());
  }
  expect(designs).toEqual(new Set(['gravitational-horizon', 'shearing-fractures', 'sutured-breach']));
});

test('all three Void spells render through their phases, retain their powers, and clean up', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text());
  });
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as unknown as VoidPreviewWindow).setSpellPreviewFrame));
  const catalog = await page.evaluate(() => (window as unknown as VoidPreviewWindow).getSpellPreviewCatalog().filter(spell => spell.id.startsWith('void-')));
  expect(catalog).toHaveLength(3);
  for (const spell of catalog) {
    for (const progress of [.18, .5, .7, .9]) {
      expect(await page.evaluate(({ id, elapsed }) => (window as unknown as VoidPreviewWindow).setSpellPreviewFrame(id, elapsed, .35),
        { id: spell.id, elapsed: spell.duration * progress })).toBe(true);
      if (progress === .5) {
        const state = await page.evaluate(() => (window as unknown as VoidPreviewWindow).getSpellPreviewState());
        if (spell.id === 'void-singularity-event') expect(state.target?.silenced).toBe(true);
        if (spell.id === 'void-catastrophic-collapse') {
          expect(state.target).toBeDefined();
          expect(Math.hypot(state.target!.x - state.target!.startX, state.target!.y - state.target!.startY)).toBeGreaterThan(.05);
        }
      }
      await page.screenshot({ path: testInfo.outputPath(`${spell.id}-${Math.round(progress * 100)}.png`) });
    }
    for (const heading of [0, Math.PI / 2, Math.PI]) {
      expect(await page.evaluate(({ id, elapsed, heading }) => (window as unknown as VoidPreviewWindow).setSpellPreviewFrame(id, elapsed, heading),
        { id: spell.id, elapsed: spell.duration * .5, heading })).toBe(true);
    }
    await page.evaluate(({ id, duration }) => (window as unknown as VoidPreviewWindow).setSpellPreviewFrame(id, duration, .35), spell);
    expect(await page.evaluate(() => (window as unknown as VoidPreviewWindow).getActiveSpellCount())).toBe(0);
  }
  expect(errors).toEqual([]);
});
