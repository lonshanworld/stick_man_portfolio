import * as THREE from 'three';
import { ElementType } from '../types';

export interface BuiltCharacterMaterials {
  stickBodyMat: THREE.Material;
  jointMat: THREE.Material;
  eyeMat: THREE.Material;
  coreMat: THREE.Material;
  accentMat: THREE.Material;
  highlightMat: THREE.Material;
}

/**
 * Creates rich, bespoke physical materials tailored to each elemental hero's substance
 * (stone, lava, liquid, crystal, metal, bark, composite armor, fabric, void).
 */
export function buildCharacterMaterials(
  element: ElementType,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color
): BuiltCharacterMaterials {
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  switch (element) {
    case 'fire': {
      // Radiant blazing crimson & molten gold
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xff3d00,
          emissive: 0xff2200,
          emissiveIntensity: 0.60,
          roughness: 0.20,
          metalness: 0.10,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xffb300,
          emissive: 0xff8f00,
          emissiveIntensity: 0.85,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xff1744,
          emissive: 0xff5252,
          emissiveIntensity: 1.0,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xff6d00,
          emissive: 0xff3d00,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'water': {
      // Vivid ocean azure & luminous aqua
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0x0091ea,
          emissive: 0x0077b6,
          emissiveIntensity: 0.60,
          roughness: 0.20,
          metalness: 0.20,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x00b4d8,
          emissiveIntensity: 0.85,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xb2ebf2 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0x00b0ff,
          emissive: 0x40c4ff,
          emissiveIntensity: 0.90,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0x48cae4,
          emissive: 0x0096c7,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'lightning': {
      // Brilliant radiant electric gold & white-hot spark
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xffea00,
          emissive: 0xffd600,
          emissiveIntensity: 0.65,
          roughness: 0.20,
          metalness: 0.20,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff59d,
          emissiveIntensity: 0.95,
          roughness: 0.15,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xffd600,
          emissive: 0xffff55,
          emissiveIntensity: 1.0,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xfff176,
          emissive: 0xffc107,
          emissiveIntensity: 0.85,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'ice': {
      // Brilliant crystal glacial azure & diamond frost
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0x00b4d8,
          emissive: 0x0096c7,
          emissiveIntensity: 0.60,
          roughness: 0.15,
          metalness: 0.30,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0x80d8ff,
          emissive: 0x40c4ff,
          emissiveIntensity: 0.85,
          roughness: 0.15,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xe0f7fa }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0x90e0ef,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.95,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xcaf0f8,
          emissive: 0x00b4d8,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'wind': {
      // Bright spring emerald & luminous jade
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0x00e676,
          emissive: 0x00c853,
          emissiveIntensity: 0.60,
          roughness: 0.25,
          metalness: 0.10,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xb9f6ca,
          emissive: 0x69f0ae,
          emissiveIntensity: 0.85,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xe8f5e9 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0x00e676,
          emissive: 0xb9f6ca,
          emissiveIntensity: 0.90,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0x66bb6a,
          emissive: 0x43a047,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'soil': {
      // Warm golden terracotta amber & sandstone gold
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xff8f00,
          emissive: 0xe65100,
          emissiveIntensity: 0.55,
          roughness: 0.35,
          metalness: 0.10,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xffe082,
          emissive: 0xffca28,
          emissiveIntensity: 0.75,
          roughness: 0.30,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xfff8e1 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xffa000,
          emissive: 0xff6f00,
          emissiveIntensity: 0.85,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xffb74d,
          emissive: 0xf57c00,
          emissiveIntensity: 0.65,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'trees': {
      // Tiny Groot warm golden cedar wood & fresh sprout green
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xb07238,
          emissive: 0x663d18,
          emissiveIntensity: 0.50,
          roughness: 0.65,
          metalness: 0.05,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0x4ade80,
          emissive: 0x22c55e,
          emissiveIntensity: 0.85,
          roughness: 0.40,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0x050403 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x4ade80,
          emissiveIntensity: 0.90,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0x86efac,
          emissive: 0x4ade80,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'dark': {
      // Luminous neon ultraviolet & vivid amethyst purple
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xba68c8,
          emissive: 0x8e24aa,
          emissiveIntensity: 0.60,
          roughness: 0.20,
          metalness: 0.20,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xea80fc,
          emissive: 0xd500f9,
          emissiveIntensity: 0.90,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xf3e5f5 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xab47bc,
          emissive: 0xce93d8,
          emissiveIntensity: 0.95,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0x9c27b0,
          emissive: 0x7b1fa2,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'light': {
      // Radiant solar ivory-gold & polished golden radiance
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xfff59d,
          emissive: 0xffee58,
          emissiveIntensity: 0.65,
          roughness: 0.20,
          metalness: 0.30,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xffa000,
          emissiveIntensity: 0.90,
          metalness: 0.85,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xffd700,
          emissive: 0xfff176,
          emissiveIntensity: 1.0,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xfff9c4,
          emissiveIntensity: 0.80,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'space': {
      // Vibrant cosmic nebula fuchsia & starlight pink
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xf06292,
          emissive: 0xe91e63,
          emissiveIntensity: 0.60,
          roughness: 0.20,
          metalness: 0.20,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xff80ab,
          emissive: 0xff4081,
          emissiveIntensity: 0.90,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xf50057,
          emissive: 0xff80ab,
          emissiveIntensity: 0.95,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xb388ff,
          emissive: 0x7c4dff,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'time': {
      // Bright gleaming clockwork gold & brilliant antique brass
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xffb74d,
          emissive: 0xff9800,
          emissiveIntensity: 0.55,
          roughness: 0.25,
          metalness: 0.40,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xffe082,
          emissive: 0xffd54f,
          emissiveIntensity: 0.85,
          metalness: 0.80,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xfff9c4 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xffb74d,
          emissive: 0xffa726,
          emissiveIntensity: 0.90,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xffcc80,
          emissive: 0xffb300,
          emissiveIntensity: 0.70,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'robot': {
      // Sleek luminous titanium silver-white & cyan neon
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xcfd8dc,
          emissive: 0x90a4ae,
          emissiveIntensity: 0.55,
          roughness: 0.20,
          metalness: 0.60,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x00b0ff,
          emissiveIntensity: 0.95,
          roughness: 0.15,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0x18ffff }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0x00e5ff,
          emissive: 0x84ffff,
          emissiveIntensity: 1.0,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xb0bec5,
          emissive: 0x80deea,
          emissiveIntensity: 0.70,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'healing': {
      // Radiant cherry blossom pink & fresh spring leaf green
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xff80ab,
          emissive: 0xf50057,
          emissiveIntensity: 0.60,
          roughness: 0.25,
          metalness: 0.10,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0x69f0ae,
          emissive: 0x00e676,
          emissiveIntensity: 0.85,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xffffff }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xff4081,
          emissive: 0xf8bbd0,
          emissiveIntensity: 0.95,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xb9f6ca,
          emissive: 0x69f0ae,
          emissiveIntensity: 0.75,
        }),
        highlightMat: whiteMat,
      };
    }

    case 'void': {
      // Brilliant striking crimson-ruby event horizon flare
      return {
        stickBodyMat: new THREE.MeshStandardMaterial({
          color: 0xff1744,
          emissive: 0xd50000,
          emissiveIntensity: 0.65,
          roughness: 0.20,
          metalness: 0.20,
        }),
        jointMat: new THREE.MeshStandardMaterial({
          color: 0xff5252,
          emissive: 0xff1744,
          emissiveIntensity: 0.95,
          roughness: 0.20,
        }),
        eyeMat: new THREE.MeshBasicMaterial({ color: 0xff8a80 }),
        coreMat: new THREE.MeshStandardMaterial({
          color: 0xff1744,
          emissive: 0xff5252,
          emissiveIntensity: 1.0,
        }),
        accentMat: new THREE.MeshStandardMaterial({
          color: 0xff8a80,
          emissive: 0xff5252,
          emissiveIntensity: 0.80,
        }),
        highlightMat: whiteMat,
      };
    }
  }
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
  const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);

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

    // Twin curved obsidian demon horns
    const hornGeo = new THREE.ConeGeometry(0.024, 0.18, 6);
    hornGeo.translate(0, 0.09, 0);

    const hornL = new THREE.Mesh(hornGeo, mats.jointMat);
    hornL.position.set(-0.08, 0.08, -0.02);
    hornL.rotation.set(-0.35, 0, 0.45);
    headMesh.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, mats.jointMat);
    hornR.position.set(0.08, 0.08, -0.02);
    hornR.rotation.set(-0.35, 0, -0.45);
    headMesh.add(hornR);

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
    // ── 🤖 Robot: Angular Cyber Mecha Helmet & Neon Scanner Visor ──
    const eyeContainer = new THREE.Group();
    eyeContainer.position.set(0, 0.02, 0.12);

    // Continuous neon cyan scanner visor
    const visorGeo = new THREE.BoxGeometry(0.14, 0.034, 0.03);
    const visor = new THREE.Mesh(visorGeo, mats.eyeMat);
    eyeContainer.add(visor);

    // Cyber antenna & ear comm discs
    const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 8), mats.jointMat);
    earL.rotateZ(Math.PI / 2);
    earL.position.set(-0.13, 0.02, 0);
    headMesh.add(earL);

    const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.025, 8), mats.jointMat);
    earR.rotateZ(Math.PI / 2);
    earR.position.set(0.13, 0.02, 0);
    headMesh.add(earR);

    const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.16, 6), mats.jointMat);
    antRod.position.set(0, 0.17, 0);
    headMesh.add(antRod);

    eyesMesh = new THREE.Mesh(new THREE.BufferGeometry(), mats.eyeMat);
    eyesMesh.add(eyeContainer);
    headMesh.add(eyesMesh);
  } else if (element === 'healing') {
    // ── 🌸 Healing: Cherry Blossom Petal Bonnet & Fairy Eyes ──
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

    // Floral blossom ear buds
    const petalL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), mats.coreMat);
    petalL.scale.set(0.8, 1.4, 0.4);
    petalL.position.set(-0.12, 0.04, 0);
    petalL.rotation.z = 0.45;
    headMesh.add(petalL);

    const petalR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), mats.coreMat);
    petalR.scale.set(0.8, 1.4, 0.4);
    petalR.position.set(0.12, 0.04, 0);
    petalR.rotation.z = -0.45;
    headMesh.add(petalR);

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
      // Hexagonal composite armor chest plate with digital heat vents
      const armorPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 6), mats.accentMat);
      armorPlate.position.set(0, 0.02, 0.015);
      torsoMesh.add(armorPlate);

      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.08), mats.jointMat);
      vent.position.set(0, 0.04, 0.02);
      torsoMesh.add(vent);
      break;
    }

    case 'healing': {
      // Flower petal tunic & vine leaf sash
      const petalTunic = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.20, 6), mats.coreMat);
      petalTunic.position.set(0, -0.02, 0);
      petalTunic.rotation.x = Math.PI;
      torsoMesh.add(petalTunic);
      break;
    }

    case 'dark': {
      // Ragged shadow shroud mantle
      const mantle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.06), mats.accentMat);
      mantle.position.set(0, 0.06, 0);
      torsoMesh.add(mantle);
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
  const armLimbGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8);
  armLimbGeo.translate(0, -0.08, 0);

  const handGeo = new THREE.SphereGeometry(0.035, 8, 8);

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
  const legLimbGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.2, 8);
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
