'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { ElementType, StickMan3DCharacter } from '../../types';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { ELEMENTAL_SPELLS, type ElementalSpell } from '../../data/elementalSpells';
import { SpellEffectSystem } from '../../systems/spellEffectSystem';
import { SpellActionSystem, type SpellPose } from '../../systems/spellActionSystem';
import { soundEngine } from '../../systems/soundEngine';
import { CURSOR } from '../../utils/cursorRef';
import { createStickMan3DCharacter } from '../../systems/stickManModelFactory';
import { updateHandMagicSeal } from '../../systems/magicSeal3D';
import {
  StickManEntity,
  STICK_MAN_MOVEMENT_SPEED_SCALE,
  spawnStickManPopulation,
} from '../../systems/stickManPopulation';
import { openWorldEncounterSystem } from '../../systems/openWorldEncounterSystem';
import { resolveFightSelection, type PendingFightCandidate } from '../../systems/fight/selectionRules';
import { StickManDOMOverlay } from './StickManDOMOverlay';
import { FightConfirmationModal } from '../fight/FightConfirmationModal';

const FightArena = dynamic(
  () => import('../fight/FightArena').then((mod) => mod.FightArena),
  {
    ssr: false,
    loading: () => (
      <div className="fight-loading" role="status">
        Opening arena…
      </div>
    ),
  }
);
 

interface StickManWorld3DProps {
  activeRealm: ElementType;
  onStickManSelect: (element: ElementType) => void;
  onStickManWhisper: (element: ElementType, text: string) => void;
}

interface RallyMarker {
  id: number;
  x: number;
  y: number;
}

interface SpellPreviewState {
  spellId: string;
  caster: { startX: number; startY: number; x: number; y: number; pose?: SpellPose };
  target?: { startX: number; startY: number; x: number; y: number; pose?: SpellPose; silenced: boolean };
}

interface FightMatchup {
  first: StickManEntity;
  second: StickManEntity;
}

function applySpellPose(char: StickMan3DCharacter, pose: SpellPose, time: number) {
  const p = pose.progress || 0;
  const breathe = Math.sin(p * Math.PI);
  char.rightArm.shoulder.rotation.z = 0;
  char.leftArm.shoulder.rotation.z = 0;
  switch (pose.kind) {
    case 'projectile':
      char.bodyGroup.rotation.x = 0.24;
      char.rightArm.shoulder.rotation.x = -2.15;
      char.rightArm.elbow.rotation.x = -0.18;
      char.leftArm.shoulder.rotation.x = 0.38;
      break;
    case 'heavy':
      char.bodyGroup.rotation.x = -0.12 + breathe * 0.34;
      char.leftArm.shoulder.rotation.x = -2.45;
      char.rightArm.shoulder.rotation.x = -2.45;
      char.leftArm.elbow.rotation.x = -0.45;
      char.rightArm.elbow.rotation.x = -0.45;
      break;
    case 'defend':
    case 'shieldImpact':
      char.bodyGroup.rotation.x = pose.kind === 'shieldImpact' ? -0.2 : 0.08;
      char.leftArm.shoulder.rotation.x = -1.55;
      char.rightArm.shoulder.rotation.x = -1.55;
      char.leftArm.elbow.rotation.x = -1.12;
      char.rightArm.elbow.rotation.x = -1.12;
      break;
    case 'heal':
    case 'recovering':
      char.bodyGroup.rotation.x = -0.08;
      char.leftArm.shoulder.rotation.x = -0.82;
      char.rightArm.shoulder.rotation.x = -0.82;
      char.leftArm.shoulder.rotation.z = 0.68;
      char.rightArm.shoulder.rotation.z = -0.68;
      char.headMesh.rotation.x = -0.16;
      break;
    case 'summon':
      char.bodyGroup.rotation.x = 0.12;
      char.leftArm.shoulder.rotation.x = -2.55;
      char.rightArm.shoulder.rotation.x = -1.05;
      char.leftArm.elbow.rotation.x = -0.25;
      char.rightArm.elbow.rotation.x = -1.15;
      break;
    case 'channel':
      char.bodyGroup.rotation.x = 0.3;
      char.leftArm.shoulder.rotation.x = -1.05;
      char.rightArm.shoulder.rotation.x = -1.05;
      char.leftArm.shoulder.rotation.z = 0.42;
      char.rightArm.shoulder.rotation.z = -0.42;
      break;
    case 'teleport':
      char.bodyGroup.rotation.y = p * Math.PI * 2;
      char.leftArm.shoulder.rotation.x = -1.8;
      char.rightArm.shoulder.rotation.x = -1.8;
      break;
    case 'levitate':
      char.bodyGroup.rotation.x = -0.22;
      char.leftArm.shoulder.rotation.z = 1.05;
      char.rightArm.shoulder.rotation.z = -1.05;
      char.leftLeg.knee.rotation.x = 0.65;
      char.rightLeg.knee.rotation.x = 0.35;
      break;
    case 'rewind':
      char.bodyGroup.rotation.y = -p * Math.PI * 1.5;
      char.leftArm.shoulder.rotation.x = -1.2;
      char.rightArm.shoulder.rotation.x = 0.65;
      break;
    case 'stunned':
      char.bodyGroup.rotation.z = Math.sin(time * 34) * 0.1;
      char.leftArm.shoulder.rotation.x = -2.2;
      char.rightArm.shoulder.rotation.x = -2.2;
      break;
    case 'frozen':
      char.bodyGroup.rotation.x = 0.08;
      char.leftArm.shoulder.rotation.x = -0.35;
      char.rightArm.shoulder.rotation.x = -1.05;
      char.leftLeg.knee.rotation.x = 0.24;
      char.rightLeg.knee.rotation.x = 0.5;
      break;
    case 'rooted':
      char.bodyGroup.rotation.x = 0.18;
      char.leftArm.shoulder.rotation.x = -0.65;
      char.rightArm.shoulder.rotation.x = -0.65;
      char.leftLeg.knee.rotation.x = 0.5;
      char.rightLeg.knee.rotation.x = 0.5;
      break;
  }
  if (pose.shielded) char.powerCoreMesh.scale.setScalar(1.55 + Math.sin(time * 4) * 0.12);
  if (pose.shielded) {
    char.magicSealMesh.scale.setScalar(1.28 + Math.sin(time * 3.2) * 0.06);
    (char.magicSealMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
  }
  if (pose.kind === 'shieldImpact') {
    const impact = pose.progress || 0;
    const material = char.shockwaveMesh.material as THREE.MeshBasicMaterial;
    material.visible = true;
    material.transparent = true;
    material.opacity = Math.max(0, 1 - impact);
    char.shockwaveMesh.scale.setScalar(1.2 + impact * 4.5);
  }
}

export const StickManWorld3D: React.FC<StickManWorld3DProps> = ({
  activeRealm,
  onStickManSelect,
  onStickManWhisper,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [entities, setEntities] = useState<StickManEntity[]>([]);
  const entitiesRef = useRef<StickManEntity[]>([]);
  const characters3DRef = useRef<Map<string, StickMan3DCharacter>>(new Map());
  const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);
  const [rallyMarkers, setRallyMarkers] = useState<RallyMarker[]>([]);
  const [pendingFight, setPendingFight] = useState<PendingFightCandidate<StickManEntity> | null>(null);
  const pendingFightRef = useRef<PendingFightCandidate<StickManEntity> | null>(null);
  const [matchup, setMatchup] = useState<FightMatchup | null>(null);
  const [activeFight, setActiveFight] = useState<{
    player: StickManEntity;
    opponent: StickManEntity;
  } | null>(null);
  const [interactionResetKey, setInteractionResetKey] = useState(0);
  const worldPausedRef = useRef(false);
  const preservedEntitiesRef = useRef<Map<string, StickManEntity>>(new Map());
  const activeRealmRef = useRef<ElementType>(activeRealm);

  useEffect(() => {
    activeRealmRef.current = activeRealm;
  }, [activeRealm]);

  useEffect(() => {
    worldPausedRef.current = Boolean(matchup || activeFight);
  }, [matchup, activeFight]);

  // Initialize stick man population across the website sections
  useEffect(() => {
    const pop = spawnStickManPopulation();
    entitiesRef.current = pop;
    const frame = requestAnimationFrame(() => setEntities(pop));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Global trigger for active stick man special move
  const triggerActiveSuperMove = useCallback(() => {
    const activeChar = entitiesRef.current.find((e) => e.element === activeRealmRef.current);
    if (activeChar) {
      activeChar.state = 'cheering';
      const char3D = characters3DRef.current.get(activeChar.id);
      if (char3D) {
        char3D.castAnimationTime = 1.2;
      }
      soundEngine.playSuperMove(activeChar.element);
      setActiveDialogueId(activeChar.id);
      onStickManWhisper(activeChar.element, activeChar.dialogueQuote);
    }
  }, [onStickManWhisper]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { triggerStickManSuperMove: () => void }).triggerStickManSuperMove =
        triggerActiveSuperMove;
    }
  }, [triggerActiveSuperMove]);

  const spellSystemRef = useRef<SpellEffectSystem | null>(null);
  const spellActionsRef = useRef(new SpellActionSystem());

  // Halts character movement immediately and pauses wandering for at least 3 seconds
  const handleStopStickMan = useCallback((id: string) => {
    openWorldEncounterSystem.cancelConversation(id, entitiesRef.current);
    const entity = entitiesRef.current.find((e) => e.id === id);
    if (entity) {
      // Immediately cancel travel target and halt
      entity.targetDocX = entity.docX;
      entity.targetDocY = entity.docY;
      entity.state = 'idle';
      entity.wanderTimer = 3.0; // Wait for another action for 3 seconds

      // Reset limb kinematics to neutral standing idle pose
      const char3D = characters3DRef.current.get(id);
      if (char3D) {
        char3D.castAnimationTime = 0;
        char3D.bodyGroup.rotation.y = 0;
        char3D.bodyGroup.rotation.x = 0;
        char3D.leftLeg.hip.rotation.x = 0;
        char3D.rightLeg.hip.rotation.x = 0;
        char3D.leftLeg.knee.rotation.x = 0;
        char3D.rightLeg.knee.rotation.x = 0;
        char3D.leftArm.shoulder.rotation.x = 0.1;
        char3D.rightArm.shoulder.rotation.x = 0.1;
      }
    }
  }, []);

  const clearPendingFight = useCallback(() => {
    pendingFightRef.current = null;
    setPendingFight(null);
  }, []);

  useEffect(() => {
    if (!pendingFight) return;

    const timeout = window.setTimeout(
      clearPendingFight,
      Math.max(0, pendingFight.expiresAt - performance.now())
    );
    const cancelOnBackground = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[id^="stickman-anchor-"]')) return;
      clearPendingFight();
    };
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clearPendingFight();
    };

    window.addEventListener('click', cancelOnBackground);
    window.addEventListener('keydown', cancelOnEscape);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('click', cancelOnBackground);
      window.removeEventListener('keydown', cancelOnEscape);
    };
  }, [pendingFight, clearPendingFight]);

  // Click handler to select a hero and optionally begin a manual player-vs-AI matchup.
  const handleSelectStickMan = useCallback(
    (element: ElementType, id: string, selectedAt: number) => {
      onStickManSelect(element);
      setActiveDialogueId(id);
      const entity = entitiesRef.current.find((e) => e.id === id);
      if (entity) {
        // Ensure stopped and waiting for 3 seconds
        entity.targetDocX = entity.docX;
        entity.targetDocY = entity.docY;
        entity.state = 'idle';
        entity.wanderTimer = 3.0; // Wait 3 seconds for next action

        onStickManWhisper(element, entity.dialogueQuote);
        const char3D = characters3DRef.current.get(id);
        if (char3D) {
          char3D.castAnimationTime = 0.8;
        }

        if (!matchup && !activeFight) {
          const decision = resolveFightSelection(pendingFightRef.current, entity, selectedAt);
          if (decision.type === 'start-window') {
            pendingFightRef.current = decision.pending;
            setPendingFight(decision.pending);
          } else if (decision.type === 'match') {
            preservedEntitiesRef.current = new Map([
              [decision.first.id, { ...decision.first }],
              [entity.id, { ...entity }],
            ]);
            handleStopStickMan(decision.first.id);
            handleStopStickMan(entity.id);
            pendingFightRef.current = null;
            setPendingFight(null);
            setActiveDialogueId(null);
            setInteractionResetKey((key) => key + 1);
            setMatchup({ first: decision.first, second: entity });
          }
        }

      }
    },
    [onStickManSelect, onStickManWhisper, matchup, activeFight, handleStopStickMan]
  );

  const restoreFightEntities = useCallback(() => {
    for (const [id, saved] of preservedEntitiesRef.current) {
      const live = entitiesRef.current.find((entity) => entity.id === id);
      if (live) Object.assign(live, saved);
    }
    preservedEntitiesRef.current.clear();
  }, []);

  const cancelMatchup = useCallback(() => {
    restoreFightEntities();
    setMatchup(null);
    setActiveFight(null);
    clearPendingFight();
    setInteractionResetKey((key) => key + 1);
  }, [clearPendingFight, restoreFightEntities]);

  const startFight = useCallback(
    (playerId: string) => {
      if (!matchup) return;
      const player = matchup.first.id === playerId ? matchup.first : matchup.second;
      const opponent = matchup.first.id === playerId ? matchup.second : matchup.first;
      setActiveFight({ player, opponent });
      setMatchup(null);
    },
    [matchup]
  );

  // Trigger 3D Magic Spell upon selection from double-tap menu
  const handleCastSpell = useCallback(
    (entity: StickManEntity, spell: ElementalSpell) => {
      if (spellActionsRef.current.isSilenced(entity.id)) {
        onStickManWhisper(entity.element, 'The void is suppressing my magic…');
        return;
      }
      // Stop moving and wait for spell duration + 3 seconds
      entity.targetDocX = entity.docX;
      entity.targetDocY = entity.docY;
      entity.state = 'idle';
      entity.wanderTimer = 3.0 + spell.duration;

      const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight * 2);
      const travelDistance = spellActionsRef.current.cast(spell, entity, entitiesRef.current, window.innerWidth, documentHeight);
      soundEngine.playSpell(spell);
      const char3D = characters3DRef.current.get(entity.id);
      if (char3D) {
        char3D.castAnimationTime = spell.duration;
        char3D.rightArm.shoulder.rotation.x = spell.castType === 'attack' ? -1.4 : -0.7;
        char3D.leftArm.shoulder.rotation.x = spell.castType === 'shield' || spell.castType === 'restore' ? -0.7 : -0.25;
      }
      onStickManSelect(entity.element);
      onStickManWhisper(entity.element, `✨ ${spell.name}!`);

      if (spellSystemRef.current) {
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const screenX = (entity.docX / 100) * winWidth;
        const screenY = (entity.docY / 100) * documentHeight - scrollY;
        const posX = screenX - winWidth / 2;
        const posY = -(screenY - winHeight / 2);

        spellSystemRef.current.castSpell(
          spell,
          posX,
          posY,
          entity.headingAngle,
          entity.scaleVariant,
          travelDistance
        );
      }
    },
    [onStickManSelect, onStickManWhisper]
  );

  // Ground click command: sends active companion stick man to clicked point
  useEffect(() => {
    const handleGroundClick = (e: MouseEvent) => {
      if (worldPausedRef.current) return;

      // Check if user clicked an interactive control
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [role="button"]')) {
        return;
      }

      const winWidth = window.innerWidth;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        winWidth * 2
      );

      const clickDocX = (e.pageX / winWidth) * 100;
      const clickDocY = (e.pageY / docHeight) * 100;

      // Spawn visual ripple beacon on ground
      const markerId = Date.now();
      setRallyMarkers((prev) => [...prev.slice(-4), { id: markerId, x: e.pageX, y: e.pageY }]);
      setTimeout(() => {
        setRallyMarkers((prev) => prev.filter((m) => m.id !== markerId));
      }, 1000);

      // Play soft rally sound
      soundEngine.playFootstep();

      // Command active companion stick man to march to that ground coordinate
      const companion = entitiesRef.current.find((ent) => ent.element === activeRealmRef.current);
      if (companion) {
        companion.targetDocX = clickDocX;
        companion.targetDocY = clickDocY;
        companion.state = 'rallying';
        companion.speed = 120; // quick rally stride in pixels/sec
      }
    };

    window.addEventListener('click', handleGroundClick);
    return () => window.removeEventListener('click', handleGroundClick);
  }, []);

  // Three.js Scene Setup and Sync Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let winWidth = window.innerWidth;
    let winHeight = window.innerHeight;
    let docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      winHeight * 2
    );

    // ── 1. Scene, Orthographic Camera, Renderer ──────────────────────
    const scene = new THREE.Scene();

    const camera = new THREE.OrthographicCamera(
      -winWidth / 2,
      winWidth / 2,
      winHeight / 2,
      -winHeight / 2,
      -1000,
      1000
    );
    camera.position.set(0, 0, 400);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(winWidth, winHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // ── 2. Lights ────────────────────────────────────────────────────
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);

    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x141a2e, 1.0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaea, 1.2);
    dirLight.position.set(200, 400, 300);
    scene.add(dirLight);

    const activePointLight = new THREE.PointLight(0xff3b00, 2.5, 400);
    activePointLight.position.set(0, 0, 100);
    scene.add(activePointLight);

    const spellSystem = new SpellEffectSystem(scene);
    const spellActions = spellActionsRef.current;
    spellSystemRef.current = spellSystem;

    // Lightweight visual QA hook: ?spellPreview=<spell-id> casts at viewport center.
    const previewApi = window as typeof window & {
      castSpellPreview?: (spellId: string, headingAngle?: number) => boolean;
      setSpellPreviewFrame?: (spellId: string, elapsed: number, headingAngle?: number) => boolean;
      getSpellPreviewCatalog?: () => Array<{ id: string; duration: number; keyframes: number[]; headings: number[] }>;
      getActiveSpellCount?: () => number;
      getSpellPreviewState?: () => SpellPreviewState | null;
    };
    let previewPaused = false;
    let previewActorId: string | null = null;
    let previewTargetId: string | null = null;
    let previewState: SpellPreviewState | null = null;
    previewApi.castSpellPreview = (spellId, headingAngle = 0.35) => {
      const spell = Object.values(ELEMENTAL_SPELLS).flat().find((candidate) => candidate.id === spellId);
      if (!spell) return false;
      spellSystem.castSpell(spell, 0, -35, headingAngle, 1);
      return true;
    };
    previewApi.getSpellPreviewCatalog = () => Object.values(ELEMENTAL_SPELLS).flat().map(spell => ({
      id: spell.id,
      duration: spell.duration,
      keyframes: [0, 0.2, 0.5, 0.8, 1].map(progress => progress * spell.duration),
      headings: [0.35, 1.15],
    }));
    previewApi.getActiveSpellCount = () => spellSystem.activeCount();
    previewApi.getSpellPreviewState = () => previewState;
    const previewSpellId = new URLSearchParams(window.location.search).get('spellPreview');
    const isSpellPreview = Boolean(previewSpellId);
    if (isSpellPreview) previewApi.setSpellPreviewFrame = (spellId, elapsed, headingAngle = 0.8) => {
      const spell = Object.values(ELEMENTAL_SPELLS).flat().find(candidate => candidate.id === spellId);
      if (!spell) return false;
      previewPaused = true;
      spellSystem.dispose();
      const source = entitiesRef.current.find(entity => entity.element === spell.element);
      const actor = source ? map3D.get(source.id) : undefined;
      let distance = 190;
      if (source && actor) {
        for (const previewCharacter of map3D.values()) previewCharacter.group.visible = false;
        const fixture = { ...source, docX: 50, docY: 50, headingAngle, scaleVariant: 1 };
        const targetSource = entitiesRef.current.find(entity => entity.id !== source.id);
        const targetFixture = targetSource ? {
          ...targetSource,
          docX: 50 + Math.sin(headingAngle) * 135 / winWidth * 100,
          docY: 50 - Math.cos(headingAngle) * 135 / (winHeight * 2) * 100,
        } : undefined;
        const targetStart = targetFixture ? { x: targetFixture.docX, y: targetFixture.docY } : undefined;
        const actions = new SpellActionSystem();
        for (let i = 0; i < 25; i++) {
          fixture.docX = 40 + i * 10 / 24;
          actions.update(0.1, targetFixture ? [fixture, targetFixture] : [fixture]);
        }
        const fixtures = targetFixture ? [fixture, targetFixture] : [fixture];
        distance = actions.cast(spell, fixture, fixtures, winWidth, winHeight * 2);
        actions.update(Math.max(0, elapsed), fixtures);
        const pose = actions.pose(fixture.id);
        const targetPose = targetFixture ? actions.pose(targetFixture.id) : undefined;
        previewState = {
          spellId: spell.id,
          caster: { startX: 50, startY: 50, x: fixture.docX, y: fixture.docY, pose },
          target: targetFixture && targetStart ? {
            startX: targetStart.x,
            startY: targetStart.y,
            x: targetFixture.docX,
            y: targetFixture.docY,
            pose: targetPose,
            silenced: actions.isSilenced(targetFixture.id),
          } : undefined,
        };
        previewActorId = source.id;
        actor.group.visible = !pose?.hidden;
        actor.group.position.set(-35 + (fixture.docX - 50) * winWidth / 100, -35 - (fixture.docY - 50) * winHeight * 2 / 100 + (pose?.lift || 0), 0);
        actor.group.rotation.set(0.44, fixture.headingAngle, 0);
        actor.bodyGroup.scale.setScalar(pose?.scale ?? 1);
        if (pose) applySpellPose(actor, pose, elapsed);
        updateHandMagicSeal(
          actor.handMagicSeal,
          Boolean(pose?.casting),
          elapsed,
          1,
          1 + (pose?.progress ? Math.sin(pose.progress * Math.PI) * .22 : 0),
        );
        if (targetFixture && targetSource) {
          const targetActor = map3D.get(targetSource.id);
          previewTargetId = targetSource.id;
          if (targetActor) {
            targetActor.group.visible = !targetPose?.hidden;
            targetActor.group.position.set(
              -35 + (targetFixture.docX - 50) * winWidth / 100,
              -35 - (targetFixture.docY - 50) * winHeight * 2 / 100 + (targetPose?.lift || 0),
              0
            );
            targetActor.group.rotation.set(0.44, fixture.headingAngle + Math.PI, 0);
            targetActor.bodyGroup.scale.setScalar(targetPose?.scale ?? 1);
            if (targetPose) applySpellPose(targetActor, targetPose, elapsed);
          }
        }
        actions.dispose();
      }
      spellSystem.castSpell(spell, -35, -35, headingAngle, 1, distance);
      spellSystem.update(Math.max(0, elapsed));
      renderer.render(scene, camera);
      return true;
    };
    if (isSpellPreview) document.body.classList.add('spell-preview-mode');
    if (previewSpellId) previewApi.castSpellPreview(previewSpellId);

    // ── 3. Build 3D Stick Men for each Entity ────────────────────────
    const map3D = new Map<string, StickMan3DCharacter>();
    characters3DRef.current = map3D;

    entitiesRef.current.forEach((entity) => {
      // In orthographic projection, character scale ~46–50 pixels
      const char3D = createStickMan3DCharacter(
        entity.id,
        entity.element,
        entity.scaleVariant * 105 // Increased character size for better visibility
      );
      char3D.group.visible = false;
      scene.add(char3D.group);
      map3D.set(entity.id, char3D);
    });

    // ── 4. Resize Handler ────────────────────────────────────────────
    const handleResize = () => {
      winWidth = window.innerWidth;
      winHeight = window.innerHeight;
      docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        winHeight * 2
      );
      camera.left = -winWidth / 2;
      camera.right = winWidth / 2;
      camera.top = winHeight / 2;
      camera.bottom = -winHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(winWidth, winHeight);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        winHeight * 2
      );
    });
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);

    // ── 5. Main Animation & Locomotion Loop ───────────────────────────
    const frameInterval = 1000 / 30;
    let lastFrameTime = performance.now();
    let lastDomSyncTime = 0;
    let prevHadDialogue = false;
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let animFrameId: number;
    const anchorElements = new Map<string, HTMLElement>();

    const tick = (now: number) => {
      animFrameId = requestAnimationFrame(tick);
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);
      const deltaSec = Math.min(elapsed / 1000, 0.08);
      const timeSec = now / 1000;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const deltaScrollY = scrollY - lastScrollY;
      lastScrollY = scrollY;

      // Update active realm point light color
      const currentDef =
        STICK_MAN_ARCHETYPES[activeRealmRef.current] || STICK_MAN_ARCHETYPES.fire;
      activePointLight.color.set(currentDef.primaryColor);

      if (worldPausedRef.current) {
        renderer.render(scene, camera);
        return;
      }

      if (!previewPaused) {
        spellActions.update(deltaSec, entitiesRef.current);
        openWorldEncounterSystem.update(
          deltaSec,
          entitiesRef.current,
          spellSystemRef.current,
          winWidth,
          winHeight,
          docHeight,
          scrollY,
          characters3DRef.current,
          spellActions
        );
      }

      // Periodic lightweight React state synchronization for live conversation UI
      if (now - lastDomSyncTime > 250) {
        lastDomSyncTime = now;
        const hasDialogue = entitiesRef.current.some((e) => e.dialogueSessionId || e.isSpeaking);
        if (hasDialogue || prevHadDialogue) {
          prevHadDialogue = hasDialogue;
          setEntities([...entitiesRef.current]);
        }
      }

      // Locomotion & Joint updates for all stick men
      entitiesRef.current.forEach((entity) => {
        const char3D = map3D.get(entity.id);
        if (!char3D) return;
        if (isSpellPreview) {
          if (entity.id !== previewActorId && entity.id !== previewTargetId) char3D.group.visible = false;
          return;
        }

        const spellPose = spellActionsRef.current.pose(entity.id);
        const shieldImpactMaterial = char3D.shockwaveMesh.material as THREE.MeshBasicMaterial;
        shieldImpactMaterial.visible = false;
        char3D.shockwaveMesh.scale.setScalar(1);
        if (!spellPose?.shielded) char3D.magicSealMesh.scale.setScalar(1);
        if (!spellPose?.paused) {
          // ── 1. Wind Element Flying across website ──────────────────────
          if (entity.state === 'flying') {
            const dx = entity.targetDocX - entity.docX;
            const dy = entity.targetDocY - entity.docY;
            const pixelDx = dx * (winWidth / 100);
            const pixelDy = dy * (docHeight / 100);
            const pixelDist = Math.hypot(pixelDx, pixelDy);

            if (pixelDist > 5) {
              const speed =
                (entity.speed || 240) *
                STICK_MAN_MOVEMENT_SPEED_SCALE *
                (spellPose?.speedMultiplier ?? 1);
              const pixelsToMove = Math.min(speed * deltaSec, pixelDist);
              const fraction = pixelsToMove / pixelDist;
              entity.docX += dx * fraction;
              entity.docY += dy * fraction;

              const targetAngle = Math.atan2(pixelDx, -pixelDy);
              entity.headingAngle = THREE.MathUtils.lerp(
                entity.headingAngle,
                targetAngle,
                0.2
              );
            }

            // Aerodynamic flight posture
            char3D.bodyGroup.rotation.x = 1.35;
            char3D.bodyGroup.rotation.z = Math.sin(timeSec * 4.5) * 0.18;
            char3D.headMesh.rotation.x = -0.65;
            char3D.leftLeg.hip.rotation.x = 0.82;
            char3D.rightLeg.hip.rotation.x = 0.82;
            char3D.leftLeg.knee.rotation.x = 0.05;
            char3D.rightLeg.knee.rotation.x = 0.05;
            char3D.leftArm.shoulder.rotation.x = -2.85;
            char3D.rightArm.shoulder.rotation.x = -2.85;
            const alt = entity.flightAltitude || 0;
            char3D.bodyGroup.position.y = 1.6 + alt / 18;
          }
          // ── 2. Ethereal Anti-Gravity Floating (Space, Void, Light, Time) ──
          else if (entity.state === 'floating') {
            const floatBob =
              Math.sin((entity.floatPhase || timeSec * 2.2) + entity.personalityOffset * 4) *
              0.28;
            char3D.bodyGroup.position.y = 1.25 + floatBob;
            char3D.bodyGroup.rotation.x = 0.04;
            char3D.bodyGroup.rotation.z =
              Math.sin(timeSec * 1.5 + entity.personalityOffset) * 0.08;
            char3D.bodyGroup.rotation.y =
              Math.sin(timeSec * 0.8 + entity.personalityOffset) * 0.25;

            // Lotus meditation / zero-g pose
            char3D.leftLeg.hip.rotation.x = -0.4;
            char3D.rightLeg.hip.rotation.x = -0.4;
            char3D.leftLeg.knee.rotation.x = 0.85;
            char3D.rightLeg.knee.rotation.x = 0.85;
            char3D.leftArm.shoulder.rotation.z = -0.45;
            char3D.rightArm.shoulder.rotation.z = 0.45;
            char3D.leftArm.elbow.rotation.x = -0.55;
            char3D.rightArm.elbow.rotation.x = -0.55;
          }
          // ── 3. Sitting on Card Ledge with Legs Dangling ──────────────────
          else if (entity.state === 'sitting') {
            char3D.bodyGroup.position.y = 0.22;
            char3D.bodyGroup.rotation.x = -0.05;
            char3D.bodyGroup.rotation.z = 0;

            const dangleSwing = Math.sin(timeSec * 2.2 + entity.personalityOffset) * 0.09;
            char3D.leftLeg.hip.rotation.x = -1.45 + dangleSwing;
            char3D.rightLeg.hip.rotation.x = -1.45 - dangleSwing;
            char3D.leftLeg.knee.rotation.x = 1.45 + dangleSwing;
            char3D.rightLeg.knee.rotation.x = 1.45 - dangleSwing;

            char3D.leftArm.shoulder.rotation.x = -0.22;
            char3D.rightArm.shoulder.rotation.x = -0.22;
            char3D.leftArm.elbow.rotation.x = -0.75;
            char3D.rightArm.elbow.rotation.x = -0.75;
            char3D.headMesh.rotation.y =
              Math.sin(timeSec * 0.7 + entity.personalityOffset) * 0.35;
          }
          // ── 4. Spell Dueling ─────────────────────────────────────────────
          else if (entity.state === 'dueling') {
            const phase = entity.duelPhase || 'challenge';

            // Face partner directly during duel
            const partner = entitiesRef.current.find((e) => e.id === entity.duelPartnerId);
            if (partner) {
              const dx = (partner.docX - entity.docX) * (winWidth / 100);
              const dy = (partner.docY - entity.docY) * (docHeight / 100);
              const angle = Math.atan2(dx, -dy);
              entity.headingAngle = THREE.MathUtils.lerp(entity.headingAngle, angle, 0.22);
            }

            // Fast combat magic seal acceleration
            char3D.magicSealMesh.rotation.z += deltaSec * 2.8;

            if (phase === 'challenge') {
              // Standoff combat stance: knees bent, staff raised, tense anticipation
              char3D.bodyGroup.position.y = 0.48 + Math.sin(timeSec * 6.0) * 0.02;
              char3D.bodyGroup.rotation.x = 0.16;
              char3D.leftLeg.hip.rotation.x = 0.3;
              char3D.leftLeg.knee.rotation.x = 0.55;
              char3D.rightLeg.hip.rotation.x = -0.3;
              char3D.rightLeg.knee.rotation.x = 0.55;

              char3D.rightArm.shoulder.rotation.x = -1.35 + Math.sin(timeSec * 7) * 0.08;
              char3D.rightArm.elbow.rotation.x = -0.6;
              char3D.leftArm.shoulder.rotation.x = -0.45;
              char3D.leftArm.elbow.rotation.x = -0.35;
              char3D.headMesh.rotation.y = 0;
            } else if (phase === 'cast1' || phase === 'cast2') {
              // Powerful casting lunge forward towards target!
              char3D.bodyGroup.position.y = 0.44;
              char3D.bodyGroup.rotation.x = 0.38; // Lean aggressively forward into cast
              char3D.leftLeg.hip.rotation.x = 0.45;
              char3D.leftLeg.knee.rotation.x = 0.75;
              char3D.rightLeg.hip.rotation.x = -0.55;
              char3D.rightLeg.knee.rotation.x = 0.25;

              // Dominant casting arm forcefully thrusting staff forward
              char3D.rightArm.shoulder.rotation.x = -2.15;
              char3D.rightArm.shoulder.rotation.z = -0.15;
              char3D.rightArm.elbow.rotation.x = -0.15; // Extended arm
              // Counter-balance arm
              char3D.leftArm.shoulder.rotation.x = 0.35;
              char3D.leftArm.elbow.rotation.x = -0.7;

              // Glowing power core pulse during cast
              char3D.powerCoreMesh.scale.set(1.9, 1.9, 1.9);
            } else if (phase === 'defend1' || phase === 'defend2') {
              // Defensive guard ward: arms raised to shield against incoming blast
              char3D.bodyGroup.position.y = 0.48;
              char3D.bodyGroup.rotation.x = 0.1;
              char3D.leftLeg.hip.rotation.x = 0.2;
              char3D.leftLeg.knee.rotation.x = 0.5;
              char3D.rightLeg.hip.rotation.x = -0.2;
              char3D.rightLeg.knee.rotation.x = 0.5;

              char3D.leftArm.shoulder.rotation.x = -1.45;
              char3D.leftArm.elbow.rotation.x = -1.1;
              char3D.rightArm.shoulder.rotation.x = -1.45;
              char3D.rightArm.elbow.rotation.x = -1.1;
            } else if (phase === 'recoil1' || phase === 'recoil2') {
              // Impact hit recoil: body knocked back, vibrating from explosion
              char3D.bodyGroup.position.y = 0.55 + Math.sin(timeSec * 30) * 0.05;
              char3D.bodyGroup.rotation.x = -0.32; // Knocked backward!
              char3D.leftLeg.hip.rotation.x = -0.2;
              char3D.rightLeg.hip.rotation.x = 0.4;
              char3D.leftLeg.knee.rotation.x = 0.3;
              char3D.rightLeg.knee.rotation.x = 0.7;

              // Arms thrown back by force
              char3D.leftArm.shoulder.rotation.x = -0.4;
              char3D.rightArm.shoulder.rotation.x = -0.4;
              char3D.leftArm.elbow.rotation.x = -0.3;
              char3D.rightArm.elbow.rotation.x = -0.3;
            } else if (phase === 'resolve') {
              // Martial arts bow / nod of mutual respect
              char3D.bodyGroup.position.y = 0.52;
              char3D.bodyGroup.rotation.x = 0.35; // Respectful bow
              char3D.leftLeg.hip.rotation.x = 0.05;
              char3D.rightLeg.hip.rotation.x = -0.05;
              char3D.leftLeg.knee.rotation.x = 0.05;
              char3D.rightLeg.knee.rotation.x = 0.05;

              // Right arm folded across chest in salute
              char3D.rightArm.shoulder.rotation.x = -0.85;
              char3D.rightArm.elbow.rotation.x = -1.4;
              char3D.leftArm.shoulder.rotation.x = 0.1;
              char3D.leftArm.elbow.rotation.x = -0.2;
            }
          }
          // ── 5. Playful Bullying / Prank ──────────────────────────────────
          else if (entity.state === 'bullying') {
            if (entity.bullyPhase === 'prank') {
              char3D.bodyGroup.position.y = 0.75 + Math.abs(Math.sin(timeSec * 8)) * 0.2;
              char3D.leftArm.shoulder.rotation.x = -1.7;
              char3D.rightArm.shoulder.rotation.x = -1.7;
            } else if (entity.bullyPhase === 'react') {
              // Victim's startled jump and frantic spin!
              char3D.bodyGroup.position.y = 0.85 + Math.abs(Math.sin(timeSec * 10)) * 0.35;
              char3D.bodyGroup.rotation.y += deltaSec * 7.5;
              char3D.leftArm.shoulder.rotation.x = -2.2;
              char3D.rightArm.shoulder.rotation.x = -2.2;
              char3D.leftArm.elbow.rotation.x = -0.8;
              char3D.rightArm.elbow.rotation.x = -0.8;
              char3D.leftLeg.knee.rotation.x = 0.9;
              char3D.rightLeg.knee.rotation.x = 0.9;
            } else {
              // Sneaking crouch
              char3D.bodyGroup.position.y = 0.42;
              char3D.bodyGroup.rotation.x = 0.3;
              char3D.leftLeg.knee.rotation.x = 0.6;
              char3D.rightLeg.knee.rotation.x = 0.6;
              char3D.leftArm.shoulder.rotation.x = -0.5;
              char3D.rightArm.shoulder.rotation.x = -0.5;
            }
          }
          // ── 6. Social Talking ────────────────────────────────────────────
          else if (entity.state === 'talking') {
            const partner = entitiesRef.current.find((candidate) => candidate.id === entity.dialoguePartnerId);
            if (partner) {
              const dx = (partner.docX - entity.docX) * (winWidth / 100);
              const dy = (partner.docY - entity.docY) * (docHeight / 100);
              const faceAngle = Math.atan2(dx, -dy);
              entity.headingAngle = THREE.MathUtils.lerp(entity.headingAngle, faceAngle, 0.28);
            }
            char3D.bodyGroup.position.y = 0.55 + Math.sin(timeSec * 2.5) * 0.02;
            char3D.bodyGroup.rotation.x = 0.05;
            char3D.rightArm.shoulder.rotation.x = -0.5 + Math.sin(timeSec * 3.5) * 0.25;
            char3D.leftArm.shoulder.rotation.x = -0.2 + Math.sin(timeSec * 2.0) * 0.1;
            char3D.leftArm.elbow.rotation.x = -0.4;
            char3D.rightArm.elbow.rotation.x = -0.55;
            char3D.headMesh.rotation.y = Math.sin(timeSec * 2.2) * 0.15;
          }
          // ── 7. Walking & Rallying ────────────────────────────────────────
          else if (entity.state === 'walking' || entity.state === 'rallying') {
            const dx = entity.targetDocX - entity.docX;
            const dy = entity.targetDocY - entity.docY;
            const pixelDx = dx * (winWidth / 100);
            const pixelDy = dy * (docHeight / 100);
            const pixelDist = Math.hypot(pixelDx, pixelDy);

            if (pixelDist > 5) {
              const currentSpeed =
                (entity.state === 'rallying' ? 120 : entity.speed) *
                STICK_MAN_MOVEMENT_SPEED_SCALE *
                (spellPose?.speedMultiplier ?? 1);
              const pixelsToMove = Math.min(currentSpeed * deltaSec, pixelDist);
              const fraction = pixelsToMove / pixelDist;
              entity.docX += dx * fraction;
              entity.docY += dy * fraction;

              const targetAngle = Math.atan2(pixelDx, -pixelDy);
              entity.headingAngle = THREE.MathUtils.lerp(
                entity.headingAngle,
                targetAngle,
                0.16
              );

              const strideLength = 24;
              entity.walkCycle += (pixelsToMove / strideLength) * Math.PI;

              const legSwing = Math.sin(entity.walkCycle) * 0.72;
              char3D.leftLeg.hip.rotation.x = legSwing;
              char3D.rightLeg.hip.rotation.x = -legSwing;
              char3D.leftLeg.knee.rotation.x = Math.max(0, -legSwing) * 0.85;
              char3D.rightLeg.knee.rotation.x = Math.max(0, legSwing) * 0.85;

              const armSwing = Math.cos(entity.walkCycle) * 0.58;
              char3D.leftArm.shoulder.rotation.x = -armSwing;
              char3D.rightArm.shoulder.rotation.x = armSwing;
              char3D.rightArm.shoulder.rotation.z = 0;
              char3D.leftArm.elbow.rotation.x = -0.35 - Math.max(0, armSwing) * 0.35;
              char3D.rightArm.elbow.rotation.x = -0.35 - Math.max(0, -armSwing) * 0.35;

              char3D.bodyGroup.position.y =
                0.55 + Math.abs(Math.sin(entity.walkCycle)) * 0.08;
              char3D.bodyGroup.rotation.x = 0.12;
            } else {
              entity.state = 'idle';
              entity.wanderTimer = 3.5 + Math.random() * 5.0;
              entity.currentWaypointIdx =
                (entity.currentWaypointIdx + 1) % entity.waypoints.length;
            }
          }
          // ── 8. Cheering ──────────────────────────────────────────────────
          else if (entity.state === 'cheering') {
            entity.walkCycle += deltaSec * 10;
            char3D.bodyGroup.position.y =
              0.55 + Math.abs(Math.sin(entity.walkCycle)) * 0.28;
            char3D.leftArm.shoulder.rotation.x = -1.8;
            char3D.rightArm.shoulder.rotation.x = -1.8;
            char3D.bodyGroup.rotation.y += deltaSec * 4.0;
            char3D.castAnimationTime -= deltaSec;
            if (char3D.castAnimationTime <= 0) {
              entity.state = 'idle';
              char3D.bodyGroup.rotation.y = 0;
            }
          }
          // ── 9. Idle / Station Guard ──────────────────────────────────────
          else {
            char3D.leftLeg.hip.rotation.x = THREE.MathUtils.lerp(
              char3D.leftLeg.hip.rotation.x,
              0.04,
              0.1
            );
            char3D.rightLeg.hip.rotation.x = THREE.MathUtils.lerp(
              char3D.rightLeg.hip.rotation.x,
              -0.04,
              0.1
            );
            char3D.leftLeg.knee.rotation.x = THREE.MathUtils.lerp(
              char3D.leftLeg.knee.rotation.x,
              0.06,
              0.1
            );
            char3D.rightLeg.knee.rotation.x = THREE.MathUtils.lerp(
              char3D.rightLeg.knee.rotation.x,
              0.06,
              0.1
            );

            char3D.leftArm.shoulder.rotation.x =
              Math.sin(timeSec * 1.6 + entity.personalityOffset) * 0.08 + 0.1;
            char3D.rightArm.shoulder.rotation.x =
              -Math.sin(timeSec * 1.6 + entity.personalityOffset) * 0.08 + 0.1;
            char3D.rightArm.shoulder.rotation.z = 0;
            char3D.leftArm.elbow.rotation.x = -0.35;
            char3D.rightArm.elbow.rotation.x = -0.45;

            char3D.bodyGroup.position.y =
              0.55 + Math.sin(timeSec * 2.5 + entity.personalityOffset * 4) * 0.02;
            char3D.bodyGroup.rotation.x = THREE.MathUtils.lerp(
              char3D.bodyGroup.rotation.x,
              0,
              0.12
            );

            if (CURSOR.x > 0) {
              const screenX = (entity.docX / 100) * winWidth;
              const lookDx = THREE.MathUtils.clamp((CURSOR.x - screenX) * 0.003, -0.6, 0.6);
              char3D.headMesh.rotation.y = THREE.MathUtils.lerp(
                char3D.headMesh.rotation.y,
                lookDx,
                0.1
              );
            }

            entity.wanderTimer -= deltaSec;
            if (entity.wanderTimer <= 0) {
              const nextWp = entity.waypoints[entity.currentWaypointIdx];
              entity.targetDocX = nextWp.x;
              entity.targetDocY = nextWp.y;
              entity.state = 'walking';
            }
          }

        // Chest power core pulse
        const pulse = 1.0 + Math.sin(timeSec * 4.0 + entity.personalityOffset * 6) * 0.22;
        char3D.powerCoreMesh.scale.set(pulse, pulse, pulse);

        // Orbiting elemental vortexes, waves, rocks, embers, or planetary rings
        const orbitFX = char3D.headElementGroup.getObjectByName('head-orbit-fx');
        if (orbitFX) {
          orbitFX.rotation.y += deltaSec * 2.0;
        }

        // Rotating clockwork gear for time element
        const timeGear = char3D.headElementGroup.getObjectByName('time-gear-halo');
        if (timeGear) {
          timeGear.rotation.z += deltaSec * 1.2;
        }

        char3D.bodyElementGroup.rotation.y -= deltaSec * 1.1;

        // Magic seal rotation on ground
        char3D.magicSealMesh.rotation.z += deltaSec * 0.6;

        if (char3D.castAnimationTime > 0) {
          char3D.castAnimationTime = Math.max(0, char3D.castAnimationTime - deltaSec);
        }

        }

        if (spellPose) applySpellPose(char3D, spellPose, timeSec);

        const duelCast = entity.state === 'dueling'
          && (entity.duelPhase === 'cast1' || entity.duelPhase === 'cast2');
        const superMoveCast = entity.state === 'cheering' && char3D.castAnimationTime > 0;
        updateHandMagicSeal(
          char3D.handMagicSeal,
          Boolean(spellPose?.casting || duelCast || superMoveCast),
          timeSec,
          deltaSec,
          1 + (spellPose?.progress ? Math.sin(spellPose.progress * Math.PI) * .22 : 0),
        );

        // Calculate 3D position relative to viewport screen space
        const pixelX = (entity.docX / 100) * winWidth;
        const pixelY = (entity.docY / 100) * docHeight;
        const screenX = pixelX;
        const screenY = pixelY - scrollY;

        // Keep 3D coordinates always synchronized so meshes are never trapped at (0, 0)
        char3D.group.position.x = screenX - winWidth / 2;
        char3D.group.position.y = -(screenY - winHeight / 2) + (spellPose?.lift || 0);
        char3D.group.position.z = 0;
        char3D.bodyGroup.scale.setScalar(spellPose?.scale ?? 1);
        char3D.group.rotation.x = 0.44;
        char3D.group.rotation.y = entity.headingAngle;

        // Frustum cull: only render visible meshes near current viewport
        if (screenY >= -140 && screenY <= winHeight + 140) {
          char3D.group.visible = !spellPose?.hidden;

          // Direct 60 FPS DOM anchor synchronization
          let anchorEl = anchorElements.get(entity.id);
          if (!anchorEl) {
            anchorEl = document.getElementById(`stickman-anchor-${entity.id}`) || undefined;
            if (anchorEl) anchorElements.set(entity.id, anchorEl);
          }
          if (anchorEl) {
            anchorEl.style.left = `${entity.docX}%`;
            anchorEl.style.top = `${entity.docY}%`;
          }
        } else {
          char3D.group.visible = false;
        }
      });

      // Update active 3D magic seals & spell effects
      if (!previewPaused) spellSystem.update(deltaSec, deltaScrollY);

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      anchorElements.clear();
      spellSystem.dispose();
      spellActions.dispose();
      spellSystemRef.current = null;
      delete previewApi.setSpellPreviewFrame;
      delete previewApi.castSpellPreview;
      delete previewApi.getSpellPreviewCatalog;
      delete previewApi.getActiveSpellCount;
      delete previewApi.getSpellPreviewState;
      document.body.classList.remove('spell-preview-mode');
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <>
      {/* ── 1. Fixed Transparent Three.js WebGL Canvas ────────────────── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="spell-world-canvas fixed inset-0 pointer-events-none z-20 w-full h-full"
      />

      {/* ── 2. Full-Document DOM Overlay (Speech bubbles & click targets) ─ */}
      <StickManDOMOverlay
        key={interactionResetKey}
        entities={entities}
        activeRealm={activeRealm}
        activeDialogueId={activeDialogueId}
        onSelectStickMan={handleSelectStickMan}
        onDismissDialogue={() => setActiveDialogueId(null)}
        onCastSpell={handleCastSpell}
        onStopStickMan={handleStopStickMan}
        rallyMarkers={rallyMarkers}
        pendingFightId={pendingFight?.entity.id}
        pendingFightStartedAt={pendingFight?.startedAt}
      />

      {matchup && (
        <FightConfirmationModal
          first={matchup.first}
          second={matchup.second}
          onStart={startFight}
          onCancel={cancelMatchup}
        />
      )}

      {activeFight && (
        <FightArena
          playerEntity={activeFight.player}
          opponentEntity={activeFight.opponent}
          onReturn={cancelMatchup}
          onChooseDifferent={cancelMatchup}
        />
      )}
    </>
  );
};
