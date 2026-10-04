import { installSilenceMarker } from './silenceMarker';
import { createHealingEmblem, createHealingHeartGeometry, createHealingCrossGeometry } from './healingVitality';
import { createRobotHardware } from './robotHardware';
import { createChronometer, createTemporalHourglass } from './timeChronology';
import { createSpaceCrest, createCosmicLens, createSpaceWard, createCosmicMaterial } from './spaceCosmos';
import { installFallenLucifer } from './fallenLucifer';
import { installArchangelMichael } from './archangelMichael';
import { createLightCorona, createLightRay } from './lightRadiance';
import { createDarkCrest, createDarkMantle } from './darkNature';
import * as THREE from 'three';
import { createFireFlame } from './fireFlame';
import { createWaterCrown } from './waterMaterials';
import { createWindCrest } from './windCurrent';
import { createMineralCrest, createStoneMaterial, createStrataGeometry } from './soilStone';
import { createTreeCrest, createBarkMaterial, createLeafMaterial, createTreeBranch, createTreeLeafGeometry } from './treeNature';
import { createIceCrown } from './iceCrystal';
import { createElectricCrown } from './electricArc';
import { ElementType, StickMan3DCharacter, StickManMood } from '../types';
import { STICK_MAN_ARCHETYPES } from '../data/stickManArchetypes';
import {
  buildCharacterMaterials,
  buildCharacterHead,
  buildCharacterTorso,
  buildCharacterArms,
  buildCharacterLegs,
} from './characterArchetypeBuilders';
import { createHandMagicSeal } from './magicSeal3D';
import { installLightCharacterContrast } from './lightCharacterContrast';

// ── Shared Materials and Geometries Cache ──────────────────────────────
let cachedShadowTexture: THREE.CanvasTexture | null = null;
const cachedSealTextures: Map<ElementType, THREE.CanvasTexture> = new Map();

function getGroundShadowTexture(): THREE.CanvasTexture {
  if (cachedShadowTexture) return cachedShadowTexture;
  if (typeof document === 'undefined') return (null as unknown as THREE.CanvasTexture);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    grad.addColorStop(0.3, 'rgba(0, 0, 0, 0.5)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  cachedShadowTexture = new THREE.CanvasTexture(canvas);
  return cachedShadowTexture;
}

function getMagicSealTexture(element: ElementType): THREE.CanvasTexture {
  if (cachedSealTextures.has(element)) {
    return cachedSealTextures.get(element)!;
  }
  if (typeof document === 'undefined') return (null as unknown as THREE.CanvasTexture);

  const def = STICK_MAN_ARCHETYPES[element] || STICK_MAN_ARCHETYPES.fire;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = def.primaryColor;
    ctx.lineWidth = 4;

    // Outer circle
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dashed circle
    ctx.beginPath();
    ctx.setLineDash([8, 6]);
    ctx.arc(128, 128, 102, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Elemental geometric star / rune
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = 128 + Math.cos(angle) * 88;
      const y = 128 + Math.sin(angle) * 88;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Central symbol
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(def.symbol, 128, 130);
  }

  const tex = new THREE.CanvasTexture(canvas);
  cachedSealTextures.set(element, tex);
  return tex;
}

/**
 * Builds literal, prominent, unmistakable 3D elemental physical representations around the stick man's head
 */
function createHeadElementPower(
  element: ElementType,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color
): THREE.Group {
  const headFXGroup = new THREE.Group();
  headFXGroup.name = 'head-element-power';

  // Orbiting FX group for elements with rotating vortexes, motes, or planetary rings
  const orbitGroup = new THREE.Group();
  orbitGroup.name = 'head-orbit-fx';
  headFXGroup.add(orbitGroup);

  const glowMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    emissive: secondaryColor,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const coreMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    emissive: primaryColor,
    emissiveIntensity: 0.90,
    roughness: 0.18,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const whiteHotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1.0,
  });

  switch (element) {
    case 'fire': {
      // A swept flame crown, with warm inner tongues instead of rigid white cones.
      const amber = new THREE.MeshBasicMaterial({ color: 0xffd28a, toneMapped: false });
      const crownFlames = Array.from({ length: 5 }, (_, i) => {
        const flame = createFireFlame(.16, .28 + (2 - Math.abs(i - 2)) * .075, i * 3.7);
        flame.root.position.set((i - 2) * .06, .08, -.025);
        flame.root.rotation.z = -(i - 2) * .12;
        headFXGroup.add(flame.root);
        return flame;
      });
      headFXGroup.userData.updateFire = (time: number) => crownFlames.forEach(flame => flame.update(time));
      for (let i = 0; i < 6; i++) {
        const ember = new THREE.Mesh(new THREE.OctahedronGeometry(.012), amber);
        const angle = i / 6 * Math.PI * 2;
        ember.position.set(Math.cos(angle) * .16, .22 + (i % 3) * .09, Math.sin(angle) * .16);
        orbitGroup.add(ember);
      }
      break;
    }

    case 'water': {
      const crown = createWaterCrown();
      headFXGroup.add(crown.root);
      headFXGroup.userData.updateWater = crown.update;
      break;
    }

    case 'lightning': {
      const corona = createElectricCrown();
      headFXGroup.add(corona.root);
      headFXGroup.userData.updateLightning = corona.update;
      break;
    }

    case 'ice': {
      const crown = createIceCrown();
      headFXGroup.add(crown.root);
      headFXGroup.userData.updateIce = crown.update;
      break;
    }

    case 'wind': {
      const crest = createWindCrest();
      headFXGroup.add(crest.root);
      headFXGroup.userData.updateWind = crest.update;
      break;
    }

    case 'soil': {
      const crest = createMineralCrest();
      headFXGroup.add(crest.root);
      headFXGroup.userData.updateSoil = crest.update;
      break;
    }

    case 'dark': {
      const crest = createDarkCrest();
      headFXGroup.add(crest.root);
      headFXGroup.userData.updateDark = crest.update;
      break;
    }

    case 'light': {
      const corona = createLightCorona(.21);
      corona.root.position.set(0, .3, -.035);
      headFXGroup.add(corona.root);
      headFXGroup.userData.updateLight = corona.update;
      break;
    }

    case 'space': {
      const crest = createSpaceCrest(); headFXGroup.add(crest.root);
      headFXGroup.userData.updateSpace = crest.update;
      break;
    }

    case 'time': {
      const dial = createChronometer(.23);
      dial.root.name = 'time-fixed-clock-crown'; dial.root.position.set(0, .26, -.07);
      headFXGroup.add(dial.root); headFXGroup.userData.updateTime = dial.update;
      break;
    }

    case 'robot': {
      const hardware = createRobotHardware('head'); headFXGroup.add(hardware.root);
      headFXGroup.userData.updateRobot = hardware.update;
      break;
    }

    case 'healing': {
      const crest = createHealingEmblem(.115); crest.root.position.set(0, .23, .025);
      headFXGroup.add(crest.root); headFXGroup.userData.updateHealing = crest.update;
      break;
    }

    case 'trees': {
      const crown = createTreeCrest();
      headFXGroup.add(crown.root);
      headFXGroup.userData.updateTrees = crown.update;
      break;
    }

    case 'void': {
      // ── 🕳️ ABYSSAL SINGULARITY BLACK HOLE & CRIMSON ACCRETION DISK ──
      const voidGroup = new THREE.Group();
      voidGroup.position.set(0, 0.22, 0);

      // Central pitch-black singularity event horizon sphere
      const singularityMat = new THREE.MeshBasicMaterial({
        color: 0x0a0104,
        transparent: false,
        opacity: 1.0,
      });
      const singularityCore = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 16), singularityMat);
      voidGroup.add(singularityCore);

      // Glowing crimson/magenta accretion disk tilted around singularity
      const diskGeo = new THREE.TorusGeometry(0.18, 0.032, 10, 32);
      diskGeo.rotateX(Math.PI / 2.3);
      diskGeo.rotateZ(0.35);
      const accretionDisk = new THREE.Mesh(diskGeo, glowMat);
      voidGroup.add(accretionDisk);

      // Inner intense photon ring
      const innerPhotonGeo = new THREE.TorusGeometry(0.12, 0.016, 8, 24);
      innerPhotonGeo.rotateX(Math.PI / 2.3);
      innerPhotonGeo.rotateZ(0.35);
      const photonRing = new THREE.Mesh(innerPhotonGeo, whiteHotMat);
      voidGroup.add(photonRing);

      // 4 dark gravitational spike cones radiating outward
      for (let i = 0; i < 4; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.035, 0.22, 6);
        spikeGeo.translate(0, 0.11, 0);
        const spike = new THREE.Mesh(spikeGeo, coreMat);
        const ang = (i / 4) * Math.PI * 2;
        spike.position.set(Math.cos(ang) * 0.08, 0, Math.sin(ang) * 0.08);
        spike.rotation.z = Math.cos(ang) * -0.9;
        spike.rotation.x = Math.sin(ang) * 0.9;
        voidGroup.add(spike);
      }

      headFXGroup.add(voidGroup);

      // 4 orbiting dark matter motes
      for (let i = 0; i < 4; i++) {
        const darkMote = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), glowMat);
        const ang = (i / 4) * Math.PI * 2;
        darkMote.position.set(Math.cos(ang) * 0.24, 0.20 + (i % 2) * 0.08, Math.sin(ang) * 0.24);
        orbitGroup.add(darkMote);
      }
      break;
    }
  }

  return headFXGroup;
}

/**
 * Builds compact elemental features attached to the torso
 */
function createBodyElementPower(
  element: ElementType
): THREE.Group {
  const bodyFXGroup = new THREE.Group();
  bodyFXGroup.name = 'body-element-power';
  if (element === 'healing') {
    const core = createHealingEmblem(.055); core.root.position.set(0, .045, .115);
    bodyFXGroup.add(core.root); bodyFXGroup.userData.updateHealing = core.update;
  }
  if (element === 'robot') {
    const hardware = createRobotHardware('body'); bodyFXGroup.add(hardware.root);
    bodyFXGroup.userData.updateRobot = hardware.update;
  }
  if (element === 'light') {
    const feathers: ReturnType<typeof createLightRay>[] = [];
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
      const feather = createLightRay(.16 - i * .012, .025, .65, true);
      feather.root.position.set(side * .025, .02 - i * .018, -.05);
      feather.root.rotation.z = -side * (.75 + i * .12);
      bodyFXGroup.add(feather.root); feathers.push(feather);
    }
    bodyFXGroup.userData.updateLight = (time: number) => {
      feathers.forEach(feather => { feather.material.uniforms.uTime.value = time; });
    };
  }
  if (element === 'time') {
    const glass = createTemporalHourglass(.105); glass.root.position.set(0, .06, .1); bodyFXGroup.add(glass.root);
    const ward = createChronometer(.38); ward.root.position.set(0, .02, -.12); ward.root.visible = false; bodyFXGroup.add(ward.root);
    bodyFXGroup.userData.updateTime = (time: number, shielded = false) => { glass.update(time); ward.root.visible = shielded; ward.update(time, -1); };
  }
  if (element === 'space') {
    const core = createCosmicLens('blackhole', .095, .9);
    core.root.position.set(0, .045, .07); bodyFXGroup.add(core.root);
    const ward = createSpaceWard(.4); ward.root.position.y = .08;
    ward.root.visible = false; bodyFXGroup.add(ward.root);
    bodyFXGroup.userData.updateSpace = (time: number, shielded = false) => {
      core.update(time); ward.update(time, shielded);
    };
  }
  if (element === 'dark') {
    const mantle = createDarkMantle(); bodyFXGroup.add(mantle.root);
    bodyFXGroup.userData.updateDark = mantle.update;
  }
  if (element === 'trees') {
    const bark = createBarkMaterial('#69442B'), foliage = createLeafMaterial('#6D9E3E');
    const leaves: THREE.Mesh[] = [];
    for (const side of [-1, 1]) {
      const shoot = createTreeBranch(u => [side * (.025 + u * .075), -.06 + u * .21, .04 + Math.sin(u * Math.PI) * .02], .013, bark, 16);
      bodyFXGroup.add(shoot.root);
      for (let i = 0; i < 2; i++) {
        const leaf = new THREE.Mesh(createTreeLeafGeometry(.065), foliage);
        leaf.position.set(side * (.065 + i * .02), .02 + i * .04, .05); leaf.rotation.z = -side * .8;
        bodyFXGroup.add(leaf); leaves.push(leaf);
      }
    }
    bodyFXGroup.userData.updateTrees = (time: number) => {
      foliage.uniforms.uTime.value = time;
      leaves.forEach((leaf, i) => { leaf.rotation.z = (i < 2 ? .8 : -.8) + Math.sin(time * 1.7 + i) * .1; });
    };
  }
  if (element === 'soil') {
    const stone = createStoneMaterial('#957955'), ore = createStoneMaterial('#C2A778', 1, true);
    for (const side of [-1, 1]) {
      const plate = new THREE.Mesh(createStrataGeometry(.065, .12, .035, side), stone);
      plate.position.set(side * .065, .01, .03); plate.rotation.z = -side * .15;
      bodyFXGroup.add(plate);
      const seam = new THREE.Mesh(createStrataGeometry(.012, .07, .01, side), ore);
      seam.position.set(side * .061, .015, .055); seam.rotation.z = side * .2;
      bodyFXGroup.add(seam);
    }
  }
  return bodyFXGroup;
}
/**
 * Creates a Distinct Held Elemental Prop in hand that uniquely represents each element.
 * (e.g. Soil holds a Bedrock Fortress Shield, Fire holds an Adventurer's Torch, Water holds an Amphora, etc.)
 * Every element holds a completely distinct, iconic object.
 */
function createWeaponProp(
  element: ElementType,
  primaryColor: THREE.Color,
  secondaryColor: THREE.Color
): THREE.Object3D {
  const propGroup = new THREE.Group();
  propGroup.name = `prop-${element}`;

  // ── High-Contrast, Realistic Materials (Rich Real-World Substances) ──
  // These provide sharp contrast against the stick man's solid primary color,
  // preventing the item from looking like a flat, monochromatic emoji sticker.
  const polishedGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    emissive: 0xff8f00,
    emissiveIntensity: 0.55,
    metalness: 0.85,
    roughness: 0.22,
    transparent: false,
    opacity: 1.0,
  });

  const shinyBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: 0xaa8c2c,
    emissiveIntensity: 0.50,
    metalness: 0.9,
    roughness: 0.25,
    transparent: false,
    opacity: 1.0,
  });

  const gleamingSilverMat = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    emissive: 0x78909c,
    emissiveIntensity: 0.35,
    metalness: 0.9,
    roughness: 0.15,
    transparent: false,
    opacity: 1.0,
  });

  const darkIronMat = new THREE.MeshStandardMaterial({
    color: 0x263238,
    emissive: 0x10171a,
    emissiveIntensity: 0.25,
    metalness: 0.75,
    roughness: 0.45,
    transparent: false,
    opacity: 1.0,
  });

  const carvedWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4e342e,
    emissive: 0x271916,
    emissiveIntensity: 0.25,
    roughness: 0.85,
    metalness: 0.08,
    transparent: false,
    opacity: 1.0,
  });

  const terracottaClayMat = new THREE.MeshStandardMaterial({
    color: 0xd84315,
    emissive: 0xbf360c,
    emissiveIntensity: 0.45,
    roughness: 0.70,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const graniteSlateMat = new THREE.MeshStandardMaterial({
    color: 0x2b3336,
    emissive: 0x181f21,
    emissiveIntensity: 0.35,
    roughness: 0.85,
    metalness: 0.12,
    transparent: false,
    opacity: 1.0,
  });

  const agedParchmentMat = new THREE.MeshStandardMaterial({
    color: 0xf5eedb,
    emissive: 0xe0d6be,
    emissiveIntensity: 0.45,
    roughness: 0.9,
    metalness: 0.05,
    transparent: false,
    opacity: 1.0,
  });

  const leafGreenMat = new THREE.MeshStandardMaterial({
    color: 0x4caf50,
    emissive: 0x2e7d32,
    emissiveIntensity: 0.75,
    roughness: 0.6,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const whiteHotMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: false,
    opacity: 1.0,
  });

  // Elemental Vibrant Emissive Accents
  const vividFireRedMat = new THREE.MeshStandardMaterial({
    color: 0xff1744,
    emissive: 0xd50000,
    emissiveIntensity: 1.15,
    roughness: 0.15,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const vividFireGoldMat = new THREE.MeshStandardMaterial({
    color: 0xffea00,
    emissive: 0xffab00,
    emissiveIntensity: 1.25,
    roughness: 0.1,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
  });

  const vividWaterCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00e5ff,
    emissive: 0x00b0ff,
    emissiveIntensity: 1.15,
    roughness: 0.1,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const vividJadeGreenMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: 0x00c853,
    emissiveIntensity: 0.95,
    roughness: 0.25,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const vividElectricYellowMat = new THREE.MeshStandardMaterial({
    color: 0xffd600,
    emissive: 0xffff00,
    emissiveIntensity: 1.35,
    roughness: 0.1,
    metalness: 0.3,
    transparent: false,
    opacity: 1.0,
  });

  const vividGlacialIceMat = new THREE.MeshStandardMaterial({
    color: 0x80d8ff,
    emissive: 0x00b0ff,
    emissiveIntensity: 1.1,
    roughness: 0.1,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const vividVoidMagentaMat = new THREE.MeshStandardMaterial({
    color: 0xe040fb,
    emissive: 0xd500f9,
    emissiveIntensity: 1.25,
    roughness: 0.15,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  const vividRoseElixirMat = new THREE.MeshStandardMaterial({
    color: 0xff4081,
    emissive: 0xf50057,
    emissiveIntensity: 1.25,
    roughness: 0.15,
    metalness: 0.2,
    transparent: false,
    opacity: 1.0,
  });

  switch (element) {
    case 'soil': {
      const shield = new THREE.Group(); shield.name = 'soil-strata-focus';
      shield.position.set(.02, .06, .05); shield.rotation.set(.12, .2, -.05);
      const stone = createStoneMaterial('#796249'), ore = createStoneMaterial('#C8AC78', 1, true);
      for (let row = 0; row < 3; row++) {
        const plate = new THREE.Mesh(createStrataGeometry(.23, .13, .045, row), stone);
        plate.position.y = (row - 1) * .12; shield.add(plate);
      }
      for (let i = 0; i < 3; i++) {
        const crystal = new THREE.Mesh(createStrataGeometry(.022, .09 - i * .018, .022, i), ore);
        crystal.position.set((i - 1) * .024, .01, .04); crystal.rotation.z = (i - 1) * .23; shield.add(crystal);
      }
      propGroup.add(shield);
      break;
    }

    case 'fire': {
      // ── 🔥 FIRE: BLAZING ADVENTURER'S TORCH ──
      // Carved dark oak handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.48, 8), carvedWoodMat);
      handle.position.y = 0.02;
      propGroup.add(handle);

      // Wrought-iron grip wrapping bands
      [-0.10, 0.10].forEach((by) => {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.032, 8), darkIronMat);
        band.position.y = by;
        propGroup.add(band);
      });

      // Heavy wrought-iron brazier sconce basket
      const sconce = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.035, 0.10, 8), darkIronMat);
      sconce.position.y = 0.28;
      propGroup.add(sconce);

      const sconceRim = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.014, 6, 16), polishedGoldMat);
      sconceRim.position.y = 0.33;
      sconceRim.rotation.x = Math.PI / 2;
      propGroup.add(sconceRim);

      // Roaring 3D flame tongues
      const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.072, 0.26, 6), vividFireRedMat);
      outerFlame.position.set(0, 0.44, 0);
      propGroup.add(outerFlame);

      const midFlame = new THREE.Mesh(new THREE.ConeGeometry(0.050, 0.20, 6), vividFireGoldMat);
      midFlame.position.set(0, 0.43, 0.01);
      propGroup.add(midFlame);

      const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.12, 6), whiteHotMat);
      flameCore.position.set(0, 0.40, 0.015);
      propGroup.add(flameCore);

      // Rising spark embers
      const ember1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), whiteHotMat);
      ember1.position.set(-0.04, 0.60, 0.02);
      propGroup.add(ember1);

      const ember2 = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), vividFireGoldMat);
      ember2.position.set(0.045, 0.65, -0.02);
      propGroup.add(ember2);
      break;
    }

    case 'water': {
      // ── 💧 WATER: SACRED WATER AMPHORA / URN ──
      const urnGroup = new THREE.Group();
      urnGroup.position.set(0, 0.08, 0.06);
      urnGroup.rotation.set(0.55, 0.20, -0.15); // tilted forward pouring stream

      // Terracotta clay vase belly
      const bellyGeo = new THREE.SphereGeometry(0.10, 12, 10);
      bellyGeo.scale(1.0, 1.35, 1.0);
      const belly = new THREE.Mesh(bellyGeo, terracottaClayMat);
      urnGroup.add(belly);

      // Gold decorative belt around waist
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.014, 6, 20), polishedGoldMat);
      belt.rotation.x = Math.PI / 2;
      urnGroup.add(belt);

      // Urn neck & lip
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.068, 0.11, 10), terracottaClayMat);
      neck.position.y = 0.15;
      urnGroup.add(neck);

      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.015, 6, 16), polishedGoldMat);
      lip.position.y = 0.205;
      lip.rotation.x = Math.PI / 2;
      urnGroup.add(lip);

      // Twin loop handles
      [-1, 1].forEach((dir) => {
        const handleMesh = new THREE.Mesh(
          new THREE.TorusGeometry(0.058, 0.014, 6, 12, Math.PI),
          polishedGoldMat
        );
        handleMesh.position.set(dir * 0.095, 0.10, 0);
        handleMesh.rotation.z = -dir * Math.PI / 2;
        urnGroup.add(handleMesh);
      });

      // Thick sculpted cascading liquid water stream
      const streamGeo = new THREE.CylinderGeometry(0.026, 0.052, 0.36, 8);
      streamGeo.translate(0, 0.18, 0);
      const stream = new THREE.Mesh(streamGeo, vividWaterCyanMat);
      stream.position.set(0, 0.20, 0);
      stream.rotation.x = 0.65;
      urnGroup.add(stream);

      // Splashing water crest droplets
      const splash1 = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), whiteHotMat);
      splash1.position.set(0, 0.40, 0.20);
      urnGroup.add(splash1);

      const splash2 = new THREE.Mesh(new THREE.SphereGeometry(0.026, 6, 6), vividWaterCyanMat);
      splash2.position.set(0.045, 0.46, 0.25);
      urnGroup.add(splash2);

      propGroup.add(urnGroup);
      break;
    }

    case 'wind': {
      // ── 🍃 WIND: GALE FEATHER WAR FAN (TESSEN) ──
      const fanGroup = new THREE.Group();
      fanGroup.position.set(0, 0.08, 0.04);
      fanGroup.rotation.set(-0.25, 0.15, -0.10);

      // Black lacquered bamboo handle
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.18, 6), darkIronMat);
      handle.position.y = -0.06;
      fanGroup.add(handle);

      const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.028, 8), polishedGoldMat);
      pivot.position.y = 0.03;
      fanGroup.add(pivot);

      // Silk cord tassel
      const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.14, 6), vividFireRedMat);
      tassel.position.y = -0.20;
      tassel.rotation.x = Math.PI;
      fanGroup.add(tassel);

      // 7 radiating emerald-jade feather blades in wide arc
      const bladeAngles = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
      bladeAngles.forEach((ang, idx) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.30, 0.016), darkIronMat);
        rib.position.set(Math.sin(ang) * 0.14, Math.cos(ang) * 0.14, 0);
        rib.rotation.z = -ang;
        fanGroup.add(rib);

        const leafPlate = new THREE.Mesh(
          new THREE.BoxGeometry(0.052, 0.27, 0.010),
          idx % 2 === 0 ? vividJadeGreenMat : polishedGoldMat
        );
        leafPlate.position.set(Math.sin(ang) * 0.15, Math.cos(ang) * 0.15, 0.006);
        leafPlate.rotation.z = -ang;
        fanGroup.add(leafPlate);
      });

      // Golden wind border arc
      const borderArc = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.016, 6, 20, Math.PI * 0.72),
        polishedGoldMat
      );
      borderArc.position.y = 0.03;
      borderArc.rotation.z = -Math.PI * 0.86;
      fanGroup.add(borderArc);

      propGroup.add(fanGroup);
      break;
    }

    case 'lightning': {
      // ── ⚡ LIGHTNING: TESLA RESONANCE TUNING FORK ──
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 8), darkIronMat);
      handle.position.y = 0.02;
      propGroup.add(handle);

      [-0.06, 0.06].forEach((pos) => {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.012, 6, 16), polishedGoldMat);
        coil.position.y = pos;
        coil.rotation.x = Math.PI / 2;
        propGroup.add(coil);
      });

      // Heavy chrome capacitor sphere
      const capacitor = new THREE.Mesh(new THREE.SphereGeometry(0.060, 12, 12), gleamingSilverMat);
      capacitor.position.y = 0.18;
      propGroup.add(capacitor);

      const plasmaCore = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), vividElectricYellowMat);
      plasmaCore.position.y = 0.18;
      propGroup.add(plasmaCore);

      // Twin conductor prongs
      const prongL = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.28, 0.026), gleamingSilverMat);
      prongL.position.set(-0.07, 0.32, 0);
      propGroup.add(prongL);

      const prongR = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.28, 0.026), gleamingSilverMat);
      prongR.position.set(0.07, 0.32, 0);
      propGroup.add(prongR);

      [-0.07, 0.07].forEach((px) => {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.07, 6), polishedGoldMat);
        tip.position.set(px, 0.47, 0);
        propGroup.add(tip);
      });

      // Crackling horizontal electric arc bridge
      const arc = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.032, 0.032), whiteHotMat);
      arc.position.set(0, 0.41, 0);
      arc.rotation.z = 0.15;
      propGroup.add(arc);

      const sparkOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.044, 0), vividElectricYellowMat);
      sparkOrb.position.set(0, 0.41, 0);
      propGroup.add(sparkOrb);
      break;
    }

    case 'ice': {
      // ── ❄️ ICE: GLACIAL MOUNTAINEER ICE AXE ──
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.52, 8), darkIronMat);
      shaft.position.y = 0.04;
      propGroup.add(shaft);

      const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.09, 4), gleamingSilverMat);
      pommel.position.y = -0.26;
      pommel.rotation.x = Math.PI;
      propGroup.add(pommel);

      const collar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.045), gleamingSilverMat);
      collar.position.y = 0.26;
      propGroup.add(collar);

      // Sharp forward-curved glacial blue ice pick tooth
      const pickGeo = new THREE.ConeGeometry(0.038, 0.24, 4);
      pickGeo.translate(0, 0.12, 0);
      const pick = new THREE.Mesh(pickGeo, vividGlacialIceMat);
      pick.position.set(0.02, 0.26, 0);
      pick.rotation.z = -1.35;
      propGroup.add(pick);

      const pickTip = new THREE.Mesh(new THREE.ConeGeometry(0.020, 0.09, 4), whiteHotMat);
      pickTip.position.set(0.13, 0.15, 0);
      pickTip.rotation.z = -1.35;
      propGroup.add(pickTip);

      // Rear flat steel adze blade
      const adze = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.032, 0.028), gleamingSilverMat);
      adze.position.set(-0.060, 0.26, 0);
      propGroup.add(adze);

      const crownCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.042, 0), vividGlacialIceMat);
      crownCrystal.position.y = 0.31;
      propGroup.add(crownCrystal);
      break;
    }

    case 'light': {
      // ── ✨ LIGHT: CELESTIAL SUN LANTERN ──
      const lanternGroup = new THREE.Group();
      lanternGroup.position.set(0, 0.04, 0.06);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 6, 16), polishedGoldMat);
      ring.position.y = 0.18;
      lanternGroup.add(ring);

      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.08, 6), darkIronMat);
      chain.position.y = 0.11;
      lanternGroup.add(chain);

      // Hexagonal gilded roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.072, 6), polishedGoldMat);
      roof.position.y = 0.06;
      lanternGroup.add(roof);

      // 6 dark bronze cage struts
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.18, 6), darkIronMat);
        strut.position.set(Math.cos(ang) * 0.086, -0.04, Math.sin(ang) * 0.086);
        lanternGroup.add(strut);
      }

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.028, 6), polishedGoldMat);
      base.position.y = -0.14;
      lanternGroup.add(base);

      const lanternSun = createLightCorona(.065);
      lanternSun.root.position.y = -.04;
      lanternGroup.add(lanternSun.root);

      propGroup.add(lanternGroup);
      break;
    }

    case 'dark': {
      // ── 🌑 DARK: GRIMOIRE OF VOID SHADOWS ──
      const bookGroup = new THREE.Group();
      bookGroup.position.set(0.02, 0.08, 0.08);
      bookGroup.rotation.set(-0.45, 0.25, 0.12); // tilted open toward viewer

      // Dark obsidian leather tome cover
      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.042, 0.38), darkIronMat);
      bookGroup.add(cover);

      // Golden corner brackets
      [
        [-0.14, -0.17],
        [0.14, -0.17],
        [-0.14, 0.17],
        [0.14, 0.17],
      ].forEach(([cx, cz]) => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.046, 0.04), polishedGoldMat);
        bracket.position.set(cx, 0, cz);
        bookGroup.add(bracket);
      });

      // Aged cream parchment pages
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.034, 0.35), agedParchmentMat);
      pages.position.y = 0.022;
      bookGroup.add(pages);

      // Glowing demonic void eye sigil
      const eyeSigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.052, 0), vividVoidMagentaMat);
      eyeSigil.position.set(0, 0.046, 0);
      eyeSigil.scale.set(1.5, 0.3, 0.85);
      bookGroup.add(eyeSigil);

      // Floating shadow wisps
      const wisp1 = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), vividVoidMagentaMat);
      wisp1.position.set(-0.07, 0.11, 0.05);
      bookGroup.add(wisp1);

      const wisp2 = new THREE.Mesh(new THREE.SphereGeometry(0.020, 6, 6), whiteHotMat);
      wisp2.position.set(0.07, 0.13, -0.04);
      bookGroup.add(wisp2);

      propGroup.add(bookGroup);
      break;
    }

    case 'space': {
      const lens = createCosmicLens('wormhole', .12);
      lens.root.position.set(0, .16, .04); propGroup.add(lens.root);
      propGroup.userData.updateSpace = lens.update;
      break;
    }

    case 'time': {
      const glass = createTemporalHourglass(.24); glass.root.position.set(0, .08, .06);
      propGroup.add(glass.root); propGroup.userData.updateTime = glass.update;
      break;
    }

    case 'robot': {
      // ── 🤖 ROBOT: SCI-FI CYBER PLASMA BLASTER ──
      const gunGroup = new THREE.Group();
      gunGroup.position.set(0, 0.06, 0.06);
      gunGroup.rotation.x = -0.18; // aimed forward

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.044), darkIronMat);
      grip.position.set(0, -0.055, -0.028);
      grip.rotation.x = 0.28;
      gunGroup.add(grip);

      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.075, 0.21), darkIronMat);
      receiver.position.set(0, 0.038, 0.06);
      gunGroup.add(receiver);

      // Glowing plasma battery cell
      const battery = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.038, 0.13), vividWaterCyanMat);
      battery.position.set(0, 0.038, 0.06);
      gunGroup.add(battery);

      // Top holographic sight scope
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.13, 8), gleamingSilverMat);
      scope.position.set(0, 0.090, 0.05);
      scope.rotation.x = Math.PI / 2;
      gunGroup.add(scope);

      // Plasma emitter barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.15, 8), gleamingSilverMat);
      barrel.position.set(0, 0.038, 0.22);
      barrel.rotation.x = Math.PI / 2;
      gunGroup.add(barrel);

      const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.028, 8), whiteHotMat);
      muzzle.position.set(0, 0.038, 0.30);
      muzzle.rotation.x = Math.PI / 2;
      gunGroup.add(muzzle);

      propGroup.add(gunGroup);
      break;
    }

    case 'healing': {
      const vial = new THREE.Group(); vial.name = 'healing-apothecary-vial'; vial.position.set(0, .04, .06);
      const flask = new THREE.Mesh(new THREE.CapsuleGeometry(.065, .12, 4, 12), vividRoseElixirMat); vial.add(flask);
      const seal = new THREE.Mesh(createHealingCrossGeometry(.026), gleamingSilverMat); seal.position.set(0, 0, .072); vial.add(seal);
      const stopper = new THREE.Mesh(new THREE.BoxGeometry(.10, .032, .07), gleamingSilverMat); stopper.position.y = .14; vial.add(stopper);
      const heart = new THREE.Mesh(createHealingHeartGeometry(.034), vividRoseElixirMat); heart.position.set(0, .17, 0); vial.add(heart);
      propGroup.add(vial); break;
    }

    case 'trees': {
      // ── 🌿 TREES: ANCIENT IRONWOOD GREATSTAFF ──
      const staffGroup = new THREE.Group();
      staffGroup.position.set(0, -0.05, 0.08);

      // Long wooden staff
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.020, 0.65, 8), carvedWoodMat);
      staffGroup.add(shaft);

      // Brass bottom ferrule
      const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 8), polishedGoldMat);
      ferrule.position.y = -0.30;
      staffGroup.add(ferrule);

      // Top sprouting branch fork
      const fork = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 6, 12, Math.PI), carvedWoodMat);
      fork.position.y = 0.32;
      staffGroup.add(fork);

      // Emerald life gem nestled in the fork
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.045, 0), leafGreenMat);
      gem.position.y = 0.34;
      staffGroup.add(gem);

      // Sprouting verdant leaves
      const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.035), leafGreenMat);
      l1.position.set(-0.06, 0.36, 0);
      l1.rotation.z = 0.45;
      staffGroup.add(l1);

      const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.016, 0.035), leafGreenMat);
      l2.position.set(0.06, 0.36, 0);
      l2.rotation.z = -0.45;
      staffGroup.add(l2);

      propGroup.add(staffGroup);
      break;
    }

    case 'void': {
      // ── 🕳️ VOID: EVENT HORIZON SINGULARITY SCYTHE ──
      const scytheGroup = new THREE.Group();
      scytheGroup.position.set(0, -0.05, 0.08);

      // Obsidian staff pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.68, 8), darkIronMat);
      scytheGroup.add(pole);

      // Top nexus socket
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), darkIronMat);
      socket.position.y = 0.33;
      scytheGroup.add(socket);

      // Singularity core in socket
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), whiteHotMat);
      core.position.y = 0.33;
      scytheGroup.add(core);

      // Curved scythe blade
      const bladeGeo = new THREE.BoxGeometry(0.015, 0.28, 0.06);
      bladeGeo.translate(0, 0.14, 0.02);
      const blade = new THREE.Mesh(bladeGeo, graniteSlateMat);
      blade.position.set(0, 0.33, 0);
      blade.rotation.x = -1.25;
      scytheGroup.add(blade);

      // Crimson void energy cutting edge
      const edgeGeo = new THREE.BoxGeometry(0.008, 0.26, 0.018);
      edgeGeo.translate(0, 0.14, 0.05);
      const edge = new THREE.Mesh(edgeGeo, vividFireRedMat);
      edge.position.set(0, 0.33, 0);
      edge.rotation.x = -1.25;
      scytheGroup.add(edge);

      propGroup.add(scytheGroup);
      break;
    }
  }

  return propGroup;
}

/**
 * Creates an Articulated, Procedurally Rigged 3D Stick Man Character
 */
export function createStickMan3DCharacter(
  id: string,
  element: ElementType,
  scaleVariant: number = 1.0
): StickMan3DCharacter {
  const def = STICK_MAN_ARCHETYPES[element] || STICK_MAN_ARCHETYPES.fire;
  const primaryColor = new THREE.Color(def.primaryColor);
  const secondaryColor = new THREE.Color(def.secondaryColor);

  const group = new THREE.Group();
  group.name = `stickman-${id}`;

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.55; // center on ground
  group.add(bodyGroup);

  // ── Bespoke Physical Materials per Element Archetype ──────────────────
  const materials = buildCharacterMaterials(element, primaryColor, secondaryColor);

  // ── 1. Bespoke Head & Eyes ───────────────────────────────────────────
  const { headMesh, eyesMesh } = buildCharacterHead(element, bodyGroup, materials);

  // ── 2. Bespoke Torso & Armor Overlay ─────────────────────────────────
  const { torsoMesh, powerCoreMesh } = buildCharacterTorso(element, bodyGroup, materials);

  // ── 3. Bespoke Articulated Arms & Limb Features ──────────────────────
  const { leftArm, rightArm } = buildCharacterArms(element, bodyGroup, materials);

  // [TEMPORARILY COMMENTED OUT PER USER REQUEST: HELD ELEMENTAL ITEMS]
  const weaponMesh: THREE.Object3D | undefined = undefined;

  // ── 4. Bespoke Articulated Legs & Feet ───────────────────────────────
  const { leftLeg, rightLeg } = buildCharacterLegs(element, bodyGroup, materials);


  // ── 5. Elemental Powers around Head & Body ──────────────────────────
  const headElementGroup = createHeadElementPower(element, primaryColor, secondaryColor);
  headElementGroup.scale.set(0.78, 0.78, 0.78); // Proportional scale matching smaller head
  headMesh.add(headElementGroup);

  const bodyElementGroup = createBodyElementPower(element);
  bodyGroup.add(bodyElementGroup);

  // Full volumetric Spirit World seal. Its origin is the casting palm and its
  // front normal is updated toward the caster by the animation system.
  const handMagicSeal = createHandMagicSeal(element, def.primaryColor, def.secondaryColor, torsoMesh);
  handMagicSeal.position.set(0, 0, 0);
  rightArm.hand.add(handMagicSeal);

  // ── 6. Ground Solid Contact Ring & Marker (100% Solid, Zero Transparency) ─
  const ringGeo = new THREE.RingGeometry(0.26, 0.32, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1.0,
  });
  const magicSealMesh = new THREE.Mesh(ringGeo, ringMat);
  magicSealMesh.rotation.x = -Math.PI / 2;
  magicSealMesh.position.y = 0.01;
  group.add(magicSealMesh);
  if (element === 'robot') {
    ringMat.visible = false;
    const hardware = createRobotHardware('ground'); magicSealMesh.add(hardware.root);
    magicSealMesh.userData.updateRobot = hardware.update;
  }
  if (element === 'light') {
    ringMat.visible = false;
    const pool = createLightCorona(.24);
    magicSealMesh.add(pool.root);
    magicSealMesh.userData.updateLight = pool.update;
  }


  if (element === 'space') {
    ringMat.visible = false;
    const fabric = createCosmicLens('metric', .38, .55);
    magicSealMesh.add(fabric.root);
    magicSealMesh.userData.updateSpace = fabric.update;
  }

  if (element === 'time') {
    ringMat.visible = false;
    const dial = createChronometer(.34); magicSealMesh.add(dial.root); magicSealMesh.userData.updateTime = (time: number) => dial.update(time, -1);
  }

  if (element === 'healing') {
    ringMat.visible = false;
    const refuge = createHealingEmblem(.24); magicSealMesh.add(refuge.root);
    magicSealMesh.userData.updateHealing = refuge.update;
  }

  // Solid Inner Accent Dot
  const dotGeo = new THREE.CircleGeometry(0.08, 16);
  const dotMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1.0,
  });
  const shadowMesh = new THREE.Mesh(dotGeo, dotMat);
  shadowMesh.name = 'ground-shadow';
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.012;
  group.add(shadowMesh);

  // ── 8. Power Beam (Summon / Special Move FX) ────────────────────────
  const beamGeo = element === 'robot' ? new THREE.BoxGeometry(.02, 2.8, .02) : element === 'space' ? new THREE.PlaneGeometry(.85, 2.8)
    : new THREE.CylinderGeometry(0.3, 0.6, 4.0, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    visible: false,
  });
  const powerBeamMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.ShaderMaterial>(beamGeo, element === 'space' ? createCosmicMaterial('wormhole') : beamMat);
  if (element === 'space') { powerBeamMesh.material.visible = false; powerBeamMesh.material.opacity = 0; }
  powerBeamMesh.position.y = 2.0;
  group.add(powerBeamMesh);

  // Shockwave Ring
  const waveGeo = element === 'robot' ? new THREE.PlaneGeometry(.65, .015) : element === 'space' ? new THREE.PlaneGeometry(.9, .9)
    : new THREE.RingGeometry(0.25, 0.45, 24);
  const waveMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    visible: false,
  });
  const shockwaveMesh = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial | THREE.ShaderMaterial>(waveGeo, element === 'space' ? createCosmicMaterial('metric') : waveMat);
  if (element === 'space') { shockwaveMesh.material.visible = false; shockwaveMesh.material.opacity = 0; }
  shockwaveMesh.rotation.x = -Math.PI / 2;
  shockwaveMesh.position.y = 0.03;
  group.add(shockwaveMesh);

  if (element === 'time') {
    // Preserve animation handles while replacing the generic beam and ring silhouettes.
    powerBeamMesh.geometry.dispose(); powerBeamMesh.geometry = new THREE.BufferGeometry();
    const hourglass = createTemporalHourglass(.48); hourglass.root.position.y = -1.35;
    powerBeamMesh.material.opacity = 0; hourglass.root.visible = false;
    powerBeamMesh.add(hourglass.root); powerBeamMesh.userData.updateTime = hourglass.update;
    shockwaveMesh.geometry.dispose(); shockwaveMesh.geometry = new THREE.BufferGeometry();
    const dial = createChronometer(.42); shockwaveMesh.material.opacity = 0; dial.root.visible = false; shockwaveMesh.add(dial.root); shockwaveMesh.userData.updateTime = (time: number) => dial.update(time, -1);
  }

  // ── 9. Hitbox for Raycasting (Clicking on character) ────────────────
  if (element === 'healing') {
    powerBeamMesh.geometry.dispose(); powerBeamMesh.geometry = new THREE.BufferGeometry();
    powerBeamMesh.material.opacity = 0;
    powerBeamMesh.rotation.y = 0;
    const pulse = createHealingEmblem(.32); pulse.root.position.y = -1.3;
    pulse.root.visible = false;
    powerBeamMesh.add(pulse.root); powerBeamMesh.userData.updateHealing = pulse.update;
    shockwaveMesh.geometry.dispose(); shockwaveMesh.geometry = new THREE.BufferGeometry();
    shockwaveMesh.material.opacity = 0;
    const mend = createHealingEmblem(.34); mend.root.visible = false;
    shockwaveMesh.add(mend.root); shockwaveMesh.userData.updateHealing = mend.update;
  }

  const hitBoxGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBoxMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBoxMesh.position.y = 0.55;
  group.add(hitBoxMesh);

  // Scale: Tiny! Uniform across all characters (~0.44)
  const baseScale = scaleVariant * 0.44;
  group.scale.set(baseScale, baseScale, baseScale);

  const character: StickMan3DCharacter = {
    id,
    element,
    group,
    bodyGroup,
    headMesh,
    eyesMesh,
    torsoMesh,
    powerCoreMesh,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    headElementGroup,
    bodyElementGroup,
    magicSealMesh,
    handMagicSeal,
    shadowMesh,
    powerBeamMesh,
    shockwaveMesh,
    hitBoxMesh,
    weaponMesh,
    mood: 'idle',
    animTime: Math.random() * 10,
    walkCycle: 0,
    castAnimationTime: 0,
    targetPosition: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    scale: baseScale,
    baseY: 0,
    wanderTimer: Math.random() * 4,
    dialogue: def.dialogueQuote,
    districtIndex: 0,
    patrolWaypoints: [],
    waypointIdx: 0,
    isRallyMoving: false,
  };
  installSilenceMarker(character);
  installArchangelMichael(character);
  installFallenLucifer(character);
  if (element === 'light') installLightCharacterContrast(group);
  return character;
}
