'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { PERSONAL_INFO, EXPERIENCES, PROJECTS } from '../../data/portfolioData';
import { THEMES } from '../../systems/themeEngine';
import { soundEngine } from '../../systems/soundEngine';
import { ArtifactCorners } from '../ui/ArtifactCorners';

interface AIChatTerminalProps {
  activeRealm: ElementType;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export const AIChatTerminal: React.FC<AIChatTerminalProps> = ({ activeRealm }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Greetings traveler! I am the AI Companion for ${PERSONAL_INFO.displayName}. Ask me about Lon Shan's engineering at Singtecs or Smthgood, the Smart Retail platform, or the 3D stick figures patrolling this world!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const theme = THEMES[activeRealm] || THEMES.fire;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('stick') || q.includes('element') || q.includes('3d') || q.includes('walk')) {
      return `The 3D stick men are tiny procedural characters walking across the webpage surface. Each has zero transparency with solid saturated colors and elemental head crowns! Clicking on the website ground commands your companion to march there.`;
    }

    if (q.includes('singtecs') || q.includes('experience') || q.includes('work') || q.includes('job')) {
      const exp = EXPERIENCES[0];
      return `At ${exp.company} (${exp.period}), Lon Shan worked as a ${exp.role}, designing scalable microservices with NestJS, deploying PostgreSQL databases, and engineering cross-platform apps with Next.js and Flutter!`;
    }

    if (q.includes('flutter') || q.includes('mobile') || q.includes('smthgood') || q.includes('migration')) {
      return `Lon Shan has 3+ years of deep Flutter expertise! At Smthgood, he spearheaded migrating an existing Flutter mobile app into a Next.js web platform, cutting initial page load times by 45%.`;
    }

    if (q.includes('retail') || q.includes('project') || q.includes('pos')) {
      const p = PROJECTS[0];
      return `One of Lon Shan's flagship platforms is '${p.title}', featuring offline-first POS synchronization, BLE hardware printer drivers, and sub-millisecond Go Fiber queries.`;
    }

    return `Lon Shan is an experienced full-stack & mobile engineer specializing in Next.js, Flutter, TypeScript, NestJS, and interactive 3D WebGL experiences. Feel free to connect via LinkedIn or email!`;
  };

  const handleSend = (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed) return;

    soundEngine.playClick();
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const answer = generateAnswer(trimmed);
      setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
    }, 450);
  };

  const quickPrompts = [
    'Tell me about Lon Shan',
    'Flutter & Next.js Experience',
    'Smart Retail Project',
    'How do stick men walk?',
  ];

  return (
    <section
      id="ai-terminal"
      aria-labelledby="ai-terminal-title"
      className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-[11px] sm:text-xs font-bold tracking-[0.3em] sm:tracking-[0.45em] uppercase mb-3"
            style={{ color: theme.accentColor }}
          >
            ✦ Astral Terminal
          </p>
          <h2
            id="ai-terminal-title"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: theme.textColor, textShadow: `0 0 30px ${theme.glowColor}` }}
          >
            Interactive Assistant
          </h2>
          <p
            className="text-sm font-normal tracking-wide max-w-md mx-auto mt-2"
            style={{ color: theme.subtextColor, opacity: 0.85 }}
          >
            Query Lon Shan&apos;s background, shipped platforms, and architectural philosophy.
          </p>
        </motion.div>

        {/* Terminal Card */}
        <div
          data-perch-card="true"
          data-card-title="Astral Terminal"
          className="relative portfolio-card rounded-2xl border backdrop-blur-xl overflow-hidden shadow-2xl"
          style={{
            background: theme.cardBg,
            borderColor: theme.cardBorder,
          }}
        >
          <ArtifactCorners color={theme.primaryColor} />

          {/* Terminal Window Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-white/50 ml-2">astral-terminal // lonshan.ai</span>
            </div>
            <div className="text-[11px] font-mono" style={{ color: theme.primaryColor }}>
              ONLINE
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="p-5 sm:p-6 space-y-4 max-h-[360px] overflow-y-auto no-scrollbar font-mono text-xs sm:text-sm"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 leading-relaxed ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 border ${
                    m.sender === 'user'
                      ? 'text-white'
                      : 'text-white/90'
                  }`}
                  style={{
                    backgroundColor: m.sender === 'user' ? `${theme.primaryColor}22` : 'rgba(255,255,255,0.04)',
                    borderColor: m.sender === 'user' ? `${theme.primaryColor}55` : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <p>{m.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="animate-pulse">✦ Terminal processing response...</span>
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 border-t border-white/10 bg-white/5">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="text-[11px] font-mono px-3 py-1 rounded-full border text-white/70 hover:text-white transition-all cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-white/10 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend(input);
              }}
              placeholder="Type a message or question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-colors"
              style={{
                borderColor: `${theme.primaryColor}40`,
              }}
            />
            <button
              onClick={() => handleSend(input)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: theme.primaryColor,
                boxShadow: `0 0 16px ${theme.glowColor}`,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
