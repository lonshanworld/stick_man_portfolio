import * as THREE from 'three';
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
      // ── 🔥 LITERAL BLAZING FIRE ON HEAD ──
      // 7 roaring flame tongues rising and curling upward
      const flameConfigs = [
        { x: 0, z: -0.02, height: 0.48, radius: 0.065, rotX: -0.22, rotZ: 0, mat: glowMat },
        { x: -0.08, z: -0.04, height: 0.40, radius: 0.052, rotX: -0.30, rotZ: 0.38, mat: coreMat },
        { x: 0.08, z: -0.04, height: 0.40, radius: 0.052, rotX: -0.30, rotZ: -0.38, mat: coreMat },
        { x: -0.14, z: 0.0, height: 0.30, radius: 0.042, rotX: -0.18, rotZ: 0.70, mat: glowMat },
        { x: 0.14, z: 0.0, height: 0.30, radius: 0.042, rotX: -0.18, rotZ: -0.70, mat: glowMat },
        { x: 0, z: 0.06, height: 0.32, radius: 0.045, rotX: 0.15, rotZ: 0, mat: glowMat },
        { x: 0, z: -0.10, height: 0.35, radius: 0.048, rotX: -0.45, rotZ: 0, mat: coreMat },
      ];

      flameConfigs.forEach((cfg) => {
        const coneGeo = new THREE.ConeGeometry(cfg.radius, cfg.height, 8);
        coneGeo.translate(0, cfg.height / 2, 0);
        const flameMesh = new THREE.Mesh(coneGeo, cfg.mat);
        flameMesh.position.set(cfg.x, 0.12, cfg.z);
        flameMesh.rotation.set(cfg.rotX, 0, cfg.rotZ);
        headFXGroup.add(flameMesh);

        // Blazing incandescent white-hot inner flame core
        const coreGeo = new THREE.ConeGeometry(cfg.radius * 0.45, cfg.height * 0.55, 6);
        coreGeo.translate(0, (cfg.height * 0.55) / 2, 0);
        const coreMesh = new THREE.Mesh(coreGeo, whiteHotMat);
        coreMesh.position.set(cfg.x, 0.12, cfg.z + 0.01);
        coreMesh.rotation.set(cfg.rotX, 0, cfg.rotZ);
        headFXGroup.add(coreMesh);
      });

      // 4 rising fire ember motes
      for (let i = 0; i < 4; i++) {
        const emberGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const ember = new THREE.Mesh(emberGeo, glowMat);
        const ang = (i / 4) * Math.PI * 2;
        ember.position.set(Math.cos(ang) * 0.18, 0.28 + (i % 2) * 0.12, Math.sin(ang) * 0.18);
        orbitGroup.add(ember);
      }
      break;
    }

    case 'water': {
      // ── 💧 SWIRLING LIQUID WATER VORTEX & SPLASH WAVES ──
      // Main swirling liquid hydro vortex ring
      const torusGeo = new THREE.TorusGeometry(0.22, 0.042, 12, 32);
      torusGeo.rotateX(Math.PI / 2.3);
      const waterVortex = new THREE.Mesh(torusGeo, coreMat);
      waterVortex.position.y = 0.16;
      orbitGroup.add(waterVortex);

      // 3 curved ocean wave splash crests rising from the vortex
      for (let i = 0; i < 3; i++) {
        const waveGeo = new THREE.ConeGeometry(0.045, 0.32, 8);
        waveGeo.scale(0.6, 1.2, 1.6);
        waveGeo.translate(0, 0.16, 0);
        const wave = new THREE.Mesh(waveGeo, glowMat);
        const ang = (i / 3) * Math.PI * 2;
        wave.position.set(Math.cos(ang) * 0.16, 0.14, Math.sin(ang) * 0.16);
        wave.rotation.set(-0.35, -ang, 0.4);
        orbitGroup.add(wave);
      }

      // 5 liquid water droplet spheres splashing around head
      for (let i = 0; i < 5; i++) {
        const dropGeo = new THREE.SphereGeometry(0.05, 12, 12);
        dropGeo.scale(0.8, 1.3, 0.8);
        const drop = new THREE.Mesh(dropGeo, glowMat);
        const ang = (i / 5) * Math.PI * 2 + 0.3;
        drop.position.set(Math.cos(ang) * 0.24, 0.18 + (i % 2) * 0.14, Math.sin(ang) * 0.24);
        orbitGroup.add(drop);
      }
      break;
    }

    case 'lightning': {
      // ── ⚡ CRACKLING ZIGZAG ELECTRIC LIGHTNING ARCS & SPURTS ──
      const createJaggedBolt = (angle: number, lengthScale: number) => {
        const boltGroup = new THREE.Group();
        boltGroup.rotation.y = angle;

        // Segment 1: projecting out from head
        const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), glowMat);
        seg1.position.set(0.05, 0.08, 0);
        seg1.rotation.z = -0.7;
        boltGroup.add(seg1);

        // Segment 2: jagged angle inward
        const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.16 * lengthScale, 0.035), coreMat);
        seg2.position.set(0.14, 0.18, 0);
        seg2.rotation.z = 0.65;
        boltGroup.add(seg2);

        // Segment 3: sharp electric lightning tip pointing up and out
        const seg3Geo = new THREE.ConeGeometry(0.04, 0.18 * lengthScale, 6);
        seg3Geo.translate(0, 0.09, 0);
        const seg3 = new THREE.Mesh(seg3Geo, whiteHotMat);
        seg3.position.set(0.08, 0.30 * lengthScale, 0);
        seg3.rotation.z = -0.8;
        boltGroup.add(seg3);

        return boltGroup;
      };

      // 4 multi-directional lightning bolts crackling around head
      headFXGroup.add(createJaggedBolt(-Math.PI / 2.8, 1.1));
      headFXGroup.add(createJaggedBolt(Math.PI / 2.8, 1.1));
      headFXGroup.add(createJaggedBolt(-Math.PI * 0.75, 0.9));
      headFXGroup.add(createJaggedBolt(Math.PI * 0.75, 0.9));

      // Central high-voltage lightning spear needle
      const needleGeo = new THREE.ConeGeometry(0.04, 0.36, 6);
      needleGeo.translate(0, 0.18, 0);
      const needle = new THREE.Mesh(needleGeo, whiteHotMat);
      needle.position.set(0, 0.14, 0);
      headFXGroup.add(needle);
      break;
    }

    case 'ice': {
      // ── ❄️ FROZEN GLACIAL ICICLES & ICE CRYSTALS ──
      // 7 sharp crystalline icicle needles protruding in all directions
      const icicleConfigs = [
        { x: 0, z: -0.02, height: 0.46, radius: 0.065, rotZ: 0, rotX: -0.15, mat: whiteHotMat },
        { x: -0.12, z: 0.02, height: 0.38, radius: 0.055, rotZ: 0.55, rotX: -0.1, mat: glowMat },
        { x: 0.12, z: 0.02, height: 0.38, radius: 0.055, rotZ: -0.55, rotX: -0.1, mat: glowMat },
        { x: -0.08, z: -0.08, height: 0.34, radius: 0.05, rotZ: 0.35, rotX: -0.45, mat: coreMat },
        { x: 0.08, z: -0.08, height: 0.34, radius: 0.05, rotZ: -0.35, rotX: -0.45, mat: coreMat },
        { x: 0, z: 0.08, height: 0.28, radius: 0.045, rotZ: 0, rotX: 0.4, mat: glowMat },
      ];

      icicleConfigs.forEach((cfg) => {
        const iceGeo = new THREE.OctahedronGeometry(cfg.radius, 0);
        iceGeo.scale(0.75, cfg.height * 3.6, 0.75);
        iceGeo.translate(0, cfg.height / 2, 0);
        const iceMesh = new THREE.Mesh(iceGeo, cfg.mat);
        iceMesh.position.set(cfg.x, 0.12, cfg.z);
        iceMesh.rotation.set(cfg.rotX, 0, cfg.rotZ);
        headFXGroup.add(iceMesh);
      });

      // 4 orbiting frost crystals
      for (let i = 0; i < 4; i++) {
        const shardGeo = new THREE.OctahedronGeometry(0.045, 0);
        const shard = new THREE.Mesh(shardGeo, glowMat);
        const ang = (i / 4) * Math.PI * 2;
        shard.position.set(Math.cos(ang) * 0.22, 0.22, Math.sin(ang) * 0.22);
        orbitGroup.add(shard);
      }
      break;
    }

    case 'wind': {
      // ── 🍃 SWIRLING TORNADO / CYCLONE VORTEX AROUND HEAD ──
      // 3 ascending, expanding cyclone wind vortex rings forming a tornado funnel
      const ringHeights = [0.12, 0.22, 0.32];
      const ringRadii = [0.16, 0.22, 0.28];
      ringHeights.forEach((h, idx) => {
        const r = ringRadii[idx];
        const cycloneRingGeo = new THREE.TorusGeometry(r, 0.024, 8, 32);
        cycloneRingGeo.rotateX(Math.PI / 2.3);
        cycloneRingGeo.rotateZ(idx * 0.4);
        const cycloneRing = new THREE.Mesh(cycloneRingGeo, idx === 1 ? glowMat : coreMat);
        cycloneRing.position.y = h;
        orbitGroup.add(cycloneRing);
      });

      // 4 curved aerodynamic breeze ribbons streaming back
      for (let i = 0; i < 4; i++) {
        const ribbonGeo = new THREE.ConeGeometry(0.035, 0.32, 6);
        ribbonGeo.scale(0.3, 1.0, 1.5);
        ribbonGeo.translate(0, 0.16, 0);
        const ribbon = new THREE.Mesh(ribbonGeo, glowMat);
        const ang = (i / 4) * Math.PI * 2;
        ribbon.position.set(Math.cos(ang) * 0.18, 0.18, Math.sin(ang) * 0.18);
        ribbon.rotation.set(-0.5, -ang, 0.6);
        orbitGroup.add(ribbon);
      }
      break;
    }

    case 'soil': {
      // ── 🪨 FLOATING JAGGED ROCKS & EARTHEN BOULDERS ──
      const rockConfigs = [
        { x: -0.16, y: 0.14, z: 0.04, size: 0.09, rot: [0.4, 0.6, 0.2], mat: coreMat },
        { x: 0.16, y: 0.14, z: 0.04, size: 0.09, rot: [-0.4, -0.6, 0.2], mat: coreMat },
        { x: -0.09, y: 0.22, z: -0.06, size: 0.10, rot: [0.2, 0.8, -0.4], mat: glowMat },
        { x: 0.09, y: 0.22, z: -0.06, size: 0.10, rot: [-0.2, -0.8, 0.4], mat: glowMat },
        { x: 0, y: 0.12, z: -0.16, size: 0.08, rot: [0.5, -0.3, 0.2], mat: coreMat },
        { x: 0, y: 0.26, z: 0.08, size: 0.085, rot: [-0.5, 0.3, -0.2], mat: glowMat },
      ];

      rockConfigs.forEach((cfg) => {
        const rockGeo = new THREE.DodecahedronGeometry(cfg.size, 0);
        const rock = new THREE.Mesh(rockGeo, cfg.mat);
        rock.position.set(cfg.x, cfg.y, cfg.z);
        rock.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
        orbitGroup.add(rock);
      });

      // Center rugged monolith stone spire
      const monolithGeo = new THREE.ConeGeometry(0.055, 0.35, 5);
      monolithGeo.translate(0, 0.17, 0);
      const monolith = new THREE.Mesh(monolithGeo, coreMat);
      monolith.position.set(0, 0.14, 0);
      headFXGroup.add(monolith);
      break;
    }

    case 'dark': {
      // ── 🌑 DARK PURPLE VOID FLAMES & OBSIDIAN HORNS ──
      // Twin curved demon horns
      const createHorn = (isLeft: boolean) => {
        const hornGroup = new THREE.Group();
        const dir = isLeft ? -1 : 1;

        const baseGeo = new THREE.CylinderGeometry(0.04, 0.055, 0.24, 8);
        baseGeo.translate(0, 0.12, 0);
        const baseMesh = new THREE.Mesh(baseGeo, coreMat);
        baseMesh.rotation.set(-0.35, 0, dir * 0.55);
        hornGroup.add(baseMesh);

        const tipGeo = new THREE.ConeGeometry(0.04, 0.26, 8);
        tipGeo.translate(0, 0.13, 0);
        const tipMesh = new THREE.Mesh(tipGeo, glowMat);
        tipMesh.position.set(dir * 0.11, 0.18, -0.06);
        tipMesh.rotation.set(-0.65, 0, dir * 0.35);
        hornGroup.add(tipMesh);

        return hornGroup;
      };

      const hornL = createHorn(true);
      hornL.position.set(-0.10, 0.12, -0.02);
      headFXGroup.add(hornL);

      const hornR = createHorn(false);
      hornR.position.set(0.10, 0.12, -0.02);
      headFXGroup.add(hornR);

      // 5 curling dark purple void flames rising from head
      for (let i = 0; i < 5; i++) {
        const flameGeo = new THREE.ConeGeometry(0.038, 0.30, 6);
        flameGeo.translate(0, 0.15, 0);
        const flame = new THREE.Mesh(flameGeo, glowMat);
        const ang = (i / 5) * Math.PI * 2;
        flame.position.set(Math.cos(ang) * 0.12, 0.14, Math.sin(ang) * 0.12);
        flame.rotation.set(-0.3, -ang, 0.2);
        orbitGroup.add(flame);
      }
      break;
    }

    case 'light': {
      // ── ✨ DAZZLING RADIANT SUNBURST & ANGELIC SOLAR HALO ──
      // Central glowing solar orb core
      const sunCoreGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const sunCore = new THREE.Mesh(sunCoreGeo, whiteHotMat);
      sunCore.position.set(0, 0.28, 0);
      orbitGroup.add(sunCore);

      // Golden angelic halo hovering horizontally above head
      const haloGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 32);
      haloGeo.rotateX(Math.PI / 2);
      const haloMesh = new THREE.Mesh(haloGeo, glowMat);
      haloMesh.position.y = 0.28;
      orbitGroup.add(haloMesh);

      // 12 radiant solar rays shooting outward in all directions
      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * Math.PI * 2;
        const rayGeo = new THREE.ConeGeometry(0.02, 0.16, 6);
        rayGeo.rotateZ(-Math.PI / 2);
        rayGeo.translate(0.08, 0, 0);
        const ray = new THREE.Mesh(rayGeo, glowMat);
        ray.position.set(Math.cos(ang) * 0.24, 0.28, Math.sin(ang) * 0.24);
        ray.rotation.y = -ang;
        orbitGroup.add(ray);
      }
      break;
    }

    case 'space': {
      // ── 🌌 MINIATURE COSMIC GALAXY SPIRAL & SATURNIAN RINGS ──
      // Wide planetary disc ring tilted diagonally around head
      const ringGeo = new THREE.RingGeometry(0.18, 0.36, 32);
      ringGeo.rotateX(Math.PI / 2.2);
      ringGeo.rotateY(0.28);
      const saturnRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
        color: secondaryColor,
        side: THREE.DoubleSide,
        transparent: false,
        opacity: 1.0,
      }));
      saturnRing.position.y = 0.14;
      orbitGroup.add(saturnRing);

      // 3 spherical orbiting planetoids / moons
      for (let i = 0; i < 3; i++) {
        const moonGeo = new THREE.SphereGeometry(0.045 + (i % 2) * 0.015, 12, 12);
        const moon = new THREE.Mesh(moonGeo, glowMat);
        const ang = (i / 3) * Math.PI * 2;
        moon.position.set(Math.cos(ang) * 0.30, 0.14 + Math.sin(ang) * 0.08, Math.sin(ang) * 0.30);
        orbitGroup.add(moon);
      }

      // Cosmic star antenna at peak
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 6), coreMat);
      ant.position.set(0, 0.24, 0);
      headFXGroup.add(ant);

      const starTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), whiteHotMat);
      starTip.position.set(0, 0.40, 0);
      headFXGroup.add(starTip);
      break;
    }

    case 'time': {
      // ── ⏳ GOLDEN CLOCKWORK CHRONO GEARS & SUNDIAL ──
      const gearGroup = new THREE.Group();
      gearGroup.name = 'time-gear-halo';
      gearGroup.position.set(0, 0.24, -0.05);

      // Large 12-toothed golden gear wheel halo
      const hubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.038, 16);
      hubGeo.rotateX(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, coreMat);
      gearGroup.add(hub);

      for (let i = 0; i < 12; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.07, 0.04), glowMat);
        const ang = (i / 12) * Math.PI * 2;
        tooth.position.set(Math.cos(ang) * 0.20, Math.sin(ang) * 0.20, 0);
        tooth.rotation.z = ang;
        gearGroup.add(tooth);
      }

      // Hour hand & Minute hand
      const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.10, 0.045), whiteHotMat);
      hourHand.position.set(0, 0.045, 0.02);
      hourHand.rotation.z = -0.6;
      gearGroup.add(hourHand);

      const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.14, 0.045), whiteHotMat);
      minuteHand.position.set(0, 0.065, 0.02);
      minuteHand.rotation.z = 1.2;
      gearGroup.add(minuteHand);

      headFXGroup.add(gearGroup);
      break;
    }

    case 'robot': {
      // ── 🤖 CYBER MECHA ANTENNA, COMM DISHES & HUD VISOR ──
      // Glowing neon cyber visor across the eyes
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.08), glowMat);
      visor.position.set(0, 0.02, 0.11);
      headFXGroup.add(visor);

      // Side cyber comm-link dishes
      const earL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 12), coreMat);
      earL.rotateZ(Math.PI / 2);
      earL.position.set(-0.13, 0.02, 0);
      headFXGroup.add(earL);

      const earR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.045, 12), coreMat);
      earR.rotateZ(Math.PI / 2);
      earR.position.set(0.13, 0.02, 0);
      headFXGroup.add(earR);

      // Central cyber mecha antenna
      const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.30, 8), coreMat);
      antRod.position.set(0, 0.26, 0);
      headFXGroup.add(antRod);

      // Blinking high-intensity LED beacon sphere at tip
      const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), whiteHotMat);
      ledMesh.position.set(0, 0.42, 0);
      headFXGroup.add(ledMesh);
      break;
    }

    case 'healing': {
      // ── 🌸 LUSH BLOOMING FLORA GARLAND WITH BLOSSOM & LEAVES ──
      const floraGroup = new THREE.Group();
      floraGroup.position.set(0, 0.14, 0);

      // Blooming 5-petal cherry blossom flower on crown
      for (let i = 0; i < 5; i++) {
        const petalGeo = new THREE.SphereGeometry(0.07, 10, 10);
        petalGeo.scale(0.85, 0.25, 1.4);
        const petal = new THREE.Mesh(petalGeo, glowMat);
        const ang = (i / 5) * Math.PI * 2;
        petal.position.set(Math.cos(ang) * 0.15, 0.03, Math.sin(ang) * 0.15);
        petal.rotation.y = -ang + Math.PI / 2;
        petal.rotation.x = 0.15;
        floraGroup.add(petal);
      }

      // Golden stamen center
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xffd54f,
        emissiveIntensity: 0.9,
        transparent: false,
        opacity: 1.0,
      }));
      bud.position.y = 0.05;
      floraGroup.add(bud);

      // 4 green plant leaves wrapping around brow
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x4caf50,
        emissive: 0x2e7d32,
        emissiveIntensity: 0.8,
        transparent: false,
        opacity: 1.0,
      });

      const leafAngles = [-0.5, 0.5, -1.8, 1.8];
      leafAngles.forEach((ang) => {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.018, 0.06), leafMat);
        leaf.position.set(Math.cos(ang) * 0.13, 0.01, Math.sin(ang) * 0.13);
        leaf.rotation.y = -ang;
        leaf.rotation.z = 0.2;
        floraGroup.add(leaf);
      });

      headFXGroup.add(floraGroup);

      // 4 floating sakura blossom petals in aura
      for (let i = 0; i < 4; i++) {
        const floatingPetal = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), glowMat);
        floatingPetal.scale.set(0.9, 0.2, 1.3);
        const ang = (i / 4) * Math.PI * 2;
        floatingPetal.position.set(Math.cos(ang) * 0.22, 0.20 + (i % 2) * 0.1, Math.sin(ang) * 0.22);
        orbitGroup.add(floatingPetal);
      }
      break;
    }

    case 'trees': {
      // ── 🌱 TINY GROOT (MARVEL) ICONIC BARK CROWN & SPROUTING LEAVES ──
      const grootCrownGroup = new THREE.Group();
      grootCrownGroup.position.set(0, 0.10, 0);

      const barkCrownMat = new THREE.MeshStandardMaterial({
        color: 0x7A4B26,
        emissive: 0x3A1F0C,
        emissiveIntensity: 0.35,
        roughness: 0.90,
        metalness: 0.05,
        transparent: false,
        opacity: 1.0,
      });

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x4ADE80,
        emissive: 0x22C55E,
        emissiveIntensity: 0.85,
        roughness: 0.50,
        metalness: 0.08,
        transparent: false,
        opacity: 1.0,
      });

      // 8 Jagged wooden bark crest segments forming Groot's signature cut-bark crown
      const crownSegments = [
        { x: 0, z: 0.09, height: 0.13, width: 0.065, rotX: 0.18, rotZ: 0 },         // front center
        { x: -0.08, z: 0.07, height: 0.17, width: 0.062, rotX: 0.15, rotZ: 0.25 },  // front left peak
        { x: 0.08, z: 0.07, height: 0.17, width: 0.062, rotX: 0.15, rotZ: -0.25 }, // front right peak
        { x: -0.12, z: 0.0, height: 0.21, width: 0.065, rotX: 0.0, rotZ: 0.40 },    // left ear crest
        { x: 0.12, z: 0.0, height: 0.21, width: 0.065, rotX: 0.0, rotZ: -0.40 },   // right ear crest
        { x: -0.07, z: -0.08, height: 0.18, width: 0.068, rotX: -0.2, rotZ: 0.20 }, // rear left peak
        { x: 0.07, z: -0.08, height: 0.18, width: 0.068, rotX: -0.2, rotZ: -0.20 },// rear right peak
        { x: 0, z: -0.10, height: 0.15, width: 0.070, rotX: -0.25, rotZ: 0 },       // rear center
      ];

      crownSegments.forEach((seg) => {
        // Jagged wooden slab with beveled edges
        const segGeo = new THREE.BoxGeometry(seg.width, seg.height, 0.038);
        segGeo.translate(0, seg.height / 2, 0);
        const segMesh = new THREE.Mesh(segGeo, barkCrownMat);
        segMesh.position.set(seg.x, 0.02, seg.z);
        segMesh.rotation.set(seg.rotX, 0, seg.rotZ);
        grootCrownGroup.add(segMesh);

        // Little jagged top notch on taller segments
        if (seg.height > 0.16) {
          const notchGeo = new THREE.ConeGeometry(0.020, 0.05, 4);
          notchGeo.translate(0, 0.025, 0);
          const notch = new THREE.Mesh(notchGeo, barkCrownMat);
          notch.position.set(seg.x, 0.02 + seg.height, seg.z);
          notch.rotation.set(seg.rotX, 0, seg.rotZ);
          grootCrownGroup.add(notch);
        }
      });

      // 4 Fresh green leaf buds sprouting out from the bark crown
      const leafConfigs = [
        { x: -0.11, y: 0.20, z: 0.02, rotZ: 0.7, rotY: 0.3 },
        { x: 0.11, y: 0.20, z: 0.02, rotZ: -0.7, rotY: -0.3 },
        { x: 0.04, y: 0.17, z: 0.08, rotZ: -0.3, rotY: 0.5 },
        { x: -0.05, y: 0.18, z: -0.06, rotZ: 0.4, rotY: -0.6 },
      ];

      leafConfigs.forEach((cfg) => {
        const sproutGroup = new THREE.Group();
        sproutGroup.position.set(cfg.x, cfg.y, cfg.z);
        sproutGroup.rotation.set(0.1, cfg.rotY, cfg.rotZ);

        // Tiny twig stem
        const stemGeo = new THREE.CylinderGeometry(0.007, 0.009, 0.06, 5);
        stemGeo.translate(0, 0.03, 0);
        const stem = new THREE.Mesh(stemGeo, barkCrownMat);
        sproutGroup.add(stem);

        // Young green leaf
        const leafGeo = new THREE.SphereGeometry(0.028, 8, 8);
        leafGeo.scale(0.8, 0.25, 1.4);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(0, 0.065, 0.015);
        leaf.rotation.x = 0.35;
        sproutGroup.add(leaf);

        grootCrownGroup.add(sproutGroup);
      });

      headFXGroup.add(grootCrownGroup);

      // 5 Magical Bioluminescent Spores / Fireflies (Guardians of the Galaxy glowing spores)
      const sporeMat = new THREE.MeshStandardMaterial({
        color: 0x86EFAC,
        emissive: 0x4ADE80,
        emissiveIntensity: 0.95,
        roughness: 0.2,
        transparent: false,
        opacity: 1.0,
      });

      for (let i = 0; i < 5; i++) {
        const spore = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), sporeMat);
        const ang = (i / 5) * Math.PI * 2;
        spore.position.set(Math.cos(ang) * 0.22, 0.20 + (i % 2) * 0.12, Math.sin(ang) * 0.22);
        orbitGroup.add(spore);
      }
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
 * Builds elemental power geometries around the stick man's torso/body (Cleaned - nothing around body)
 */
function createBodyElementPower(
  _element: ElementType,
  _primaryColor: THREE.Color,
  _secondaryColor: THREE.Color
): THREE.Group {
  const bodyFXGroup = new THREE.Group();
  bodyFXGroup.name = 'body-element-power';
  // Completely empty: clean stick figure body with nothing around torso/waist
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

  const vividSolarSunMat = new THREE.MeshStandardMaterial({
    color: 0xfff176,
    emissive: 0xffd700,
    emissiveIntensity: 1.35,
    roughness: 0.1,
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
      // ── 🪨 SOIL / MINERAL: BEDROCK FORTRESS TOWER SHIELD ──
      const shieldGroup = new THREE.Group();
      shieldGroup.position.set(0.02, 0.08, 0.06);
      shieldGroup.rotation.set(0.15, 0.35, -0.05);

      // Dark slate granite stone slab
      const stonePlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.46, 0.045), graniteSlateMat);
      shieldGroup.add(stonePlate);

      // Beveled golden brass rim framing the shield
      const rimTop = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.038, 0.058), polishedGoldMat);
      rimTop.position.y = 0.22;
      shieldGroup.add(rimTop);

      const rimBot = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.038, 0.058), polishedGoldMat);
      rimBot.position.y = -0.22;
      shieldGroup.add(rimBot);

      const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.46, 0.058), polishedGoldMat);
      rimL.position.x = -0.14;
      shieldGroup.add(rimL);

      const rimR = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.46, 0.058), polishedGoldMat);
      rimR.position.x = 0.14;
      shieldGroup.add(rimR);

      // Central protruding faceted amber mineral boss
      const bossGeo = new THREE.OctahedronGeometry(0.08, 0);
      bossGeo.scale(1.0, 1.25, 0.7);
      const boss = new THREE.Mesh(bossGeo, polishedGoldMat);
      boss.position.z = 0.038;
      shieldGroup.add(boss);

      const bossCore = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), whiteHotMat);
      bossCore.position.z = 0.048;
      shieldGroup.add(bossCore);

      // 4 heavy forged steel corner bolts
      const boltGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.065, 6);
      boltGeo.rotateX(Math.PI / 2);
      [
        [-0.11, 0.17],
        [0.11, 0.17],
        [-0.11, -0.17],
        [0.11, -0.17],
      ].forEach(([bx, by]) => {
        const bolt = new THREE.Mesh(boltGeo, gleamingSilverMat);
        bolt.position.set(bx, by, 0.012);
        shieldGroup.add(bolt);
      });

      // Arm bracket on back
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 6), darkIronMat);
      bracket.position.set(-0.02, 0, -0.045);
      shieldGroup.add(bracket);

      propGroup.add(shieldGroup);
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

      // Blazing sun core
      const sunStar = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 12), whiteHotMat);
      sunStar.position.y = -0.04;
      lanternGroup.add(sunStar);

      const sunHalo = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 8, 16), vividSolarSunMat);
      sunHalo.position.y = -0.04;
      lanternGroup.add(sunHalo);

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
      // ── 🌌 SPACE: BRASS CELESTIAL SPYGLASS / TELESCOPE ──
      const scopeGroup = new THREE.Group();
      scopeGroup.position.set(0, 0.06, 0.06);
      scopeGroup.rotation.x = -0.22;

      // Eyepiece
      const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.13, 8), shinyBrassMat);
      eyepiece.position.z = -0.13;
      eyepiece.rotation.x = Math.PI / 2;
      scopeGroup.add(eyepiece);

      // Middle draw tube
      const midTube = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 8), darkIronMat);
      midTube.position.z = 0.01;
      midTube.rotation.x = Math.PI / 2;
      scopeGroup.add(midTube);

      // Knurled gold focus dial
      const dial = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.009, 6, 16), polishedGoldMat);
      dial.position.z = 0.09;
      scopeGroup.add(dial);

      // Main objective barrel
      const objBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.22, 8), shinyBrassMat);
      objBarrel.position.z = 0.20;
      objBarrel.rotation.x = Math.PI / 2;
      scopeGroup.add(objBarrel);

      // Starlight lens
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.020, 12), vividVoidMagentaMat);
      lens.position.z = 0.315;
      lens.rotation.x = Math.PI / 2;
      scopeGroup.add(lens);

      // Top mini viewfinder
      const finder = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.15, 6), polishedGoldMat);
      finder.position.set(0, 0.058, 0.14);
      finder.rotation.x = Math.PI / 2;
      scopeGroup.add(finder);

      propGroup.add(scopeGroup);
      break;
    }

    case 'time': {
      // ── ⏳ TIME: CHRONOS GOLDEN HOURGLASS ──
      const hgGroup = new THREE.Group();
      hgGroup.position.set(0, 0.08, 0.06);

      const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.028, 6), polishedGoldMat);
      topPlate.position.y = 0.19;
      hgGroup.add(topPlate);

      const botPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.028, 6), polishedGoldMat);
      botPlate.position.y = -0.19;
      hgGroup.add(botPlate);

      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 6), darkIronMat);
        pillar.position.set(Math.cos(ang) * 0.068, 0, Math.sin(ang) * 0.068);
        hgGroup.add(pillar);
      }

      const bulbTop = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.15, 8), shinyBrassMat);
      bulbTop.position.y = 0.095;
      bulbTop.rotation.x = Math.PI;
      hgGroup.add(bulbTop);

      const bulbBot = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.15, 8), shinyBrassMat);
      bulbBot.position.y = -0.095;
      hgGroup.add(bulbBot);

      const sandPile = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.08, 8), whiteHotMat);
      sandPile.position.y = -0.135;
      hgGroup.add(sandPile);

      const sandStream = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 6), whiteHotMat);
      sandStream.position.y = 0.01;
      hgGroup.add(sandStream);

      propGroup.add(hgGroup);
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
      // ── 🌸 HEALING: VITALITY ELIXIR POTION FLASK ──
      const flaskGroup = new THREE.Group();
      flaskGroup.position.set(0, 0.06, 0.06);

      // Spherical glass flask with ruby elixir
      const flaskBelly = new THREE.Mesh(new THREE.SphereGeometry(0.098, 12, 10), vividRoseElixirMat);
      flaskBelly.position.y = -0.035;
      flaskGroup.add(flaskBelly);

      // White-hot bubbling heart
      const bubblingHeart = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), whiteHotMat);
      bubblingHeart.position.y = -0.040;
      flaskGroup.add(bubblingHeart);

      // Brass neck & lip
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.046, 0.09, 10), polishedGoldMat);
      neck.position.y = 0.065;
      flaskGroup.add(neck);

      const lip = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.012, 6, 16), polishedGoldMat);
      lip.position.y = 0.11;
      lip.rotation.x = Math.PI / 2;
      flaskGroup.add(lip);

      // Carved oak cork stopper
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.044, 8), carvedWoodMat);
      cork.position.y = 0.138;
      flaskGroup.add(cork);

      // Sprouting green life leaves
      const leaf1 = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.016, 0.032), leafGreenMat);
      leaf1.position.set(-0.028, 0.170, 0);
      leaf1.rotation.z = 0.50;
      flaskGroup.add(leaf1);

      const leaf2 = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.016, 0.032), leafGreenMat);
      leaf2.position.set(0.028, 0.170, 0);
      leaf2.rotation.z = -0.50;
      flaskGroup.add(leaf2);

      // Floating sparkles
      const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), whiteHotMat);
      sparkle.position.set(0.028, 0.23, 0.028);
      flaskGroup.add(sparkle);

      propGroup.add(flaskGroup);
      break;
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

  const bodyElementGroup = createBodyElementPower(element, primaryColor, secondaryColor);
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

  // Solid Inner Accent Dot
  const dotGeo = new THREE.CircleGeometry(0.08, 16);
  const dotMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1.0,
  });
  const shadowMesh = new THREE.Mesh(dotGeo, dotMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = 0.012;
  group.add(shadowMesh);

  // ── 8. Power Beam (Summon / Special Move FX) ────────────────────────
  const beamGeo = new THREE.CylinderGeometry(0.3, 0.6, 4.0, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    visible: false,
  });
  const powerBeamMesh = new THREE.Mesh(beamGeo, beamMat);
  powerBeamMesh.position.y = 2.0;
  group.add(powerBeamMesh);

  // Shockwave Ring
  const waveGeo = new THREE.RingGeometry(0.25, 0.45, 24);
  const waveMat = new THREE.MeshBasicMaterial({
    color: secondaryColor,
    transparent: false,
    opacity: 1.0,
    side: THREE.DoubleSide,
    visible: false,
  });
  const shockwaveMesh = new THREE.Mesh(waveGeo, waveMat);
  shockwaveMesh.rotation.x = -Math.PI / 2;
  shockwaveMesh.position.y = 0.03;
  group.add(shockwaveMesh);

  // ── 9. Hitbox for Raycasting (Clicking on character) ────────────────
  const hitBoxGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitBoxMesh = new THREE.Mesh(hitBoxGeo, hitBoxMat);
  hitBoxMesh.position.y = 0.55;
  group.add(hitBoxMesh);

  // Scale: Tiny! Uniform across all characters (~0.44)
  const baseScale = scaleVariant * 0.44;
  group.scale.set(baseScale, baseScale, baseScale);

  return {
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
}
