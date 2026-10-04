import { createCosmicMaterial } from './spaceCosmos';
import { createHealingBoundaryGeometry } from './healingVitality';
import * as THREE from 'three';
import { ELEMENTAL_SPELLS, type ElementalSpell } from '../data/elementalSpells';
import {
  BuiltSpellEffect,
  buildPhoenixFirestorm,
  buildPyroclasticSurge,
  buildDragonMeteor,
  buildTidalSurge,
  buildWhirlpoolVortex,
  buildOceanicGeyser,
  buildThunderboltStrike,
  buildPlasmaRailgun,
  buildChainNova,
  buildGlacialSpikes,
  buildBlizzardVortex,
  buildAbsoluteZero,
  buildTornadoGale,
  buildZephyrBlades,
  buildAeroShockwave,
  buildBedrockFissure,
  buildBoulderCatapult,
  buildFortressBastion,
  buildRootEntanglement,
  buildSporeBloom,
  buildIronwoodSlam,
  buildAbyssalGrasp,
  buildShadowPhantomWave,
  buildLuciferAscension,
  buildSolarDawn,
  buildSunburstLance,
  buildArchangelAscension,
  buildMeteorShower,
  buildCosmicRay,
  buildPlanetaryRings,
  buildChronoRewind,
  buildGearBarrage,
  buildStasisField,
  buildHyperBeam,
  buildOverclockGrid,
  buildMissileSalvo,
  buildSakuraSanctuary,
  buildPetalBreeze,
  buildVitalityRain,
  buildNullObelisk,
  buildDimensionalSlash,
  buildVoidCollapse,
} from './spellMeshBuilders';
import { isUltimateSpell } from './spellPresentation';
import { createSpellSurface } from './spellMaterials';

interface ActiveSpell {
  group: THREE.Group;
  spell: ElementalSpell;
  elapsed: number;
  duration: number;
  update: (deltaSec: number) => boolean;
  dispose: () => void;
}

export interface SpellEffectHandle {
  setPosition: (x: number, y: number) => void;
  isAlive: () => boolean;
  stop: () => void;
  setHeading: (heading: number) => void;
  getHitAreas: () => Array<{ minX: number; maxX: number; minY: number; maxY: number }>;
}

type SpellBuilder = (spell: ElementalSpell, heading: number, distance: number) => BuiltSpellEffect;

/** Explicit registry: every data spell must have one bespoke visual builder. */
export const SPELL_BUILDERS: Record<string, SpellBuilder> = {
  'fire-phoenix-firestorm': spell => buildPhoenixFirestorm(spell),
  'fire-pyroclastic-surge': (spell, heading) => buildPyroclasticSurge(spell, heading),
  'fire-dragon-meteor': spell => buildDragonMeteor(spell),
  'water-tidal-surge': (spell, heading) => buildTidalSurge(spell, heading),
  'water-whirlpool-vortex': spell => buildWhirlpoolVortex(spell),
  'water-oceanic-geyser': spell => buildOceanicGeyser(spell),
  'lightning-thunderbolt': spell => buildThunderboltStrike(spell),
  'lightning-plasma-railgun': (spell, heading) => buildPlasmaRailgun(spell, heading),
  'lightning-chain-nova': spell => buildChainNova(spell),
  'ice-glacial-spikes': (spell, heading) => buildGlacialSpikes(spell, heading),
  'ice-blizzard-vortex': spell => buildBlizzardVortex(spell),
  'ice-absolute-zero': spell => buildAbsoluteZero(spell),
  'wind-tornado-gale': spell => buildTornadoGale(spell),
  'wind-zephyr-blades': (spell, heading) => buildZephyrBlades(spell, heading),
  'wind-aero-burst': spell => buildAeroShockwave(spell),
  'soil-bedrock-fissure': (spell, heading, distance) => buildBedrockFissure(spell, heading, distance),
  'soil-boulder-catapult': (spell, heading, distance) => buildBoulderCatapult(spell, heading, distance),
  'soil-fortress-bastion': spell => buildFortressBastion(spell),
  'trees-root-entanglement': (spell, heading, distance) => buildRootEntanglement(spell, heading, distance),
  'trees-spore-bloom': spell => buildSporeBloom(spell),
  'trees-ironwood-slam': spell => buildIronwoodSlam(spell),
  'dark-abyssal-grasp': spell => buildAbyssalGrasp(spell),
  'dark-phantom-wave': (spell, heading, distance) => buildShadowPhantomWave(spell, heading, distance),
  'dark-eclipse-nova': spell => buildLuciferAscension(spell),
  'light-solar-dawn': spell => buildSolarDawn(spell),
  'light-sunburst-lance': (spell, heading, distance) => buildSunburstLance(spell, heading, distance),
  'light-supernova-flare': spell => buildArchangelAscension(spell),
  'space-meteor-shower': spell => buildMeteorShower(spell),
  'space-cosmic-ray': (spell, heading, distance) => buildCosmicRay(spell, heading, distance),
  'space-planetary-rings': spell => buildPlanetaryRings(spell),
  'time-chrono-rewind': spell => buildChronoRewind(spell),
  'time-gear-barrage': spell => buildGearBarrage(spell),
  'time-stasis-field': spell => buildStasisField(spell),
  'robot-hyper-beam': (spell, heading, distance) => buildHyperBeam(spell, heading, distance),
  'robot-overclock-grid': spell => buildOverclockGrid(spell),
  'robot-missile-salvo': (spell, heading, distance) => buildMissileSalvo(spell, heading, distance),
  'healing-sakura-sanctuary': spell => buildSakuraSanctuary(spell),
  'healing-petal-breeze': spell => buildPetalBreeze(spell),
  'healing-vitality-rain': spell => buildVitalityRain(spell),
  'void-null-obelisk': spell => buildNullObelisk(spell),
  'void-dimensional-slash': spell => buildDimensionalSlash(spell),
  'void-catastrophic-collapse': spell => buildVoidCollapse(spell),
};

export function validateSpellRegistry() {
  const ids = Object.values(ELEMENTAL_SPELLS).flat().map(spell => spell.id);
  const missing = ids.filter(id => !SPELL_BUILDERS[id]);
  const extra = Object.keys(SPELL_BUILDERS).filter(id => !ids.includes(id));
  if (missing.length || extra.length) {
    throw new Error(`Spell registry mismatch. Missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`);
  }
  return ids.length;
}

validateSpellRegistry();

/**
 * 3D Spell Effect System
 * Dispatches independent elemental abilities with explicit self or forward targeting.
 */
export class SpellEffectSystem {
  private scene: THREE.Scene;
  private activeSpells: ActiveSpell[] = [];
  private readonly maxActiveSpells: number;
  private readonly reducedMotion: boolean;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.maxActiveSpells = typeof window !== 'undefined' && window.innerWidth < 720 ? 4 : 8;
  }

  /**
   * Casts a bespoke 3D spell at the character's position and heading.
   */
  public castSpell(
    spell: ElementalSpell,
    posX: number,
    posY: number,
    headingAngle: number,
    casterScale: number = 1.0,
    travelDistance = 190,
    presentationScale = 1,
    exactOrigin = false,
    combatRadiusPixels = 0,
    combatHoldSeconds = 0,
  ): SpellEffectHandle | null {
    if (typeof document !== 'undefined' && document.hidden) return null;
    while (this.activeSpells.length >= this.maxActiveSpells) {
      const oldest = this.activeSpells.shift();
      oldest?.dispose();
    }
    const travelHeading = Math.PI - headingAngle;
    const spellGroup = new THREE.Group();
    spellGroup.position.set(posX, posY, 0);
    const origin = spell.effectOrigin || (spell.target === 'ahead' || spell.target === 'area' ? 'ahead' : 'self');
    if (!exactOrigin && origin === 'ahead') {
      const aheadDist = Math.min(175, Math.max(35, travelDistance * 0.7));
      spellGroup.position.x += Math.sin(headingAngle) * aheadDist;
      spellGroup.position.y += Math.cos(headingAngle) * aheadDist;
    }
    // Isometric tilt matching character coordinate space
    spellGroup.rotation.x = 0.44;
    const elementalScale = 1.25;
    const ultimateScale = spell.id === 'fire-dragon-meteor' ? 1.2 : isUltimateSpell(spell.id) ? 1.08 : 1;
    const finalScale = THREE.MathUtils.clamp(casterScale, 0.8, 1.25)
      * 1.45 * elementalScale * ultimateScale * presentationScale;
    spellGroup.scale.setScalar(finalScale);

    const builder = SPELL_BUILDERS[spell.id];
    if (!builder) throw new Error(`No spell animation registered for ${spell.id}`);
    // Robot ordnance travels to the requested world-space target despite presentation scaling.
    const localTravel = spell.element === 'robot' ? travelDistance / finalScale : travelDistance;
    const builtEffect = builder(spell, travelHeading, localTravel);
    spellGroup.add(builtEffect.root);
    let combatAreaMaterial: THREE.ShaderMaterial | null = null;
    let combatArea: THREE.Mesh | null = null;
    if (combatRadiusPixels > 0 && spell.element !== 'robot') {
      const localRadius = combatRadiusPixels / finalScale;
      combatAreaMaterial = spell.element === 'space' ? createCosmicMaterial('metric', .35) : createSpellSurface(spell.element,
        spell.primaryColor || '#ffffff', spell.secondaryColor || '#ffffff', .24);
      combatArea = new THREE.Mesh(
        spell.element === 'healing' ? createHealingBoundaryGeometry(localRadius)
          : new THREE.RingGeometry(localRadius * .975, localRadius, 64),
        combatAreaMaterial,
      );
      combatArea.position.set(0, 1, -3);
      combatArea.rotation.x = -Math.PI / 2;
      combatArea.renderOrder = 1;
      spellGroup.add(combatArea);
    }
    if (this.reducedMotion) {
      if (!exactOrigin) spellGroup.scale.multiplyScalar(0.82);
      builtEffect.root.traverse(node => {
        if (node instanceof THREE.InstancedMesh && node.count > 20) node.count = Math.ceil(node.count * 0.45);
      });
    }
    this.scene.add(spellGroup);

    let alive = true;
    const activeSpell: ActiveSpell = {
      group: spellGroup,
      spell,
      elapsed: 0,
      duration: combatHoldSeconds > 0 ? combatHoldSeconds : spell.duration,
      update: (deltaSec: number) => {
        activeSpell.elapsed += deltaSec;

        // Run bespoke spell frame update
        const elapsed = activeSpell.elapsed;
        // Wards form at normal speed, remain fully visible while protecting,
        // then fade at expiry instead of vanishing halfway through their status.
        const progress = combatHoldSeconds > 0
          ? elapsed < spell.duration * .55 ? elapsed / spell.duration
            : elapsed < activeSpell.duration - .25 ? .55
              : .76 + .24 * Math.min(1, (elapsed - activeSpell.duration + .25) / .25)
          : elapsed / activeSpell.duration;
        builtEffect.update(deltaSec, elapsed, progress > 0 ? elapsed / progress : spell.duration);
        if (combatArea && combatAreaMaterial) {
          const progress = Math.min(1, activeSpell.elapsed / activeSpell.duration);
          const pulse = 1 + Math.sin(activeSpell.elapsed * 8) * 0.035;
          combatArea.scale.setScalar(pulse);
          combatAreaMaterial.uniforms.uTime.value = activeSpell.elapsed;
          combatAreaMaterial.uniforms.uOpacity.value = .24 * Math.min(1, activeSpell.elapsed / .16) * (1 - Math.max(0, (progress - .72) / .28));
        }

        return activeSpell.elapsed < activeSpell.duration;
      },
      dispose: () => {
        alive = false;
        this.disposeGroup(spellGroup);
        this.scene.remove(spellGroup);
      },
    };

    this.activeSpells.push(activeSpell);
    const bounds = new THREE.Box3();
    const instanceMatrix = new THREE.Matrix4();
    const worldMatrix = new THREE.Matrix4();
    return {
      stop: () => {
        if (!alive) return;
        activeSpell.dispose();
        this.activeSpells = this.activeSpells.filter(value => value !== activeSpell);
      },
      setHeading: heading => { if (alive) builtEffect.root.rotation.y = Math.PI - heading; },
      setPosition: (x: number, y: number) => {
        if (alive) spellGroup.position.set(x, y, 0);
      },
      isAlive: () => alive,
      getHitAreas: () => {
        const areas: Array<{ minX: number; maxX: number; minY: number; maxY: number }> = [];
        if (!alive) return areas;
        spellGroup.updateWorldMatrix(true, true);
        // Individual visible mesh footprints preserve gaps between bolts and shards.
        spellGroup.traverseVisible(node => {
          if (!(node instanceof THREE.Mesh)) return;
          for (let parent: THREE.Object3D | null = node; parent; parent = parent.parent) {
            if (parent.userData.combatContact === false) return;
          }
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          if (!materials.some(material => {
            const shader = material as THREE.ShaderMaterial;
            const opacity = shader.uniforms?.uOpacity?.value ?? material.opacity;
            return material.visible && opacity > .08;
          })) return;
          const positions = node.geometry.getAttribute('position');
          if (!node.geometry.boundingBox || (positions instanceof THREE.BufferAttribute && positions.usage === THREE.DynamicDrawUsage)) {
            node.geometry.computeBoundingBox();
          }
          if (!node.geometry.boundingBox) return;
          if (node instanceof THREE.InstancedMesh) {
            for (let index = 0; index < node.count; index++) {
              node.getMatrixAt(index, instanceMatrix);
              worldMatrix.multiplyMatrices(node.matrixWorld, instanceMatrix);
              bounds.copy(node.geometry.boundingBox).applyMatrix4(worldMatrix);
              if (!bounds.isEmpty()) areas.push({ minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.y, maxY: bounds.max.y });
            }
            return;
          }
          bounds.copy(node.geometry.boundingBox).applyMatrix4(node.matrixWorld);
          if (bounds.isEmpty()) return;
          areas.push({ minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.y, maxY: bounds.max.y });
        });
        return areas;
      },
    };
  }

  /**
   * Updates all active 3D spells in the animation tick.
   */
  public update(deltaSec: number, deltaScrollY: number = 0): void {
    for (let i = this.activeSpells.length - 1; i >= 0; i--) {
      const spell = this.activeSpells[i];
      if (deltaScrollY !== 0) {
        spell.group.position.y += deltaScrollY;
      }
      const alive = spell.update(deltaSec);
      if (!alive) {
        spell.dispose();
        this.activeSpells.splice(i, 1);
      }
    }
  }

  /**
   * Cleans up all spells on unmount.
   */
  public dispose(): void {
    for (const spell of this.activeSpells) {
      spell.dispose();
    }
    this.activeSpells = [];
  }

  public activeCount(): number { return this.activeSpells.length; }

  private disposeGroup(group: THREE.Group): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    group.traverse((child) => {
      if (child instanceof THREE.Sprite) materials.add(child.material);
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => materials.add(m));
        } else if (mesh.material) {
          materials.add(mesh.material);
        }
        if (mesh instanceof THREE.InstancedMesh) mesh.dispose();
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      const map = (material as THREE.MeshBasicMaterial | THREE.SpriteMaterial).map;
      if (map) textures.add(map);
      material.dispose();
    });
    textures.forEach(texture => texture.dispose());
  }
}
