'use client';

import React from 'react';
import { ElementType } from '../../types';
import { STICK_MAN_ARCHETYPES, FEATURED_ELEMENTS } from '../../data/stickManArchetypes';
import { soundEngine } from '../../systems/soundEngine';
import { ElementSigil } from '../ui/SpellIcon';

interface ElementalDockProps {
  activeRealm: ElementType;
  onSelectRealm: (element: ElementType) => void;
}

export const ElementalDock: React.FC<ElementalDockProps> = ({
  activeRealm,
  onSelectRealm,
}) => {
  const handleSelect = (el: ElementType) => {
    soundEngine.playElementalWhoosh(el);
    onSelectRealm(el);
  };

  const activeDef = STICK_MAN_ARCHETYPES[activeRealm] || STICK_MAN_ARCHETYPES.fire;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw]">
      <div
        className="flex items-center gap-1.5 md:gap-2 px-3 py-2 rounded-2xl backdrop-blur-2xl border shadow-2xl overflow-x-auto no-scrollbar transition-all duration-300"
        style={{
          backgroundColor: 'rgba(8, 12, 22, 0.9)',
          borderColor: `${activeDef.primaryColor}50`,
          boxShadow: `0 10px 35px ${activeDef.glowColor}`,
        }}
      >
        <span className="hidden lg:inline-block text-[12px] font-mono uppercase tracking-widest text-white/50 pl-1 pr-2 border-r border-white/10">
          Squad
        </span>

        {FEATURED_ELEMENTS.map((el) => {
          const item = STICK_MAN_ARCHETYPES[el];
          const isActive = el === activeRealm;

          return (
            <button
              key={el}
              onClick={() => handleSelect(el)}
              className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'scale-110 shadow-lg'
                  : 'hover:scale-105 hover:bg-white/5 opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isActive ? `${item.primaryColor}25` : 'transparent',
                border: isActive ? `1.5px solid ${item.primaryColor}` : '1px solid transparent',
              }}
              title={`${item.name} (${item.title})`}
              aria-label={`Select ${item.name}`}
              aria-pressed={isActive}
            >
              <span style={{ color: item.secondaryColor }}><ElementSigil element={el} size={25} /></span>
              <span className="text-[11px] font-bold font-mono tracking-tighter uppercase text-white/90 mt-0.5">
                {item.id}
              </span>

              {/* Active Pip */}
              {isActive && (
                <div
                  className="absolute -bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: item.primaryColor, boxShadow: `0 0 6px ${item.primaryColor}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
