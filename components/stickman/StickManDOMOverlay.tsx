'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ElementType } from '../../types';
import { StickManEntity } from '../../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { ELEMENTAL_SPELLS, ElementalSpell } from '../../data/elementalSpells';
import { soundEngine } from '../../systems/soundEngine';
import { visitDialogueDeck } from '../../systems/visitDialogueDeck';

const ROLE_ICONS: Record<ElementalSpell['castType'], string> = {
  attack: '⚔', shield: '⬡', restore: '✚', summon: '◇', control: '⌁', mobility: '➜',
};

interface RallyMarker {
  id: number;
  x: number;
  y: number;
}

interface StickManDOMOverlayProps {
  entities: StickManEntity[];
  activeRealm: ElementType;
  activeDialogueId: string | null;
  onSelectStickMan: (element: ElementType, id: string, selectedAt: number) => void;
  onDismissDialogue: () => void;
  onCastSpell: (entity: StickManEntity, spell: ElementalSpell) => void;
  onStopStickMan: (id: string) => void;
  rallyMarkers: RallyMarker[];
  pendingFightId?: string | null;
  pendingFightStartedAt?: number | null;
}

export const StickManDOMOverlay: React.FC<StickManDOMOverlayProps> = ({
  entities,
  activeDialogueId,
  onSelectStickMan,
  onDismissDialogue,
  onCastSpell,
  onStopStickMan,
  rallyMarkers,
  pendingFightId = null,
  pendingFightStartedAt = null,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeSpellMenuId, setActiveSpellMenuId] = useState<string | null>(null);
  const hasActiveConversation = entities.some((entity) => Boolean(entity.dialogueSessionId));

  // Click tracker for quick double-tap / double-click detection
  const clickTrackerRef = useRef<{ id: string; time: number; timer: NodeJS.Timeout | null }>({
    id: '',
    time: 0,
    timer: null,
  });

  // Auto-dismiss dialogue after 6.5s
  useEffect(() => {
    if (!activeDialogueId) return;
    const timer = setTimeout(() => {
      onDismissDialogue();
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeDialogueId, onDismissDialogue]);

  // Click outside to close spell menu
  useEffect(() => {
    const handleWindowClick = () => {
      if (activeSpellMenuId) {
        setActiveSpellMenuId(null);
      }
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [activeSpellMenuId]);

  const handleAnchorClick = (e: React.MouseEvent, entity: StickManEntity) => {
    e.stopPropagation();
    // Preserve the selection time through the single-click confirmation delay.
    // eslint-disable-next-line react-hooks/purity
    const selectedAt = performance.now();
    // Event timestamps are not consistently normalized for synthetic touch events.
    // This is an interaction handler (not render), so the monotonic browser clock is intentional.
    const tracker = clickTrackerRef.current;

    // Immediately stop moving on ANY tap or double-tap and wait for another action for 3 seconds
    onStopStickMan(entity.id);

    // Check if clicked twice quickly on the same character (~320ms threshold)
    if (tracker.id === entity.id && selectedAt - tracker.time < 320) {
      // Double tap detected! Cancel single click timer
      if (tracker.timer) {
        clearTimeout(tracker.timer);
        tracker.timer = null;
      }
      tracker.time = 0;
      tracker.id = '';

      // Open this element's ability menu.
      soundEngine.playSpiritClick(entity.element);
      setActiveSpellMenuId(entity.id);
      onDismissDialogue();
    } else {
      // First click! Set tracker and start single-tap delay timer
      tracker.id = entity.id;
      tracker.time = selectedAt;
      if (tracker.timer) clearTimeout(tracker.timer);

      tracker.timer = setTimeout(() => {
        // Single tap confirmed: select character & move to next tap position
        soundEngine.playSpiritClick(entity.element);
        onSelectStickMan(entity.element, entity.id, selectedAt);
        tracker.id = '';
        tracker.timer = null;
      }, 300);
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-30"
      style={{ overflowX: 'clip', overflowY: 'visible' }}
    >
      {/* ── 1. Ground Rally Markers (Click command beacon) ─────────────── */}
      {rallyMarkers.map((m) => (
        <div
          key={m.id}
          className="rally-beacon-ripple"
          style={{ left: `${m.x}px`, top: `${m.y}px` }}
        >
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-60"
            style={{ border: '2px solid var(--color-primary)' }}
          />
        </div>
      ))}

      {/* ── 2. Stick Men Interactive Anchors across the Document ─────── */}
      {entities.map((entity) => {
        const def = STICK_MAN_ARCHETYPES[entity.element] || STICK_MAN_ARCHETYPES.fire;
        const spells = ELEMENTAL_SPELLS[entity.element] || ELEMENTAL_SPELLS.fire;
        const isConversation = Boolean(entity.dialogueSessionId);
        const isSpeaking = Boolean(
          (entity.isSpeaking || activeDialogueId === entity.id) &&
            !isConversation &&
            !hasActiveConversation
        );
        const isSpellMenuOpen = activeSpellMenuId === entity.id;
        const isPendingFighter = pendingFightId === entity.id;
        const displayText = entity.activeDialogue || entity.dialogueQuote;
        const actionNote =
          entity.dialogueNote ||
          (entity.state === 'sitting'
            ? `🪑 Perched on ${entity.perchCardName || 'Card Ledge'}`
            : entity.state === 'talking'
            ? 'Conversation'
            : entity.state === 'flying'
            ? '🍃 Flying Across Realm'
            : entity.state === 'floating'
            ? '🌌 Zero-G Floating'
            : '✦ Open-World Explorer');

        const isHovered = hoveredId === entity.id;
        return (
          <div
            key={entity.id}
            id={`stickman-anchor-${entity.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
            style={{
              left: `${entity.docX}%`,
              top: `${entity.docY}%`,
              width: '60px',
              height: '74px',
            }}
            onMouseEnter={() => {
              setHoveredId(entity.id);
            }}
            onMouseLeave={() => {
              if (hoveredId === entity.id) setHoveredId(null);
            }}
            onClick={(e) => handleAnchorClick(e, entity)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              const tracker = clickTrackerRef.current;
              if (tracker.timer) clearTimeout(tracker.timer);
              tracker.timer = null;
              tracker.id = '';
              tracker.time = 0;
              onStopStickMan(entity.id);
              setActiveSpellMenuId(entity.id);
              onDismissDialogue();
            }}
          >
            {/* Element-specific ability menu */}
            {isSpellMenuOpen && (
              <div
                className="absolute bottom-[115%] left-1/2 -translate-x-1/2 w-72 max-w-[92vw] p-3 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto text-left z-50 animate-in fade-in zoom-in-95 duration-200"
                style={{
                  backgroundColor: 'rgba(10, 15, 30, 0.96)',
                  borderColor: `${def.primaryColor}95`,
                  boxShadow: `0 8px 36px ${def.glowColor}, 0 20px 45px rgba(0,0,0,0.85)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Speech arrow pointing to stick man */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r border-b"
                  style={{
                    backgroundColor: 'rgba(10, 15, 30, 0.96)',
                    borderColor: `${def.primaryColor}95`,
                  }}
                />

                {/* Box Header */}
                <div className="flex items-center justify-between gap-2 mb-2 border-b pb-1.5 border-white/15">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{def.symbol}</span>
                    <span className="text-[12px] font-black uppercase tracking-wider text-white">
                      {entity.name} Spells
                    </span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                      style={{
                        color: def.primaryColor,
                        borderColor: `${def.primaryColor}60`,
                        backgroundColor: `${def.primaryColor}15`,
                      }}
                    >
                      {spells.length} abilities
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSpellMenuId(null);
                    }}
                    className="text-white/50 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Element-specific abilities */}
                <div className="space-y-1.5">
                  {spells.map((spell) => (
                    <button
                      key={spell.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCastSpell(entity, spell);
                        setActiveSpellMenuId(null);
                      }}
                      className="w-full min-h-14 text-left p-2 rounded-xl border transition-all duration-150 group flex flex-col gap-0.5 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      aria-label={`${spell.name}, ${spell.castType}, targets ${spell.target}. ${spell.description}`}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = def.primaryColor;
                        e.currentTarget.style.backgroundColor = `${def.primaryColor}18`;
                        e.currentTarget.style.boxShadow = `0 0 14px ${def.primaryColor}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base group-hover:scale-125 transition-transform">
                            {spell.icon}
                          </span>
                          <span className="text-[11px] font-bold text-white group-hover:text-white">
                            {spell.name}
                          </span>
                        </div>
                        <span
                          className="text-[8px] font-mono px-1 py-0.2 rounded uppercase"
                          style={{
                            color: def.secondaryColor,
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <span aria-hidden="true">{ROLE_ICONS[spell.castType]} </span>{spell.castType}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/70 leading-tight line-clamp-2 pl-6">
                        {spell.description}
                      </p>
                      <span className="pl-6 text-[8px] font-mono uppercase tracking-wide text-white/45">
                        Target: {spell.target}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Footer Hint */}
                <div className="text-[9px] font-mono text-center text-white/40 pt-2 mt-1 border-t border-white/5">
                  Double-tap abilities · click two heroes to play
                </div>
              </div>
            )}

            {isPendingFighter && (
              <div
                key={pendingFightStartedAt || entity.id}
                className="fight-opponent-prompt"
                role="status"
                aria-live="polite"
              >
                <strong>Choose an opponent</strong>
                <span>Tap another fighter in 1–5 seconds</span>
                <i />
              </div>
            )}

            {/* ── Speech Bubble (Attached directly above stick man) ── */}
            {isSpeaking && !isSpellMenuOpen && (
              <div
                className="character-speech-bubble absolute bottom-[115%] left-1/2 -translate-x-1/2 w-64 sm:w-72 max-w-[85vw] p-3 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto text-left z-50 animate-in fade-in zoom-in-95 duration-200"
                style={{
                  backgroundColor: 'rgba(8, 12, 24, 0.96)',
                  borderColor: `${def.primaryColor}90`,
                  boxShadow: `0 8px 32px ${def.glowColor}, 0 20px 40px rgba(0,0,0,0.85)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Speech arrow */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r border-b"
                  style={{
                    backgroundColor: 'rgba(8, 12, 24, 0.96)',
                    borderColor: `${def.primaryColor}90`,
                  }}
                />

                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5 border-b pb-1.5 border-white/10">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm">{def.symbol}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">
                      {entity.name}
                    </span>
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.2 rounded-full border"
                      style={{
                        color: def.primaryColor,
                        borderColor: `${def.primaryColor}50`,
                      }}
                    >
                      {entity.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      entity.isSpeaking = false;
                      entity.activeDialogue = undefined;
                      onDismissDialogue();
                    }}
                    className="text-white/40 hover:text-white text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Action / Mode Pill */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[8px] font-mono uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    ✨ {visitDialogueDeck.getModelUsed()}
                  </span>
                  <span
                    className="text-[9px] font-semibold truncate"
                    style={{ color: def.secondaryColor }}
                  >
                    {actionNote}
                  </span>
                </div>

                {/* Quote Text */}
                <p className="text-[11px] text-white/95 leading-relaxed font-sans mb-2">
                  &ldquo;{displayText}&rdquo;
                </p>

                {/* Special Move Callout */}
                <div className="flex items-center justify-between text-[9px] font-mono text-white/50 pt-1 border-t border-white/5">
                  <span>Double-tap for abilities</span>
                </div>
              </div>
            )}

            {/* ── Hover Name Badge ── */}
            {isHovered && !isSpeaking && !isSpellMenuOpen && (
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-lg animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'rgba(8, 12, 24, 0.9)',
                  borderColor: `${def.primaryColor}70`,
                  color: '#ffffff',
                  boxShadow: `0 0 10px ${def.glowColor}`,
                }}
              >
                <span style={{ color: def.primaryColor }} className="mr-1">
                  {def.symbol}
                </span>
                {entity.name} • Double-tap for Spells
              </div>
            )}
          </div>
        );
      })}

      {/* A shared transcript makes the exchange readable as a conversation,
          instead of two characters silently changing overhead labels. */}
      {entities.map((entity) => {
        if (!entity.dialogueSessionId || !entity.dialoguePartnerId || entity.id > entity.dialoguePartnerId) {
          return null;
        }

        const partner = entities.find((candidate) => candidate.id === entity.dialoguePartnerId);
        if (!partner || partner.dialogueSessionId !== entity.dialogueSessionId) return null;

        const firstDef = STICK_MAN_ARCHETYPES[entity.element] || STICK_MAN_ARCHETYPES.fire;
        const secondDef = STICK_MAN_ARCHETYPES[partner.element] || STICK_MAN_ARCHETYPES.fire;
        const history = entity.dialogueHistory || [];
        const activeSpeaker = [entity, partner].find((candidate) => candidate.dialoguePhase === 'speaking');
        // The thread is translated upward by its own height, so its `top`
        // value must be the pair's anchor point—not another document-sized
        // offset. The small pixel adjustment clears the character heads.
        const top = Math.max(3, Math.min(entity.docY, partner.docY));
        const left = (entity.docX + partner.docX) / 2;

        return (
          <div
            key={`dialogue-thread-${entity.dialogueSessionId}`}
            className="dialogue-thread"
            role="log"
            aria-live="polite"
            aria-label={`${entity.name} and ${partner.name} conversation`}
            style={{ left: `${left}%`, top: `calc(${top}% - 38px)` }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dialogue-thread-header">
              <span>Live conversation</span>
              <span>
                {entity.dialogueTurn || 0}/{entity.dialogueTotalTurns || 2}
              </span>
            </div>
            <div className="dialogue-thread-participants">
              <span style={{ color: firstDef.primaryColor }}>{firstDef.symbol} {entity.name}</span>
              <span aria-hidden="true">↔</span>
              <span style={{ color: secondDef.primaryColor }}>{partner.name} {secondDef.symbol}</span>
            </div>
            <div className="dialogue-thread-messages">
              {history.length === 0 ? (
                <p className="dialogue-thread-loading">Taking a moment to say hello…</p>
              ) : (
                history.map((message) => {
                  const isFirstSpeaker = message.speakerId === entity.id;
                  const speakerDef = isFirstSpeaker ? firstDef : secondDef;
                  return (
                    <div
                      key={message.id}
                      className={`dialogue-message ${isFirstSpeaker ? 'is-first' : 'is-second'}`}
                      style={{ '--message-color': speakerDef.primaryColor } as React.CSSProperties}
                    >
                      <strong>{message.speakerName}</strong>
                      <span>{message.text}</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="dialogue-thread-footer">
              <span className="dialogue-thread-live-dot" aria-hidden="true" />
              {activeSpeaker ? `${activeSpeaker.name} is speaking` : 'Listening…'}
            </div>
            <div className="dialogue-thread-tail" aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
};
