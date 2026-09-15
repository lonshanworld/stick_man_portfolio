'use client';

import React, { useEffect } from 'react';
import { ElementType } from '../../types';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';

interface ElementalOverlayProps {
  spellElement: ElementType | null;
  onComplete: () => void;
}

export const ElementalOverlay: React.FC<ElementalOverlayProps> = ({
  spellElement,
  onComplete,
}) => {
  useEffect(() => {
    if (spellElement) {
      const timer = setTimeout(() => {
        onComplete();
      }, 950);
      return () => clearTimeout(timer);
    }
  }, [spellElement, onComplete]);

  if (!spellElement) return null;

  const def = STICK_MAN_ARCHETYPES[spellElement] || STICK_MAN_ARCHETYPES.fire;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden">
      {/* Central expanding rune burst */}
      <div
        className="w-[450px] h-[450px] rounded-full border-2 border-dashed animate-ping opacity-60 pointer-events-none"
        style={{
          borderColor: def.primaryColor,
          boxShadow: `0 0 100px ${def.glowColor}`,
        }}
      />
      {/* Screen tint flash */}
      <div
        className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
        style={{
          backgroundColor: def.primaryColor,
          opacity: 0.1,
        }}
      />
    </div>
  );
};
