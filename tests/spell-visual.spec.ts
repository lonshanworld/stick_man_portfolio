import { expect, test, type Page } from '@playwright/test';
import { ELEMENTAL_SPELLS } from '../data/elementalSpells';
import { validateSpellRegistry } from '../systems/spellEffectSystem';
import { SpellActionSystem } from '../systems/spellActionSystem';
import type { StickManEntity } from '../systems/stickManPopulation';
import { MAGIC_SEAL_PROFILES } from '../systems/magicSeal3D';
import { createHandMagicSeal } from '../systems/magicSeal3D';
import * as THREE from 'three';

type PreviewSpell = { id: string; duration: number; keyframes: number[]; headings: number[] };
type PreviewPose = { lift: number; hidden: boolean; paused: boolean; kind?: string; shielded?: boolean; speedMultiplier?: number };
type PreviewState = {
  spellId: string;
  caster: { startX: number; startY: number; x: number; y: number; pose?: PreviewPose };
  target?: { startX: number; startY: number; x: number; y: number; pose?: PreviewPose; silenced: boolean };
};
type PreviewWindow = Window & {
  getSpellPreviewCatalog?: () => PreviewSpell[];
  getActiveSpellCount?: () => number;
  setSpellPreviewFrame?: (id: string, elapsed: number, heading?: number) => boolean;
  getSpellPreviewState?: () => PreviewState | null;
};

async function openPreview(page: Page) {
  await page.goto('/?spellPreview=qa');
  await page.waitForFunction(() => Boolean((window as PreviewWindow).getSpellPreviewCatalog));
  return page.evaluate(() => (window as PreviewWindow).getSpellPreviewCatalog?.() || []);
}

test('spell catalog has 14 complete, explicitly registered families', () => {
  expect(Object.keys(ELEMENTAL_SPELLS)).toHaveLength(14);
  for (const spells of Object.values(ELEMENTAL_SPELLS)) {
    expect(spells).toHaveLength(3);
    expect(spells.every(spell => Boolean(spell.action))).toBe(true);
  }
  expect(validateSpellRegistry()).toBe(42);
});

test('every elemental character owns a distinct Spirit World hand seal', () => {
  expect(Object.keys(MAGIC_SEAL_PROFILES)).toHaveLength(14);
  expect(new Set(Object.values(MAGIC_SEAL_PROFILES).map(profile => profile.shape)).size).toBe(14);
  expect(new Set(Object.values(MAGIC_SEAL_PROFILES).map(profile => profile.rune)).size).toBe(14);
  expect(MAGIC_SEAL_PROFILES.fire).toMatchObject({
    shape: 'triangle', rune: 'flame', outerDash: [9, 5], innerDash: [2, 6],
    outerSeconds: 4.2, innerSeconds: 6.5, outerDirection: 1, innerDirection: -1,
  });
  expect(MAGIC_SEAL_PROFILES.void).toMatchObject({
    shape: 'diamond', rune: 'void', outerDash: [14, 10], innerDash: [8, 8], ringMode: 'broken',
  });
  expect(MAGIC_SEAL_PROFILES.robot).toMatchObject({
    shape: 'octagon', rune: 'circuit', outerDash: [3, 3], innerDash: [1, 4], ringMode: 'tech',
  });
});

test('hand seals are volumetric meshes centered on the palm and linked to the caster', () => {
  const torso = new THREE.Group();
  const seal = createHandMagicSeal('time', '#f7b733', '#fff1a8', torso);
  const geometryTypes = new Set<string>();
  seal.traverse(node => {
    if (node instanceof THREE.Mesh) {
      geometryTypes.add(node.geometry.type);
      for (const type of node.geometry.userData.sourceTypes || []) geometryTypes.add(type);
    }
  });
  expect(seal.position.toArray()).toEqual([0, 0, 0]);
  expect(seal.userData.seal.facingTarget).toBe(torso);
  expect(geometryTypes).toContain('TubeGeometry');
  expect(geometryTypes).toContain('TorusGeometry');
  expect(geometryTypes).toContain('SphereGeometry');
});

function entity(id: string, x: number, y: number): StickManEntity {
  return {
    id, element: id === 'caster' ? 'water' : 'fire', name: id, title: '', dialogueQuote: '', specialMove: '',
    homeDistrict: 0, docX: x, docY: y, targetDocX: x, targetDocY: y, headingAngle: Math.PI / 2,
    walkCycle: 0, state: 'idle', speed: 60, wanderTimer: 0, personalityOffset: 0, scaleVariant: 1,
    districtName: '', waypoints: [{ x, y }], currentWaypointIdx: 0, isSpeaking: false,
  };
}

test('wards absorb one impact and temporary conditions expire', () => {
  const actions = new SpellActionSystem();
  const caster = entity('caster', 45, 50);
  const target = entity('target', 55, 50);
  const shield = ELEMENTAL_SPELLS.water[1];
  actions.cast(shield, caster, [caster, target], 1000, 1000);
  actions.update(shield.duration * 0.3, [caster, target]);
  expect(actions.isShielded(caster.id)).toBe(true);
  expect(actions.resolveImpact(caster.id)).toBe(true);
  expect(actions.isShielded(caster.id)).toBe(false);
  expect(actions.resolveImpact(caster.id)).toBe(false);

  const snare = ELEMENTAL_SPELLS.lightning[2];
  caster.headingAngle = Math.PI / 2;
  target.docX = target.targetDocX = 58.5;
  actions.cast(snare, caster, [caster, target], 1000, 1000);
  actions.update(snare.duration * 0.35, [caster, target]);
  expect(actions.pose(target.id)?.kind).toBe('stunned');
  actions.update(4, [caster, target]);
  expect(actions.pose(target.id)?.kind).not.toBe('stunned');
  actions.dispose();
});

test('all 42 spells render at cinematic keyframes and clean up', async ({ page }, testInfo) => {
  test.setTimeout(testInfo.project.name.includes('mobile') ? 120_000 : 300_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const catalog = await openPreview(page);
  expect(catalog).toHaveLength(42);

  for (const spell of catalog) {
    const headings = testInfo.project.name.includes('mobile') ? spell.headings.slice(0, 1) : spell.headings;
    const keyframes = testInfo.project.name.includes('mobile') ? [spell.duration * 0.5] : spell.keyframes.slice(0, -1);
    for (const heading of headings) {
      for (const elapsed of keyframes) {
        const rendered = await page.evaluate(({ id, elapsed, heading }) =>
          (window as PreviewWindow).setSpellPreviewFrame?.(id, elapsed, heading),
        { id: spell.id, elapsed, heading });
        expect(rendered, `${spell.id} at ${elapsed}s`).toBe(true);
      }
    }
    await page.evaluate(({ id, duration }) =>
      (window as PreviewWindow).setSpellPreviewFrame?.(id, duration),
    { id: spell.id, duration: spell.duration });
    expect(await page.evaluate(() => (window as PreviewWindow).getActiveSpellCount?.())).toBe(0);
  }
  expect(errors).toEqual([]);
});

test('support, control and mobility spells change observable world state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'State semantics are device independent.');
  const catalog = await openPreview(page);
  const render = async (id: string, progress: number) => {
    const spell = catalog.find(candidate => candidate.id === id)!;
    await page.evaluate(({ spellId, elapsed }) =>
      (window as PreviewWindow).setSpellPreviewFrame?.(spellId, elapsed, 0.35),
    { spellId: id, elapsed: spell.duration * progress });
    return page.evaluate(() => (window as PreviewWindow).getSpellPreviewState?.() || null);
  };

  expect((await render('water-whirlpool-vortex', 0.5))?.caster.pose?.shielded).toBe(true);
  expect((await render('healing-sakura-sanctuary', 0.5))?.target?.pose?.kind).toBe('recovering');
  expect((await render('lightning-chain-nova', 0.5))?.target?.pose?.kind).toBe('stunned');
  expect((await render('ice-absolute-zero', 0.5))?.target?.pose?.kind).toBe('frozen');
  expect((await render('trees-root-entanglement', 0.5))?.target?.pose?.kind).toBe('rooted');
  expect((await render('time-stasis-field', 0.5))?.target?.pose?.kind).toBe('frozen');
  expect((await render('void-singularity-event', 0.5))?.target?.silenced).toBe(true);

  const pull = await render('space-meteor-shower', 0.6);
  expect(Math.hypot((pull?.target?.x || 0) - (pull?.target?.startX || 0), (pull?.target?.y || 0) - (pull?.target?.startY || 0))).toBeGreaterThan(0.05);
  const voidPull = await render('void-catastrophic-collapse', 0.6);
  expect(Math.hypot((voidPull?.target?.x || 0) - (voidPull?.target?.startX || 0), (voidPull?.target?.y || 0) - (voidPull?.target?.startY || 0))).toBeGreaterThan(0.05);
  const teleport = await render('space-cosmic-ray', 0.65);
  expect(Math.hypot((teleport?.caster.x || 0) - (teleport?.caster.startX || 0), (teleport?.caster.y || 0) - (teleport?.caster.startY || 0))).toBeGreaterThan(0.1);
  expect((await render('wind-aero-burst', 0.5))?.caster.pose?.lift).toBeGreaterThan(20);
  expect((await render('dark-eclipse-nova', 0.5))?.caster.pose?.hidden).toBe(true);
  expect((await render('dark-eclipse-nova', 1))?.caster.pose?.hidden || false).toBe(false);
  const rewind = await render('time-chrono-rewind', 0.6);
  expect(Math.hypot((rewind?.caster.x || 0) - (rewind?.caster.startX || 0), (rewind?.caster.y || 0) - (rewind?.caster.startY || 0))).toBeGreaterThan(0.1);
});

test('captures representative role silhouettes', async ({ page }, testInfo) => {
  const catalog = await openPreview(page);
  const representatives = [
    'fire-dragon-meteor',
    'water-whirlpool-vortex',
    'healing-sakura-sanctuary',
    'lightning-chain-nova',
    'time-gear-barrage',
    'space-cosmic-ray',
  ];
  for (const id of representatives) {
    const spell = catalog.find(candidate => candidate.id === id);
    expect(spell).toBeTruthy();
    await page.evaluate(({ spellId, elapsed }) =>
      (window as PreviewWindow).setSpellPreviewFrame?.(spellId, elapsed, 0.35),
    { spellId: id, elapsed: spell!.duration * 0.5 });
    await page.screenshot({ path: testInfo.outputPath(`${id}.png`) });
  }
});
