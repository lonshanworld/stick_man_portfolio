'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { ElementType } from '../../types';
import { EXPERIENCES, PROJECTS } from '../../data/portfolioData';
import { soundEngine } from '../../systems/soundEngine';

interface AIChatTerminalProps {
  activeRealm: ElementType;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export const AIChatTerminal: React.FC<AIChatTerminalProps> = ({
  activeRealm,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Welcome to the archive. I'm Lon Shan's portfolio guide. Ask about my experience, the products I've built, or the elemental magic on this page.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase();

    if (
      q.includes('magic') ||
      q.includes('stick') ||
      q.includes('element') ||
      q.includes('3d') ||
      q.includes('walk')
    ) {
      return `The magic is built from code: original SVG seals, elemental color palettes, procedural Three.js spell effects, and synthesized sound with the Web Audio API. Click any roaming stickman to change the entire site's colors and magic seal to its element. All fourteen elements have their own seal. Double-click a companion to explore its spells.`;
    }

    if (
      q.includes('singtecs') ||
      q.includes('experience') ||
      q.includes('work') ||
      q.includes('job')
    ) {
      const exp = EXPERIENCES[0];
      return `At ${exp.company} (${exp.period}), Lon Shan worked as a ${exp.role}, designing scalable microservices with NestJS, deploying PostgreSQL databases, and engineering cross-platform apps with Next.js and Flutter!`;
    }

    if (
      q.includes('flutter') ||
      q.includes('mobile') ||
      q.includes('smthgood') ||
      q.includes('migration')
    ) {
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
    if (!trimmed || isTyping) return;

    soundEngine.playClick();
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);

    replyTimer.current = setTimeout(() => {
      setIsTyping(false);
      const answer = generateAnswer(trimmed);
      setMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
    }, 450);
  };

  const quickPrompts = [
    'Tell me about Lon Shan',
    'Flutter & Next.js Experience',
    'Smart Retail Project',
    'How does the magic work?',
  ];

  return (
    <section
      id="ai-terminal"
      className="folio-section folio-container"
      aria-label="Portfolio guide"
      data-realm={activeRealm}
    >
      <SectionHeading
        number="04"
        label="A conversation"
        title="Curiosity welcome."
      >
        A quick guide to my work, experience, and the world on this page.
      </SectionHeading>
      <div className="folio-guide-grid">
        <div className="folio-guide-intro">
          <span className="folio-guide-symbol" aria-hidden="true">
            ?
          </span>
          <h3>Follow your curiosity.</h3>
          <p>
            Pick a question or ask your own. This guide answers from the
            portfolio, right here in your browser.
          </p>
          <div className="folio-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={isTyping}
              >
                {prompt}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </div>
        <div
          className="folio-chat"
          data-perch-card="true"
          data-card-title="Portfolio guide"
        >
          <div className="folio-chat-header">
            <span>Portfolio guide</span>
            <span>Local / No sign-in</span>
          </div>
          <div
            ref={scrollRef}
            className="folio-chat-messages"
            role="log"
            aria-label="Portfolio guide conversation"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div key={index} className={`folio-message ${message.sender}`}>
                <span>{message.sender === 'ai' ? 'Guide' : 'You'}</span>
                <p>{message.text}</p>
              </div>
            ))}
            {isTyping && (
              <p className="folio-typing" role="status">
                Thinking...
              </p>
            )}
          </div>
          <form
            className="folio-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isTyping) handleSend(input);
            }}
          >
            <label htmlFor="portfolio-question" className="sr-only">
              Ask a question about Lon Shan
            </label>
            <input
              id="portfolio-question"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="What would you like to know?"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
