'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Pause, Play, RotateCcw, Swords, X } from 'lucide-react';
import type { StickManEntity } from '../../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { ELEMENTAL_SPELLS } from '../../data/elementalSpells';
import { createStickMan3DCharacter } from '../../systems/stickManModelFactory';
import { SpellEffectSystem, type SpellEffectHandle } from '../../systems/spellEffectSystem';
import { soundEngine } from '../../systems/soundEngine';
import { CombatEngine } from '../../systems/fight/combatEngine';
import { FighterAI } from '../../systems/fight/fighterAI';
import { applyCombatAnimation } from '../../systems/fight/combatAnimation';
import { getCombatSpellHitRadius, getCombatSpellPresentation } from '../../systems/fight/spellPresentation';
import { isUltimateSpell } from '../../systems/spellPresentation';
import { EMPTY_FIGHT_INPUT, type FightInput, type FightSnapshot, type FighterConfig } from '../../systems/fight/types';
import { FightHUD } from './FightHUD';
import { FightControls } from './FightControls';

interface FightArenaProps {
  playerEntity: StickManEntity;
  opponentEntity: StickManEntity;
  onReturn: () => void;
  onChooseDifferent: () => void;
}

function configFromEntity(entity: StickManEntity): FighterConfig {
  const definition = STICK_MAN_ARCHETYPES[entity.element];
  return {
    id: entity.id,
    name: entity.name,
    element: entity.element,
    spells: ELEMENTAL_SPELLS[entity.element],
    stats: definition.stats,
  };
}

export function FightArena({ playerEntity, opponentEntity, onReturn, onChooseDifferent }: FightArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef(new FighterAI());
  const heldRef = useRef({ left: false, right: false });
  const jumpQueueRef = useRef(0);
  const jumpQueueExpiresAtRef = useRef(0);
  const inputRef = useRef<FightInput>({ ...EMPTY_FIGHT_INPUT });
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [spellCallout, setSpellCallout] = useState<{ text: string; side: 'player' | 'opponent'; key: number } | null>(null);

  const [engine] = useState(() => new CombatEngine(configFromEntity(playerEntity), configFromEntity(opponentEntity)));
  const [snapshot, setSnapshot] = useState<FightSnapshot>(() => engine.snapshot());
  const playerDef = STICK_MAN_ARCHETYPES[playerEntity.element];
  const opponentDef = STICK_MAN_ARCHETYPES[opponentEntity.element];

  const setPauseState = useCallback((value: boolean) => {
    pausedRef.current = value;
    setPaused(value);
    inputRef.current = { ...EMPTY_FIGHT_INPUT };
    jumpQueueRef.current = 0;
    jumpQueueExpiresAtRef.current = 0;
    heldRef.current = { left: false, right: false };
  }, []);

  const rematch = useCallback(() => {
    engine.reset();
    aiRef.current.reset();
    setPauseState(false);
    setSnapshot(engine.snapshot());
  }, [engine, setPauseState]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('fight-mode-active');
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.classList.remove('fight-mode-active');
    };
  }, []);

  useEffect(() => {
    if (!spellCallout) return;
    const timeout = window.setTimeout(() => setSpellCallout(null), 1_050);
    return () => window.clearTimeout(timeout);
  }, [spellCallout]);

  useEffect(() => {
    const keyFor = (event: KeyboardEvent, down: boolean) => {
      if (event.key === 'Escape' && down) {
        event.preventDefault();
        setPauseState(!pausedRef.current);
        return;
      }
      const key = event.key.toLowerCase();
      if (['a', 'd', 'w', 'arrowleft', 'arrowright', 'arrowup', 'j', 'k', '1', '2', '3'].includes(key)) {
        event.preventDefault();
      }
      if (key === 'a' || key === 'arrowleft') heldRef.current.left = down;
      if (key === 'd' || key === 'arrowright') heldRef.current.right = down;
      inputRef.current.move = heldRef.current.left === heldRef.current.right ? 0 : heldRef.current.left ? -1 : 1;
      if (!down || event.repeat) return;
      if (key === 'w' || key === 'arrowup') {
        jumpQueueRef.current = Math.min(2, jumpQueueRef.current + 1);
        jumpQueueExpiresAtRef.current = performance.now() + 420;
      }
      if (key === 'j') inputRef.current.punch = true;
      if (key === 'k') inputRef.current.kick = true;
      if (key === '1' || key === '2' || key === '3') inputRef.current.spell = (Number(key) - 1) as 0 | 1 | 2;
    };
    const down = (event: KeyboardEvent) => keyFor(event, true);
    const up = (event: KeyboardEvent) => keyFor(event, false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [setPauseState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      window.setTimeout(() => setRenderError('This browser could not start the WebGL fight arena.'), 0);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    camera.position.set(0, 0, 400);
    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    const keyLight = new THREE.DirectionalLight(0xfff1d6, 1.8);
    keyLight.position.set(200, 300, 250);
    scene.add(ambient, keyLight);

    const playerModel = createStickMan3DCharacter(`fight-${playerEntity.id}`, playerEntity.element, 260);
    const opponentModel = createStickMan3DCharacter(`fight-${opponentEntity.id}`, opponentEntity.element, 260);
    scene.add(playerModel.group, opponentModel.group);
    const spellEffects = new SpellEffectSystem(scene);
    const trackedTargetEffects: Array<{
      handle: SpellEffectHandle;
      fighterId: string;
      action: `spell${1 | 2 | 3}`;
    }> = [];
    let width = window.innerWidth;
    let height = window.innerHeight;
    let groundY = -height * 0.19;
    let unit = Math.min(92, width / 12.8);

    const floorMaterial = new THREE.MeshBasicMaterial({ color: playerDef.primaryColor, transparent: true, opacity: 0.22 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2000, 4), floorMaterial);
    floor.position.y = groundY - 4;
    scene.add(floor);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      unit = Math.min(92, width / 12.8);
      groundY = -height * 0.19;
      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height, false);
      floor.position.y = groundY - 4;
    };
    resize();
    window.addEventListener('resize', resize);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = 0;
    let previous = performance.now();
    let lastHud = 0;
    let shakeUntil = 0;
    const tick = (now: number) => {
      frameId = requestAnimationFrame(tick);
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!pausedRef.current) {
        if (now > jumpQueueExpiresAtRef.current) jumpQueueRef.current = 0;
        const before = engine.snapshot();
        const aiInput = aiRef.current.update(delta, before);
        const hasBufferedJump = jumpQueueRef.current > 0;
        inputRef.current.jump = hasBufferedJump;
        engine.step(delta, inputRef.current, aiInput);
        if (hasBufferedJump) {
          const after = engine.snapshot().player;
          const accepted = after.jumpsUsed !== before.player.jumpsUsed
            || after.flightTime > before.player.flightTime;
          if (accepted) jumpQueueRef.current -= 1;
          else if (after.jumpsUsed >= 2) jumpQueueRef.current = 0;
        }
        inputRef.current.jump = false;
        inputRef.current.punch = false;
        inputRef.current.kick = false;
        inputRef.current.spell = null;
      }

      const current = engine.snapshot();
      for (const event of engine.drainEvents()) {
        if (event.type === 'cast') {
          const fighter = event.fighterId === current.player.id ? current.player : current.opponent;
          const spell = fighter.spells[event.spellIndex];
          if (spell) {
            soundEngine.playSpell(spell);
            setSpellCallout({
              text: spell.name,
              side: fighter.id === current.player.id ? 'player' : 'opponent',
              key: now,
            });
            const casterX = event.originX * unit;
            const targetX = event.targetX * unit;
            const presentation = getCombatSpellPresentation(spell, casterX, targetX);
            const originX = presentation.anchor === 'target' ? targetX : casterX;
            const originY = presentation.anchor === 'target'
              ? groundY
              : groundY + fighter.y * unit;
            const ultimateMultiplier = spell.id === 'fire-dragon-meteor'
              ? 1.2
              : isUltimateSpell(spell.id) ? 1.08 : 1;
            const worldScale = 1.45 * 1.25 * ultimateMultiplier * presentation.scale;
            const handle = spellEffects.castSpell(
              spell,
              originX,
              originY,
              fighter.facing > 0 ? Math.PI / 2 : -Math.PI / 2,
              1,
              presentation.travelPixels / worldScale,
              presentation.scale,
              true,
              spell.target === 'area' ? getCombatSpellHitRadius(spell) * unit : 0,
            );
            if (handle && presentation.anchor === 'target') {
              trackedTargetEffects.push({
                handle,
                fighterId: fighter.id,
                action: `spell${event.spellIndex + 1}` as `spell${1 | 2 | 3}`,
              });
            }
          }
        } else if (event.type === 'jump') {
          soundEngine.playStickManJump();
        } else if (event.type === 'flight') {
          const fighter = event.fighterId === current.player.id ? current.player : current.opponent;
          soundEngine.playStickManJump();
          setSpellCallout({
            text: 'Wind Flight',
            side: fighter.id === current.player.id ? 'player' : 'opponent',
            key: now,
          });
        } else if (event.type === 'hit') {
          soundEngine.playFootstep();
          if (!reducedMotion) shakeUntil = now + 115;
        } else if (event.type === 'ko') {
          soundEngine.playSuperMove(event.fighterId === current.player.id ? current.opponent.element : current.player.element);
        }
      }

      // Target-locked spells follow the opponent only through their wind-up.
      // At the active frame both the effect and engine hit area lock in place.
      for (let index = trackedTargetEffects.length - 1; index >= 0; index -= 1) {
        const tracked = trackedTargetEffects[index];
        const caster = tracked.fighterId === current.player.id ? current.player : current.opponent;
        if (!tracked.handle.isAlive() || caster.action !== tracked.action || caster.actionTargetX === null) {
          trackedTargetEffects.splice(index, 1);
          continue;
        }
        tracked.handle.setPosition(caster.actionTargetX * unit, groundY);
        if (caster.actionConnected) trackedTargetEffects.splice(index, 1);
      }

      const place = (model: typeof playerModel, fighter: typeof current.player) => {
        model.group.position.set(fighter.x * unit, groundY + fighter.y * unit, 0);
        model.group.rotation.x = 0.14;
        model.group.rotation.y = fighter.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
        const activeSpellIndex = fighter.action.startsWith('spell')
          ? Number(fighter.action.slice(-1)) - 1
          : -1;
        const activeSpell = activeSpellIndex >= 0 ? fighter.spells[activeSpellIndex] : undefined;
        // Portal Step vanishes only during the travel beat, then visibly
        // emerges from the second portal at its new engine position.
        model.group.visible = !(activeSpell?.action === 'teleport'
          && fighter.actionTime > 0.255
          && fighter.actionTime < 0.43);
        applyCombatAnimation(model, fighter, now / 1000, delta);
      };
      place(playerModel, current.player);
      place(opponentModel, current.opponent);
      spellEffects.update(delta * 1.18);

      if (arenaRef.current) {
        arenaRef.current.style.transform = shakeUntil > now ? `translate(${Math.sin(now) * 5}px, ${Math.cos(now * 1.7) * 3}px)` : '';
      }
      renderer.render(scene, camera);
      if (now - lastHud > 80) {
        lastHud = now;
        setSnapshot(current);
      }
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      spellEffects.dispose();
      scene.traverse(object => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
        materials.forEach(material => material.dispose());
      });
      scene.clear();
      renderer.dispose();
    };
  // The arena owns fixed fighter instances for its entire mounted lifetime.
  }, [engine, opponentEntity.element, opponentEntity.id, playerDef.primaryColor, playerEntity.element, playerEntity.id]);

  const onMove = (move: -1 | 0 | 1) => {
    inputRef.current.move = move;
  };
  const onAction = (action: Pick<FightInput, 'jump' | 'punch' | 'kick' | 'spell'>) => {
    if (action.jump) {
      jumpQueueRef.current = Math.min(2, jumpQueueRef.current + 1);
      jumpQueueExpiresAtRef.current = performance.now() + 420;
    }
    Object.assign(inputRef.current, { ...action, jump: false });
  };
  const winner = snapshot.result?.winnerId === snapshot.player.id
    ? snapshot.player
    : snapshot.result?.winnerId === snapshot.opponent.id
      ? snapshot.opponent
      : null;

  return (
    <div
      ref={arenaRef}
      className="fight-arena"
      style={{
        '--player-color': playerDef.primaryColor,
        '--opponent-color': opponentDef.primaryColor,
        background: `radial-gradient(circle at 18% 42%, ${playerDef.glowColor}, transparent 38%), radial-gradient(circle at 82% 42%, ${opponentDef.glowColor}, transparent 38%), linear-gradient(180deg, #090d1d 0%, #11182b 58%, #050711 100%)`,
      } as React.CSSProperties}
      onContextMenu={event => event.preventDefault()}
    >
      <div className="fight-stage-background" aria-hidden="true">
        <span className="fight-stage-emblem">ELEMENTAL ARENA</span>
        <span className="fight-stage-crowd" />
        <span className="fight-stage-pylon left" />
        <span className="fight-stage-pylon right" />
        <span className="fight-stage-floor" />
        <span className="fight-stage-ring" />
      </div>
      <canvas ref={canvasRef} className="fight-arena-canvas" aria-label={`${playerEntity.name} versus ${opponentEntity.name} fight arena`} />
      <FightHUD snapshot={snapshot} />
      {spellCallout && (
        <div key={spellCallout.key} className={`fight-spell-callout ${spellCallout.side}`} aria-live="polite">
          <small>{spellCallout.side === 'player' ? snapshot.player.name : snapshot.opponent.name}</small>
          <strong>{spellCallout.text}</strong>
        </div>
      )}
      <button className="fight-pause-button" onClick={() => setPauseState(true)} aria-label="Pause fight"><Pause size={18} /></button>

      {snapshot.phase === 'intro' && (
        <div className="fight-intro" aria-live="polite">
          <div><span style={{ color: playerDef.primaryColor }}>{playerEntity.name}</span><b>VS</b><span style={{ color: opponentDef.primaryColor }}>{opponentEntity.name}</span></div>
          <strong>{snapshot.introTime > 1 ? Math.ceil(snapshot.introTime - 1) : 'FIGHT!'}</strong>
          <small>A/D MOVE · W JUMP · J PUNCH · K KICK · 1 2 3 SPELLS</small>
        </div>
      )}

      <FightControls fighter={snapshot.player} spells={snapshot.player.spells} onMove={onMove} onAction={onAction} />

      {paused && snapshot.phase !== 'finished' && (
        <div className="fight-result-backdrop" role="dialog" aria-modal="true" aria-label="Fight paused">
          <div className="fight-result-panel">
            <Pause size={28} /><h2>Fight paused</h2>
            <button className="fight-primary-button" onClick={() => setPauseState(false)}><Play size={16} /> Resume</button>
            <button className="fight-secondary-button" onClick={onReturn}><X size={16} /> Return to portfolio</button>
          </div>
        </div>
      )}

      {snapshot.phase === 'finished' && (
        <div className="fight-result-backdrop" role="dialog" aria-modal="true" aria-labelledby="fight-result-title">
          <div className="fight-result-panel">
            <Swords size={32} />
            <p>{snapshot.result?.reason === 'ko' ? 'KNOCKOUT' : snapshot.result?.reason === 'draw' ? 'TIME EXPIRED' : 'TIME VICTORY'}</p>
            <h2 id="fight-result-title">{winner ? `${winner.name} wins!` : 'Draw!'}</h2>
            <button className="fight-primary-button" onClick={rematch}><RotateCcw size={16} /> Rematch</button>
            <button className="fight-secondary-button" onClick={onChooseDifferent}>Choose different fighters</button>
            <button className="fight-text-button" onClick={onReturn}>Return to portfolio</button>
          </div>
        </div>
      )}

      {renderError && (
        <div className="fight-result-backdrop" role="alertdialog" aria-modal="true">
          <div className="fight-result-panel"><h2>Arena unavailable</h2><p>{renderError}</p><button className="fight-primary-button" onClick={onReturn}>Return to portfolio</button></div>
        </div>
      )}
    </div>
  );
}
