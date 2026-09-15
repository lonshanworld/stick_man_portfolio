'use client';

import React from 'react';
import { ElementType } from '../../types';
import { STICK_MAN_ARCHETYPES } from '../../data/stickManArchetypes';
import { Volume2, VolumeX, Sparkles, Zap, Shield, Flame } from 'lucide-react';

interface StickManHUDProps {
  activeRealm: ElementType;
  whisperText: string;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onTriggerSpecialMove: () => void;
}

export const StickManHUD: React.FC<StickManHUDProps> = ({
  activeRealm,
  whisperText,
  isSoundEnabled,
  onToggleSound,
  onTriggerSpecialMove,
}) => {
  const def = STICK_MAN_ARCHETYPES[activeRealm] || STICK_MAN_ARCHETYPES.fire;

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-30 max-w-[340px] pointer-events-auto">
      <div
        className="rounded-2xl p-4 backdrop-blur-xl border shadow-2xl transition-all duration-300 text-white"
        style={{
          backgroundColor: 'rgba(10, 14, 26, 0.88)',
          borderColor: def.primaryColor,
          boxShadow: `0 8px 30px ${def.glowColor}`,
        }}
      >
        {/* Companion Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base font-bold shadow-md"
              style={{
                backgroundColor: def.primaryColor,
                boxShadow: `0 0 12px ${def.glowColor}`,
              }}
            >
              {def.symbol}
            </div>
            <div>
              <div className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                <span>{def.name}</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase"
                  style={{ backgroundColor: `${def.primaryColor}30`, color: def.secondaryColor }}
                >
                  {def.id}
                </span>
              </div>
              <div className="text-[10px] text-white/60">{def.title}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 transition-colors"
              title={isSoundEnabled ? 'Mute Sound' : 'Enable Sound'}
              aria-label="Toggle sound"
            >
              {isSoundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-red-400" />}
            </button>
          </div>
        </div>

        {/* Head & Body Power Breakdown */}
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2.5 bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-1 text-white/80">
            <Flame size={12} style={{ color: def.primaryColor }} />
            <span className="truncate">{def.headPower}</span>
          </div>
          <div className="flex items-center gap-1 text-white/80">
            <Shield size={12} style={{ color: def.secondaryColor }} />
            <span className="truncate">{def.bodyPower}</span>
          </div>
        </div>

        {/* Current Whisper Quote */}
        <p className="text-[11px] leading-relaxed text-white/90 italic mb-3">
          &quot;{whisperText || def.dialogueQuote}&quot;
        </p>

        {/* Special Move Button */}
        <button
          onClick={onTriggerSpecialMove}
          className="w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${def.primaryColor}, ${def.secondaryColor})`,
            boxShadow: `0 4px 18px ${def.glowColor}`,
          }}
        >
          <Zap size={14} className="animate-bounce" />
          <span>Unleash {def.specialMove}</span>
        </button>
      </div>
    </div>
  );
};
