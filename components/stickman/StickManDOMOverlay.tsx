'use client';

import React, { useEffect, useState } from 'react';
import { ElementType } from '../../types';
import { StickManEntity } from '../../systems/stickManPopulation';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { ELEMENTAL_SPELLS, ElementalSpell } from '../../data/elementalSpells';
import { SpellIcon } from '../ui/SpellIcon';
import { soundEngine } from '../../systems/soundEngine';

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
  onSelectElement: (element: ElementType) => void;
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
  onSelectElement,
  onDismissDialogue,
  onCastSpell,
  onStopStickMan,
  rallyMarkers,
  pendingFightId = null,
  pendingFightStartedAt = null,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hasActiveConversation = entities.some((entity) => Boolean(entity.dialogueSessionId));

  // Auto-dismiss dialogue after 6.5s
  useEffect(() => {
    if (!activeDialogueId) return;
    const timer = setTimeout(() => {
      onDismissDialogue();
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeDialogueId, onDismissDialogue]);

  const handleAnchorClick = (e: React.MouseEvent, entity: StickManEntity) => {
    e.stopPropagation();
    // Read the monotonic clock only when an interaction occurs.
    // eslint-disable-next-line react-hooks/purity
    const selectedAt = performance.now();
    onStopStickMan(entity.id);
    onSelectElement(entity.element);
    soundEngine.playSpiritClick(entity.element);
    onDismissDialogue();
    onSelectStickMan(entity.element, entity.id, selectedAt);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ overflowX: 'clip', overflowY: 'visible', zIndex: pendingFightId ? 70 : 30 }}
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
            !hasActiveConversation &&
            !pendingFightId
        );
        const isSpellMenuOpen = pendingFightId === entity.id;
        const displayText = entity.activeDialogue || entity.dialogueQuote;
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

          >
            {/* Element-specific ability menu */}
            {isSpellMenuOpen && (
              <div
                className="character-spell-menu absolute bottom-[115%] left-1/2 -translate-x-1/2 w-72 max-w-[92vw] p-3 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto text-left z-50 animate-in fade-in zoom-in-95 duration-200"
                style={{
                  '--spell-menu-shift': `clamp(calc(min(144px, 46vw) + 12px - ${entity.docX}vw), 0px, calc(100vw - min(144px, 46vw) - 12px - ${entity.docX}vw))`,
                  marginLeft: 'var(--spell-menu-shift)',
                  backgroundColor: 'rgba(10, 15, 30, 0.96)',
                  borderColor: `${def.primaryColor}95`,
                  boxShadow: `0 8px 36px ${def.glowColor}, 0 20px 45px rgba(0,0,0,0.85)`,
                } as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Speech arrow pointing to stick man */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r border-b"
                  style={{
                    left: 'calc(50% - var(--spell-menu-shift))',
                    backgroundColor: 'rgba(10, 15, 30, 0.96)',
                    borderColor: `${def.primaryColor}95`,
                  }}
                />

                {/* Box Header */}
                <div className="flex items-center justify-between gap-2 mb-2 border-b pb-1.5 border-white/15">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{def.symbol}</span>
                    <span className="text-[14px] font-black uppercase tracking-wider text-white">
                      {entity.name} Spells
                    </span>
                  </div>
                </div>

                {/* Element-specific abilities */}
                <div className="space-y-1.5">
                  {spells.map((spell) => (
                    <button
                      key={spell.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCastSpell(entity, spell);
                      }}
                      className="w-full min-h-14 text-left p-2 rounded-xl border transition-all duration-150 group flex items-center hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      aria-label={`Cast ${spell.name}`}
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
                          <span className="ability-portrait" style={{ color: spell.secondaryColor }}>
                            <SpellIcon spell={spell} size={27} />
                          </span>
                          <span className="text-[13px] font-bold text-white group-hover:text-white">
                            {spell.name}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div
                  key={pendingFightStartedAt || entity.id}
                  className="fight-opponent-prompt"
                  role="status"
                  aria-live="polite"
                >
                  <strong>Choose an opponent within 5 seconds</strong>
                  <i aria-hidden="true" />
                </div>
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
                    <span className="text-[16px]">{def.symbol}</span>
                    <span className="text-[13px] font-black uppercase tracking-wider text-white">
                      {entity.name}
                    </span>
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-[13px] text-white/95 leading-relaxed font-sans mb-2">
                  &ldquo;{displayText}&rdquo;
                </p>

              </div>
            )}

            {/* ── Hover Name Badge ── */}
            {isHovered && !isSpeaking && !pendingFightId && (
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-lg animate-in fade-in duration-150"
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
                {entity.name}
              </div>
            )}
          </div>
        );
      })}

      {/* A shared transcript makes the exchange readable as a conversation,
          instead of two characters silently changing overhead labels. */}
      {entities.map((entity) => {
        if (pendingFightId || !entity.dialogueSessionId || !entity.dialoguePartnerId || entity.id > entity.dialoguePartnerId) {
          return null;
        }

        const partner = entities.find((candidate) => candidate.id === entity.dialoguePartnerId);
        if (!partner || partner.dialogueSessionId !== entity.dialogueSessionId) return null;

        const firstDef = STICK_MAN_ARCHETYPES[entity.element] || STICK_MAN_ARCHETYPES.fire;
        const secondDef = STICK_MAN_ARCHETYPES[partner.element] || STICK_MAN_ARCHETYPES.fire;
        const history = entity.dialogueHistory || [];
        if (history.length === 0) return null;
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
            <div className="dialogue-thread-messages">
              {history.map((message) => {
                  const isFirstSpeaker = message.speakerId === entity.id;
                  const speakerDef = isFirstSpeaker ? firstDef : secondDef;
                  return (
                    <div
                      key={message.id}
                      className={`dialogue-message ${isFirstSpeaker ? 'is-first' : 'is-second'}`}
                      style={{ '--message-color': speakerDef.primaryColor } as React.CSSProperties}
                    >
                      <strong>{speakerDef.symbol} {message.speakerName}</strong>
                      <span>{message.text}</span>
                    </div>
                  );
                })}
            </div>
            <div className="dialogue-thread-tail" aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
};
