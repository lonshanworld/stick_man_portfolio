import { expect, test } from '@playwright/test';
import * as THREE from 'three';
import { ELEMENT_PALETTES } from '../data/elementPalettes';
import { STICK_MAN_ARCHETYPES, ALL_ELEMENTS } from '../data/stickManArchetypes';
import { ELEMENT_COLORS } from '../data/elementData';
import { buildCharacterMaterials } from '../systems/characterArchetypeBuilders';

function oklab(hex: string) {
  const { r, g, b } = new THREE.Color(hex);
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b);
  const m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b);
  const s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  return [.2104542553*l + .793617785*m - .0040720468*s,
    1.9779984951*l - 2.428592205*m + .4505937099*s,
    .0259040371*l + .7827717662*m - .808675766*s];
}

test('all fourteen body palettes are perceptually separated and match their archetypes and UI', () => {
  expect(ALL_ELEMENTS).toHaveLength(14);
  expect(new Set(ALL_ELEMENTS.map(element => STICK_MAN_ARCHETYPES[element].primaryColor)).size).toBe(14);
  for (const [index, element] of ALL_ELEMENTS.entries()) {
    const definition = STICK_MAN_ARCHETYPES[element], palette = ELEMENT_PALETTES[element];
    const materials = buildCharacterMaterials(element, new THREE.Color(definition.primaryColor), new THREE.Color(definition.secondaryColor));
    const body = materials.stickBodyMat as THREE.MeshStandardMaterial;
    expect(`#${body.color.getHexString()}`.toUpperCase()).toBe(definition.bodyColor);
    expect(body.emissiveIntensity).toBeLessThanOrEqual(.22);
    expect(definition.bodyColor).toBe(palette.body ?? palette.primary);
    expect(ELEMENT_COLORS[element]).toMatchObject({ primary: definition.primaryColor, secondary: definition.secondaryColor });
    const a = oklab(definition.bodyColor);
    for (const other of ALL_ELEMENTS.slice(0, index)) {
      const b = oklab(STICK_MAN_ARCHETYPES[other].bodyColor);
      expect(Math.hypot(...a.map((value, axis) => value - b[axis])), `${element} / ${other}`).toBeGreaterThan(.095);
    }
    Object.values(materials).forEach(material => material.dispose());
  }
});

test('Dark represents darkness and death with an identity separate from Void and Light', () => {
  const dark = STICK_MAN_ARCHETYPES.dark;
  expect(dark.title).toContain('Death');
  expect([dark.title, dark.headPower, dark.bodyPower, dark.weaponOrFocus].join(' ')).not.toMatch(/void|event horizon|singularity/i);
  expect(oklab(dark.bodyColor)[0]).toBeLessThan(oklab(STICK_MAN_ARCHETYPES.light.bodyColor)[0] - .35);
  expect(dark.bodyColor).not.toBe(STICK_MAN_ARCHETYPES.void.bodyColor);
});

type PaletteRow = { element: string; name: string; color: string; x: number; y: number };
type PaletteWindow = Window & { setCharacterPalettePreview: (lighting: 'world' | 'arena', heading: number) => PaletteRow[] };

test('all fourteen production characters render distinct palettes under world and arena lighting', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /THREE|WebGL|shader|GL_INVALID/i.test(message.text())) errors.push(message.text()); });
  await page.goto('/?characterPalette=qa');
  await page.waitForFunction(() => Boolean((window as unknown as PaletteWindow).setCharacterPalettePreview));
  for (const lighting of ['world', 'arena'] as const) for (const [view, heading] of [['front', 0], ['turned', 1.15]] as const) {
    const rows = await page.evaluate(({ lighting, heading }) => {
      const rows = (window as unknown as PaletteWindow).setCharacterPalettePreview(lighting, heading);
      document.querySelectorAll('[data-palette-label]').forEach(label => label.remove());
      rows.forEach(row => {
        const label = document.createElement('div'); label.dataset.paletteLabel = row.element;
        label.textContent = `${row.element.toUpperCase()} / ${row.name}\n${row.color.toUpperCase()}`;
        Object.assign(label.style, { position: 'fixed', left: `${row.x}px`, top: `${row.y + 7}px`, transform: 'translateX(-50%)',
          whiteSpace: 'pre', textAlign: 'center', color: '#e4eaf4', font: `${innerWidth < 700 ? 8 : 11}px monospace`, zIndex: '9999', pointerEvents: 'none' });
        document.body.append(label);
      });
      return rows;
    }, { lighting, heading });
    expect(rows).toHaveLength(14);
    expect(rows.map(row => row.color.toUpperCase())).toEqual(ALL_ELEMENTS.map(element => STICK_MAN_ARCHETYPES[element].bodyColor));
    await page.screenshot({ path: testInfo.outputPath(`palettes-${lighting}-${view}.png`) });
  }
  expect(errors).toEqual([]);
});
