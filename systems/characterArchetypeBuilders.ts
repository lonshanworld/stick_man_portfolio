import { createHealingCrossGeometry } from './healingVitality';
import * as THREE from 'three';
import { ElementType } from '../types';
import { ELEMENT_PALETTES } from '../data/elementPalettes';
import { carveCharacterBark } from './treeNature';

export interface BuiltCharacterMaterials {
  stickBodyMat: THREE.Material;
  jointMat: THREE.Material;
  eyeMat: THREE.Material;
  coreMat: THREE.Material;
  accentMat: THREE.Material;
  highlightMat: THREE.Material;
}

/** Palette roles stay consistent across bodies, archetypes, and UI; substance controls the finish. */
export function buildCharacterMaterials(
  element: ElementType,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color
): BuiltCharacterMaterials {
  const palette = ELEMENT_PALETTES[element];
  const surface = (color: THREE.ColorRepresentation, emission: number, metalness = palette.metalness) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: emission,
      roughness: palette.roughness, metalness });
  const body = surface(palette.body ?? primaryColor, palette.emission);
  if (element === 'trees') carveCharacterBark(body);
  return {
    stickBodyMat: body,
    jointMat: surface(element === 'robot' ? '#25343F' : secondaryColor, element === 'robot' ? .03 : .22, palette.metalness * .5),
    coreMat: surface(palette.accent, .45),
    accentMat: surface(palette.accent, .18),
    eyeMat: new THREE.MeshBasicMaterial({ color: palette.eye }),
    highlightMat: new THREE.MeshBasicMaterial({ color: palette.eye }),
  };
}

/**
 * Builds the distinctive Head & Eyes for each of the 14 characters.
 */
export function buildCharacterHead(
  element: ElementType,
  bodyGroup: THREE.Group,
  mats: BuiltCharacterMaterials
): { headMesh: THREE.Mesh; eyesMesh: THREE.Mesh } {
  const isGroot = element === 'trees';
  const headRadius = isGroot ? 0.148 : 0.138;
  const headGeo = element === 'robot' ? new THREE.BoxGeometry(.25, .23, .23) : new THREE.SphereGeometry(headRadius, 16, 16);

  if (isGroot) {
    headGeo.scale(1.05, 0.96, 1.02);
  } else if (element === 'ice') {
    // Chiseled faceted diamond ice cube
    headGeo.scale(0.95, 1.05, 0.95);
  } else if (element === 'soil') {
    // Heavy rugged boulder
    headGeo.scale(1.12, 0.92, 1.08);
  } else if (element === 'water') {
    // Sleek streamlined droplet
    headGeo.scale(0.94, 1.06, 1.04);
  }

  const headMesh = new THREE.Mesh(headGeo, mats.stickBodyMat);
  headMesh.position.y = isGroot ? 0.43 : 0.42;
  bodyGroup.add(headMesh);

  let eyesMesh: THREE.Mesh;

  if (isGroot) {
    // ── 🌱 Tiny Groot Cute Round Black Eyes with Specular Catchlights ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.015, 0.122);

    const eyeSphereGeo = new THREE.SphereGeometry(0.035, 12, 12);
    eyeSphereGeo.scale(1.0, 1.15, 0.5);

    const leftEye = new THREE.Mesh(eyeSphereGeo, mats.eyeMat);
    leftEye.position.set(-0.05, 0, 0);
    eyeContainer.add(leftEye);

    const leftGlint = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mats.highlightMat);
    leftGlint.position.set(-0.042, 0.017, 0.020);
    eyeContainer.add(leftGlint);

    const rightEye = new THREE.Mesh(eyeSphereGeo, mats.eyeMat);
    rightEye.position.set(0.05, 0, 0);
    eyeContainer.add(rightEye);

    const rightGlint = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mats.highlightMat);
    rightGlint.position.set(0.058, 0.017, 0.020);
    eyeContainer.add(rightGlint);

    const smileGeo = new THREE.TorusGeometry(0.028, 0.005, 6, 12, Math.PI);
    smileGeo.rotateZ(Math.PI);
    const smile = new THREE.Mesh(smileGeo, mats.eyeMat);
    smile.position.set(0, -0.050, 0.018);
    eyeContainer.add(smile);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'fire') {
    // ── 🔥 Fire: Aggressive Flaming Brow & Molten Slit Eyes ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.118);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.022, 0.04), mats.jointMat);
    brow.position.set(0, 0.02, 0.01);
    eyeContainer.add(brow);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.03), mats.eyeMat);
    leftEye.position.set(-0.038, -0.005, 0.02);
    leftEye.rotation.z = -0.22;
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 0.03), mats.eyeMat);
    rightEye.position.set(0.038, -0.005, 0.02);
    rightEye.rotation.z = 0.22;
    eyeContainer.add(rightEye);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'water') {
    // ── 💧 Water: Serene Almond Luminous Aquatic Eyes & Dorsal Fin ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.018, 0.12);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), mats.eyeMat);
    leftEye.scale.set(1.1, 0.6, 0.3);
    leftEye.position.set(-0.046, 0, 0);
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), mats.eyeMat);
    rightEye.scale.set(1.1, 0.6, 0.3);
    rightEye.position.set(0.046, 0, 0);
    eyeContainer.add(rightEye);

    // Sleek dorsal hydro fin
    const finGeo = new THREE.ConeGeometry(0.025, 0.14, 4);
    finGeo.translate(0, 0.07, 0);
    const fin = new THREE.Mesh(finGeo, mats.jointMat);
    fin.position.set(0, 0.12, -0.04);
    fin.rotation.x = -0.45;
    headMesh.add(fin);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'lightning') {
    // ── ⚡ Lightning: Aerodynamic Ninja Cowl & Twin Plasma Horns ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.022, 0.12);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.032, 0.04), mats.eyeMat);
    visor.rotation.x = 0.1;
    eyeContainer.add(visor);

    // Twin backward lightning bolt antenna horns
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 4), mats.jointMat);
    hornL.position.set(-0.09, 0.11, -0.02);
    hornL.rotation.set(-0.4, 0, 0.55);
    headMesh.add(hornL);

    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 4), mats.jointMat);
    hornR.position.set(0.09, 0.11, -0.02);
    hornR.rotation.set(-0.4, 0, -0.55);
    headMesh.add(hornR);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'ice') {
    // ── ❄️ Ice: Faceted Diamond Ice Head with Glacial Spikes ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.118);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.016, 0.02), mats.eyeMat);
    leftEye.position.set(-0.042, 0, 0);
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.016, 0.02), mats.eyeMat);
    rightEye.position.set(0.042, 0, 0);
    eyeContainer.add(rightEye);

    // 3 sharp crown ice needles
    const spikeCenter = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.15, 4), mats.jointMat);
    spikeCenter.position.set(0, 0.13, 0);
    headMesh.add(spikeCenter);

    const spikeL = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.12, 4), mats.jointMat);
    spikeL.position.set(-0.07, 0.11, 0);
    spikeL.rotation.z = 0.35;
    headMesh.add(spikeL);

    const spikeR = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.12, 4), mats.jointMat);
    spikeR.position.set(0.07, 0.11, 0);
    spikeR.rotation.z = -0.35;
    headMesh.add(spikeR);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'wind') {
    // ── 🍃 Wind: Aviator Goggles & Twin Feather Plumes ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.022, 0.12);

    // Dual aviator goggles
    const goggleL = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 6, 12), mats.jointMat);
    goggleL.position.set(-0.045, 0, 0);
    eyeContainer.add(goggleL);

    const goggleLensL = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), mats.eyeMat);
    goggleLensL.position.set(-0.045, 0, 0.005);
    eyeContainer.add(goggleLensL);

    const goggleR = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 6, 12), mats.jointMat);
    goggleR.position.set(0.045, 0, 0);
    eyeContainer.add(goggleR);

    const goggleLensR = new THREE.Mesh(new THREE.CircleGeometry(0.022, 10), mats.eyeMat);
    goggleLensR.position.set(0.045, 0, 0.005);
    eyeContainer.add(goggleLensR);

    // Twin feather plumes
    const plumeL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.035), mats.accentMat);
    plumeL.position.set(-0.08, 0.11, -0.04);
    plumeL.rotation.set(-0.5, 0, 0.4);
    headMesh.add(plumeL);

    const plumeR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.035), mats.accentMat);
    plumeR.position.set(0.08, 0.11, -0.04);
    plumeR.rotation.set(-0.5, 0, -0.4);
    headMesh.add(plumeR);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'soil') {
    // ── 🪨 Soil: Rugged Granite Boulder with Amber Ore Sockets ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.018, 0.128);

    const browPlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.026, 0.04), mats.accentMat);
    browPlate.position.set(0, 0.02, 0);
    eyeContainer.add(browPlate);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.02), mats.eyeMat);
    leftEye.position.set(-0.042, -0.006, 0.01);
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.022, 0.02), mats.eyeMat);
    rightEye.position.set(0.042, -0.006, 0.01);
    eyeContainer.add(rightEye);

    // Bedrock crag crest
    const crag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), mats.accentMat);
    crag.position.set(0, 0.12, -0.02);
    crag.rotation.set(0.2, 0.3, 0);
    headMesh.add(crag);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'dark') {
    // ── 🌑 Dark: Obsidian Demon Horns & Glowing Violet Assassin Slits ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.018, 0.118);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.014, 0.02), mats.eyeMat);
    leftEye.position.set(-0.04, 0, 0);
    leftEye.rotation.z = -0.28;
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.014, 0.02), mats.eyeMat);
    rightEye.position.set(0.04, 0, 0);
    rightEye.rotation.z = 0.28;
    eyeContainer.add(rightEye);

    // Curved reaper horns and grave wisps belong to the native Dark crown.
    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'light') {
    // ── ✨ Light: Radiant Sunburst Star Halo & Serene Solar Eyes ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.12);

    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.020, 0.02), mats.eyeMat);
    leftEye.position.set(-0.042, 0, 0);
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.020, 0.02), mats.eyeMat);
    rightEye.position.set(0.042, 0, 0);
    eyeContainer.add(rightEye);

    // Radiant floating solar halo ring
    const haloGeo = new THREE.TorusGeometry(0.12, 0.014, 8, 24);
    haloGeo.rotateX(Math.PI / 2);
    const halo = new THREE.Mesh(haloGeo, mats.jointMat);
    halo.position.set(0, 0.18, 0);
    headMesh.add(halo);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'space') {
    // ── 🌌 Space: Retro Cosmic Bubble Helmet & Dual Antennae ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.015, 0.118);

    const visorGeo = new THREE.BoxGeometry(0.135, 0.052, 0.04);
    const visor = new THREE.Mesh(visorGeo, mats.jointMat);
    eyeContainer.add(visor);

    const innerGlint = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.045), mats.eyeMat);
    innerGlint.position.set(0, 0.005, 0.005);
    eyeContainer.add(innerGlint);

    // Dual communications antennae
    const antL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), mats.accentMat);
    antL.position.set(-0.11, 0.08, 0);
    antL.rotation.z = 0.35;
    headMesh.add(antL);

    const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), mats.jointMat);
    tipL.position.set(-0.13, 0.14, 0);
    headMesh.add(tipL);

    const antR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), mats.accentMat);
    antR.position.set(0.11, 0.08, 0);
    antR.rotation.z = -0.35;
    headMesh.add(antR);

    const tipR = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), mats.jointMat);
    tipR.position.set(0.13, 0.14, 0);
    headMesh.add(tipR);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'time') {
    // ── ⏳ Time: Steampunk Brass Automaton Head with Monocle Cog ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.12);

    // Left monocle brass gear eye
    const monocle = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 6, 12), mats.jointMat);
    monocle.position.set(-0.044, 0, 0);
    eyeContainer.add(monocle);

    const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.024, 10), mats.eyeMat);
    lensL.position.set(-0.044, 0, 0.005);
    eyeContainer.add(lensL);

    // Right standard aperture slot eye
    const slotR = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.018, 0.02), mats.jointMat);
    slotR.position.set(0.044, 0, 0);
    eyeContainer.add(slotR);

    // Side exposed cogwheel temples
    const cogGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 10);
    cogGeo.rotateZ(Math.PI / 2);
    const cogL = new THREE.Mesh(cogGeo, mats.jointMat);
    cogL.position.set(-0.135, 0.02, 0);
    headMesh.add(cogL);

    const cogR = new THREE.Mesh(cogGeo, mats.jointMat);
    cogR.position.set(0.135, 0.02, 0);
    headMesh.add(cogR);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'robot') {
    headMesh.name = 'robot-armored-ai-head';
    const eyeContainer = new THREE.Group(); eyeContainer.position.set(0, .015, .12);
    const face = new THREE.Mesh(new THREE.BoxGeometry(.21, .12, .022), mats.accentMat); eyeContainer.add(face);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(.055, .025, .012), mats.eyeMat);
      eye.name = 'robot-digital-eye'; eye.position.set(side * .05, .018, .02); eyeContainer.add(eye);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(.035, .075, .04), mats.stickBodyMat);
      jaw.position.set(side * .108, -.06, .1); headMesh.add(jaw);
    }
    for (let i = 0; i < 3; i++) {
      const grille = new THREE.Mesh(new THREE.BoxGeometry(.055, .006, .012), mats.jointMat);
      grille.position.set(0, -.035 - i * .013, .016); eyeContainer.add(grille);
    }
    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer); headMesh.add(eyesMesh);
  } else if (element === 'healing') {
    // ── 🌸 Healing: Apothecary Clasps & Calm Eyes ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.015, 0.12);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), mats.eyeMat);
    leftEye.scale.set(1.0, 0.7, 0.3);
    leftEye.position.set(-0.044, 0, 0);
    eyeContainer.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), mats.eyeMat);
    rightEye.scale.set(1.0, 0.7, 0.3);
    rightEye.position.set(0.044, 0, 0);
    eyeContainer.add(rightEye);

    // Paired pearl medical clasps frame the healer's calm eyes.
    for (const side of [-1, 1]) {
      const clasp = new THREE.Mesh(createHealingCrossGeometry(.021), mats.eyeMat);
      clasp.position.set(side * .12, .035, .04); headMesh.add(clasp);
    }

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else {
    // ── 🕳️ Void: Event Horizon Singularity & Crimson Optic Slit ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.12);

    const slitGeo = new THREE.BoxGeometry(0.12, 0.016, 0.02);
    const slit = new THREE.Mesh(slitGeo, mats.eyeMat);
    eyeContainer.add(slit);

    // 4 sharp dark event horizon spikes radiating inward/outward
    for (let i = 0; i < 4; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.016, 0.09, 4);
      spikeGeo.translate(0, 0.045, 0);
      const spike = new THREE.Mesh(spikeGeo, mats.jointMat);
      const ang = (i / 4) * Math.PI * 2;
      spike.position.set(Math.cos(ang) * 0.10, Math.sin(ang) * 0.10, 0);
      spike.rotation.z = ang - Math.PI / 2;
      headMesh.add(spike);
    }

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  }

  return { headMesh, eyesMesh };
}

/**
 * Builds the distinctive Torso & Body Armor for each of the 14 characters.
 */
export function buildCharacterTorso(
  element: ElementType,
  bodyGroup: THREE.Group,
  mats: BuiltCharacterMaterials
): { torsoMesh: THREE.Mesh; powerCoreMesh: THREE.Mesh } {
  // Base torso cylinder
  const torsoGeo = new THREE.CylinderGeometry(0.042, 0.038, 0.36, 10);
  const torsoMesh = new THREE.Mesh(torsoGeo, mats.stickBodyMat);
  torsoMesh.position.y = 0.18;
  bodyGroup.add(torsoMesh);

  // Hidden power core to keep standard torso clean and interface compatible
  const coreGeo = new THREE.SphereGeometry(0.055, 12, 12);
  const powerCoreMesh = new THREE.Mesh(coreGeo, mats.coreMat);
  powerCoreMesh.position.set(0, 0.22, 0.05);
  powerCoreMesh.visible = false;
  bodyGroup.add(powerCoreMesh);

  // ── Element-Specific Torso Overlays & Physical Features ──
  switch (element) {
    case 'fire': {
      // Volcanic basalt chestplate with glowing magma fissure
      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.06), mats.accentMat);
      chestPlate.position.set(0, 0.02, 0.025);
      torsoMesh.add(chestPlate);

      const fissure = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.14, 0.068), mats.jointMat);
      fissure.position.set(0, 0.02, 0.028);
      torsoMesh.add(fissure);
      break;
    }

    case 'soil': {
      // Chunky bedrock strata boulder plate
      const boulderPlate = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.19, 0.07), mats.stickBodyMat);
      boulderPlate.position.set(0, 0.02, 0.025);
      torsoMesh.add(boulderPlate);

      const strata = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.035, 0.075), mats.accentMat);
      strata.position.set(0, 0.03, 0.025);
      torsoMesh.add(strata);
      break;
    }

    case 'ice': {
      // Crystalline ice breastplate & frost collar
      const icePlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.06), mats.jointMat);
      icePlate.position.set(0, 0.02, 0.025);
      icePlate.rotation.z = 0.1;
      torsoMesh.add(icePlate);
      break;
    }

    case 'lightning': {
      // Aerodynamic speedster chest chevron plate
      const chevron = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 3), mats.jointMat);
      chevron.position.set(0, 0.04, 0.04);
      chevron.rotation.x = Math.PI / 2;
      torsoMesh.add(chevron);
      break;
    }

    case 'light': {
      // Golden solar knight breastplate
      const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.06), mats.jointMat);
      breastplate.position.set(0, 0.02, 0.025);
      torsoMesh.add(breastplate);

      const sunEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), mats.coreMat);
      sunEmblem.position.set(0, 0.04, 0.06);
      torsoMesh.add(sunEmblem);
      break;
    }

    case 'space': {
      // Spacesuit control chest unit & life-support backpack
      const chestUnit = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.05), mats.jointMat);
      chestUnit.position.set(0, 0.03, 0.035);
      torsoMesh.add(chestUnit);

      // Backpack oxygen tank on back
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.07), mats.stickBodyMat);
      backpack.position.set(0, 0.03, -0.055);
      torsoMesh.add(backpack);
      break;
    }

    case 'time': {
      // Copper riveted boiler chassis & winding key on back
      const boilerPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), mats.jointMat);
      boilerPlate.position.set(0, 0.02, 0.015);
      torsoMesh.add(boilerPlate);

      // Antique winding key on back
      const keyRod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.07, 6), mats.jointMat);
      keyRod.rotation.x = Math.PI / 2;
      keyRod.position.set(0, 0.04, -0.06);
      torsoMesh.add(keyRod);

      const keyHandle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 6, 12), mats.jointMat);
      keyHandle.position.set(0, 0.04, -0.095);
      torsoMesh.add(keyHandle);
      break;
    }

    case 'robot': {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(.17, .23, .13), mats.stickBodyMat);
      plate.name = 'robot-armored-chest'; plate.position.set(0, .015, .01); torsoMesh.add(plate);
      const abdomen = new THREE.Mesh(new THREE.BoxGeometry(.09, .07, .09), mats.accentMat);
      abdomen.position.set(0, -.13, .005); torsoMesh.add(abdomen);
      break;
    }

    case 'healing': {
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(.14, .16, .018), mats.jointMat);
      wrap.position.set(0, -.01, .074); torsoMesh.add(wrap);
      const clasp = new THREE.Mesh(createHealingCrossGeometry(.024), mats.eyeMat);
      clasp.position.set(0, .02, .09); torsoMesh.add(clasp);
      break;
    }

    case 'dark': {
      // The animated cloth mantle is attached by createBodyElementPower.
      break;
    }

    case 'wind': {
      // Aerofoil poncho vest
      const poncho = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), mats.jointMat);
      poncho.position.set(0, 0.02, 0);
      poncho.rotation.y = Math.PI / 4;
      torsoMesh.add(poncho);
      break;
    }

    case 'trees': {
      // Tiny Groot subtle moss / vine tendril
      const vine = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.009, 6, 16), mats.jointMat);
      vine.rotation.x = Math.PI / 2.3;
      vine.position.set(0, 0.02, 0);
      torsoMesh.add(vine);
      break;
    }

    case 'water': {
      // Hydrodynamic rib curve
      const hydroCurve = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 16), mats.jointMat);
      hydroCurve.rotation.x = Math.PI / 2.2;
      hydroCurve.position.set(0, 0.03, 0);
      torsoMesh.add(hydroCurve);
      break;
    }

    case 'void': {
      // Hovering obsidian shard plate
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), mats.jointMat);
      shard.position.set(0, 0.03, 0.045);
      torsoMesh.add(shard);
      break;
    }
  }

  return { torsoMesh, powerCoreMesh };
}

/**
 * Builds the distinctive Arms & Limbs for each of the 14 characters.
 */
export function buildCharacterArms(
  element: ElementType,
  bodyGroup: THREE.Group,
  mats: BuiltCharacterMaterials
): {
  leftArm: { shoulder: THREE.Group; upper: THREE.Mesh; elbow: THREE.Group; lower: THREE.Mesh; hand: THREE.Mesh };
  rightArm: { shoulder: THREE.Group; upper: THREE.Mesh; elbow: THREE.Group; lower: THREE.Mesh; hand: THREE.Mesh };
} {
  const isGroot = element === 'trees';
  let armLimbGeo: THREE.BufferGeometry = new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8);
  armLimbGeo.translate(0, -0.08, 0);

  let handGeo: THREE.BufferGeometry = new THREE.SphereGeometry(0.035, 8, 8);

  // Left Arm
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.11, 0.28, 0);
  bodyGroup.add(leftShoulder);

  const leftUpper = new THREE.Mesh(armLimbGeo, mats.stickBodyMat);
  leftShoulder.add(leftUpper);

  const leftElbow = new THREE.Group();
  leftElbow.position.set(0, -0.16, 0);
  leftUpper.add(leftElbow);

  const leftLower = new THREE.Mesh(armLimbGeo, mats.stickBodyMat);
  leftElbow.add(leftLower);

  const leftHand = new THREE.Mesh(handGeo, mats.jointMat);
  leftHand.position.set(0, -0.16, 0);
  leftLower.add(leftHand);

  // Right Arm
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.11, 0.28, 0);
  bodyGroup.add(rightShoulder);

  const rightUpper = new THREE.Mesh(armLimbGeo, mats.stickBodyMat);
  rightShoulder.add(rightUpper);

  const rightElbow = new THREE.Group();
  rightElbow.position.set(0, -0.16, 0);
  rightUpper.add(rightElbow);

  const rightLower = new THREE.Mesh(armLimbGeo, mats.stickBodyMat);
  rightElbow.add(rightLower);

  const rightHand = new THREE.Mesh(handGeo, mats.jointMat);
  rightHand.position.set(0, -0.16, 0);
  rightLower.add(rightHand);

  // ── Element-Specific Arm & Shoulder Customizations ──
  if (isGroot) {
    // Sprouting green leaf buds on Groot's shoulders
    const leftSprout = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), mats.jointMat);
    leftSprout.scale.set(0.8, 0.25, 1.4);
    leftSprout.position.set(-0.025, 0.04, 0);
    leftSprout.rotation.z = 0.65;
    leftShoulder.add(leftSprout);

    const rightSprout = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), mats.jointMat);
    rightSprout.scale.set(0.8, 0.25, 1.4);
    rightSprout.position.set(0.025, 0.04, 0);
    rightSprout.rotation.z = -0.65;
    rightShoulder.add(rightSprout);
  } else if (element === 'water') {
    // Wave fins on forearms
    const finL = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.10, 4), mats.jointMat);
    finL.position.set(-0.025, -0.08, 0);
    finL.rotation.z = 0.6;
    leftLower.add(finL);

    const finR = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.10, 4), mats.jointMat);
    finR.position.set(0.025, -0.08, 0);
    finR.rotation.z = -0.6;
    rightLower.add(finR);
  } else if (element === 'wind') {
    // Forearm glider winglets
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.10, 0.04), mats.accentMat);
    wingL.position.set(-0.03, -0.08, 0);
    leftLower.add(wingL);

    const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.10, 0.04), mats.accentMat);
    wingR.position.set(0.03, -0.08, 0);
    rightLower.add(wingR);
  } else if (element === 'light') {
    // Golden pauldron shoulder guards
    const pauldronL = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), mats.jointMat);
    pauldronL.position.set(-0.02, 0.02, 0);
    leftShoulder.add(pauldronL);

    const pauldronR = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), mats.jointMat);
    pauldronR.position.set(0.02, 0.02, 0);
    rightShoulder.add(pauldronR);
  } else if (element === 'robot') {
    // Cyber armor cuffs on forearms
    const cuffL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 6), mats.jointMat);
    cuffL.position.set(0, -0.10, 0);
    leftLower.add(cuffL);

    const cuffR = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 6), mats.jointMat);
    cuffR.position.set(0, -0.10, 0);
    rightLower.add(cuffR);
  } else if (element === 'fire') {
    // Obsidian stone gauntlets on forearms
    const gauntletL = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.045), mats.accentMat);
    gauntletL.position.set(0, -0.10, 0);
    leftLower.add(gauntletL);

    const gauntletR = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.07, 0.045), mats.accentMat);
    gauntletR.position.set(0, -0.10, 0);
    rightLower.add(gauntletR);
  }

  return {
    leftArm: { shoulder: leftShoulder, upper: leftUpper, elbow: leftElbow, lower: leftLower, hand: leftHand },
    rightArm: { shoulder: rightShoulder, upper: rightUpper, elbow: rightElbow, lower: rightLower, hand: rightHand },
  };
}

/**
 * Builds the distinctive Legs & Feet for each of the 14 characters.
 */
export function buildCharacterLegs(
  element: ElementType,
  bodyGroup: THREE.Group,
  mats: BuiltCharacterMaterials
): {
  leftLeg: { hip: THREE.Group; thigh: THREE.Mesh; knee: THREE.Group; shin: THREE.Mesh; foot: THREE.Mesh };
  rightLeg: { hip: THREE.Group; thigh: THREE.Mesh; knee: THREE.Group; shin: THREE.Mesh; foot: THREE.Mesh };
} {
  const isGroot = element === 'trees';
  let legLimbGeo: THREE.BufferGeometry = element === 'robot' ? new THREE.BoxGeometry(.075, .2, .075) : new THREE.CylinderGeometry(0.026, 0.022, 0.2, 8);
  legLimbGeo.translate(0, -0.1, 0);

  // Default foot geometry
  let footGeo = new THREE.BoxGeometry(0.04, 0.025, 0.09);
  footGeo.translate(0, -0.015, 0.025);

  let footMat = mats.jointMat;

  if (isGroot) {
    footMat = mats.stickBodyMat; // Natural wooden root feet
  } else if (element === 'soil') {
    // Massive bedrock stone stomp blocks
    footGeo = new THREE.BoxGeometry(0.055, 0.035, 0.10);
    footGeo.translate(0, -0.018, 0.025);
    footMat = mats.accentMat;
  } else if (element === 'water') {
    // Swimmer flipper fins
    footGeo = new THREE.BoxGeometry(0.045, 0.015, 0.12);
    footGeo.translate(0, -0.010, 0.035);
  } else if (element === 'ice') {
    // Chiseled diamond ice blocks
    footGeo = new THREE.BoxGeometry(0.045, 0.030, 0.095);
    footGeo.translate(0, -0.015, 0.025);
    footMat = mats.jointMat;
  } else if (element === 'lightning') {
    // Streamlined cleats
    footGeo = new THREE.BoxGeometry(0.038, 0.022, 0.095);
    footGeo.translate(0, -0.012, 0.028);
  } else if (element === 'space') {
    // Heavy lunar moon boots
    footGeo = new THREE.BoxGeometry(0.052, 0.038, 0.10);
    footGeo.translate(0, -0.018, 0.025);
    footMat = mats.stickBodyMat;
  } else if (element === 'robot') {
    // Thruster mech feet
    footGeo = new THREE.BoxGeometry(0.048, 0.028, 0.095);
    footGeo.translate(0, -0.014, 0.025);
    footMat = mats.accentMat;
  }

  // Left Leg
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.065, 0.0, 0);
  bodyGroup.add(leftHip);

  const leftThigh = new THREE.Mesh(legLimbGeo, mats.stickBodyMat);
  leftHip.add(leftThigh);

  const leftKnee = new THREE.Group();
  leftKnee.position.set(0, -0.2, 0);
  leftThigh.add(leftKnee);

  const leftShin = new THREE.Mesh(legLimbGeo, mats.stickBodyMat);
  leftKnee.add(leftShin);

  const leftFoot = new THREE.Mesh(footGeo, footMat);
  leftFoot.position.set(0, -0.2, 0);
  leftShin.add(leftFoot);

  // Right Leg
  const rightHip = new THREE.Group();
  rightHip.position.set(0.065, 0.0, 0);
  bodyGroup.add(rightHip);

  const rightThigh = new THREE.Mesh(legLimbGeo, mats.stickBodyMat);
  rightHip.add(rightThigh);

  const rightKnee = new THREE.Group();
  rightKnee.position.set(0, -0.2, 0);
  rightThigh.add(rightKnee);

  const rightShin = new THREE.Mesh(legLimbGeo, mats.stickBodyMat);
  rightKnee.add(rightShin);

  const rightFoot = new THREE.Mesh(footGeo, footMat);
  rightFoot.position.set(0, -0.2, 0);
  rightShin.add(rightFoot);

  if (isGroot) {
    for (const foot of [leftFoot, rightFoot]) for (const side of [-1, 1]) {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(.004, .009, .07, 6), mats.stickBodyMat);
      root.rotation.set(Math.PI / 2, 0, side * .25); root.position.set(side * .017, -.012, .045);
      foot.add(root);
    }
  }

  // ── Element-Specific Calf / Shin Attachments ──
  if (element === 'lightning') {
    // High-speed lightning fins on outer calves
    const finL = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, 3), mats.jointMat);
    finL.position.set(-0.025, -0.10, -0.015);
    finL.rotation.set(-0.4, 0, 0.4);
    leftShin.add(finL);

    const finR = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.09, 3), mats.jointMat);
    finR.position.set(0.025, -0.10, -0.015);
    finR.rotation.set(-0.4, 0, -0.4);
    rightShin.add(finR);
  }

  return {
    leftLeg: { hip: leftHip, thigh: leftThigh, knee: leftKnee, shin: leftShin, foot: leftFoot },
    rightLeg: { hip: rightHip, thigh: rightThigh, knee: rightKnee, shin: rightShin, foot: rightFoot },
  };
}
