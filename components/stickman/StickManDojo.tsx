'use client';

import React, { useState } from 'react';
import { ElementType } from '../../types';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { soundEngine } from '../../systems/soundEngine';
import { Swords, Zap, Activity, Award, ShieldAlert, Sparkles } from 'lucide-react';

interface StickManDojoProps {
  activeRealm: ElementType;
  onCastSpell: (element: ElementType) => void;
}

export const StickManDojo: React.FC<StickManDojoProps> = ({
  activeRealm,
  onCastSpell,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const def = STICK_MAN_ARCHETYPES[activeRealm] || STICK_MAN_ARCHETYPES.fire;

  const handleAction = (type: 'super' | 'spar' | 'burst') => {
    soundEngine.playSuperMove(activeRealm);
    onCastSpell(activeRealm);

    if (typeof window !== 'undefined') {
      const globalFunc = (window as unknown as { triggerStickManSuperMove?: () => void }).triggerStickManSuperMove;
      if (globalFunc) globalFunc();
    }
  };

  return (
    <div className="fixed top-24 right-4 md:right-8 z-30 pointer-events-auto">
      {/* Toggle Button */}
      <button
        onClick={() => {
          soundEngine.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl backdrop-blur-xl border shadow-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          backgroundColor: 'rgba(12, 16, 30, 0.88)',
          borderColor: def.primaryColor,
          boxShadow: `0 4px 20px ${def.glowColor}`,
        }}
      >
        <Swords size={16} style={{ color: def.primaryColor }} />
        <span>Stick Man Dojo</span>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-mono"
          style={{ backgroundColor: `${def.primaryColor}30`, color: def.secondaryColor }}
        >
          LVL 99
        </span>
      </button>

      {/* Dojo Drawer Modal */}
      {isOpen && (
        <div
          className="mt-3 w-[320px] rounded-2xl p-4 backdrop-blur-2xl border shadow-2xl text-white animate-in slide-in-from-top-4 duration-200"
          style={{
            backgroundColor: 'rgba(10, 14, 28, 0.95)',
            borderColor: def.primaryColor,
            boxShadow: `0 12px 40px ${def.glowColor}`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{def.symbol}</span>
              <div>
                <h4 className="text-sm font-bold">{def.name}</h4>
                <p className="text-[10px] text-white/60">{def.weaponOrFocus}</p>
              </div>
            </div>
            <span
              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
              style={{ backgroundColor: `${def.primaryColor}25`, color: def.secondaryColor }}
            >
              {def.id}
            </span>
          </div>

          {/* Stick Man Combat Attributes */}
          <div className="space-y-2 mb-4 text-[11px]">
            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Speed / FPS</span>
                <span className="font-mono font-bold text-white">{def.stats.speed}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${def.stats.speed}%`, backgroundColor: def.primaryColor }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Power Output</span>
                <span className="font-mono font-bold text-white">{def.stats.power}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${def.stats.power}%`, backgroundColor: def.secondaryColor }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Agility / Parkour</span>
                <span className="font-mono font-bold text-white">{def.stats.agility}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${def.stats.agility}%`, backgroundColor: '#52b788' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white/70 mb-1">
                <span>Elemental Mastery</span>
                <span className="font-mono font-bold text-white">{def.stats.elementalMastery}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${def.stats.elementalMastery}%`, backgroundColor: '#9d4edd' }}
                />
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
            <button
              onClick={() => handleAction('super')}
              className="py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow"
              style={{
                backgroundColor: `${def.primaryColor}30`,
                border: `1px solid ${def.primaryColor}`,
                color: '#fff',
              }}
            >
              <Zap size={12} />
              <span>Backflip Leap</span>
            </button>

            <button
              onClick={() => handleAction('burst')}
              className="py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow"
              style={{
                background: `linear-gradient(135deg, ${def.primaryColor}, ${def.secondaryColor})`,
                color: '#fff',
              }}
            >
              <Sparkles size={12} />
              <span>Power Surge</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
