'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ElementType } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { THEMES } from '../../systems/themeEngine';
import { soundEngine } from '../../systems/soundEngine';
import { Mail, MapPin, Copy, Check, Send } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../ui/Icons';
import { ArtifactCorners } from '../ui/ArtifactCorners';

interface ContactSectionProps {
  activeRealm: ElementType;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ activeRealm }) => {
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const theme = THEMES[activeRealm] || THEMES.fire;

  const handleCopyEmail = () => {
    soundEngine.playClick();
    navigator.clipboard.writeText(PERSONAL_INFO.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    soundEngine.playSuperMove(activeRealm);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 4500);
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p
            className="text-[11px] sm:text-xs font-bold tracking-[0.3em] sm:tracking-[0.45em] uppercase mb-3"
            style={{ color: theme.accentColor }}
          >
            ✦ Void Portal
          </p>
          <h2
            id="contact-title"
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
            style={{ color: theme.textColor, textShadow: `0 0 30px ${theme.glowColor}` }}
          >
            Initiate Contact
          </h2>
          <p
            className="text-sm font-normal tracking-wide max-w-md mx-auto mt-2"
            style={{ color: theme.subtextColor, opacity: 0.85 }}
          >
            Open for software engineering roles, mobile architecture, and full-stack projects.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Info Panel */}
          <div className="space-y-4">
            {/* Email Card */}
            <div
              className="relative rounded-2xl p-6 border backdrop-blur-xl transition-all"
              style={{
                background: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <ArtifactCorners color={theme.primaryColor} />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{
                      background: `${theme.primaryColor}18`,
                      borderColor: `${theme.primaryColor}40`,
                      color: theme.primaryColor,
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-white/50 uppercase">Direct Email</div>
                    <div className="text-sm font-bold text-white mt-0.5">{PERSONAL_INFO.email}</div>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all hover:bg-white/10 cursor-pointer"
                  style={{
                    borderColor: `${theme.primaryColor}40`,
                    color: theme.primaryColor,
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Location Card */}
            <div
              className="relative rounded-2xl p-6 border backdrop-blur-xl"
              style={{
                background: theme.cardBg,
                borderColor: theme.cardBorder,
              }}
            >
              <ArtifactCorners color={theme.primaryColor} />
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center border"
                  style={{
                    background: `${theme.primaryColor}18`,
                    borderColor: `${theme.primaryColor}40`,
                    color: theme.primaryColor,
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-white/50 uppercase">Base Location</div>
                  <div className="text-sm font-bold text-white mt-0.5">{PERSONAL_INFO.location}</div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              <a
                href={PERSONAL_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playClick()}
                className="flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <GithubIcon className="w-4 h-4" />
                <span>GitHub</span>
              </a>

              <a
                href={PERSONAL_INFO.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundEngine.playClick()}
                className="flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderColor: 'rgba(255, 255, 255, 0.12)',
                }}
              >
                <LinkedinIcon className="w-4 h-4" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Right Form Card */}
          <div
            className="relative rounded-2xl p-6 sm:p-7 border backdrop-blur-xl"
            style={{
              background: theme.cardBg,
              borderColor: theme.cardBorder,
            }}
          >
            <ArtifactCorners color={theme.primaryColor} />

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl font-bold"
                  style={{
                    background: `${theme.primaryColor}22`,
                    border: `1px solid ${theme.primaryColor}`,
                    color: theme.primaryColor,
                  }}
                >
                  ✦
                </div>
                <h3 className="text-xl font-black text-white">Transmission Dispatched!</h3>
                <p className="text-xs text-white/70 max-w-xs mx-auto">
                  Thank you! Your message has traveled through the realm. Lon Shan will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    style={{ borderColor: `${theme.primaryColor}35` }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                    style={{ borderColor: `${theme.primaryColor}35` }}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-white/60 mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell me about your project, idea, or role..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-colors resize-none"
                    style={{ borderColor: `${theme.primaryColor}35` }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-black transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                    boxShadow: `0 0 20px ${theme.glowColor}`,
                  }}
                >
                  <Send size={14} />
                  <span>Transmit Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
