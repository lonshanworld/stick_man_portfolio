import { ElementType } from '../types';
import type { ElementalSpell } from '../data/elementalSpells';
import { SPELL_SOUNDS } from '../data/spellSounds';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;

  private initCtx() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public playFootstep() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context might be restricted
    }
  }

  public playStickManJump() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(620, this.ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {}
  }

  public playElementalWhoosh(element: ElementType) {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const freqs: Record<ElementType, number[]> = {
        fire: [440, 554, 659, 880],
        water: [392, 523, 659, 784],
        lightning: [587, 880, 1174, 1760],
        ice: [659, 830, 987, 1318],
        wind: [349, 440, 523, 698],
        soil: [220, 277, 330, 440],
        trees: [294, 370, 440, 587],
        dark: [196, 246, 293, 392],
        light: [523, 659, 784, 1046],
        space: [440, 659, 880, 1318],
        time: [392, 493, 587, 784],
        robot: [523, 659, 830, 1046],
        healing: [349, 440, 587, 698],
        void: [147, 185, 220, 294],
      };

      const notes = freqs[element] || freqs.fire;
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = element === 'lightning' || element === 'robot' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.04);

        gain.gain.setValueAtTime(0.06, this.ctx!.currentTime + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.04 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.04);
        osc.stop(this.ctx!.currentTime + idx * 0.04 + 0.3);
      });
    } catch {}
  }

  public playSpiritClick(element: ElementType) {
    this.playElementalWhoosh(element);
  }

  public playSuperMove(element: ElementType) {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Powerful harmonic chord + resonant shimmer
      const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
      const register = element === 'dark' || element === 'void' ? 0.75 : 1;
      chord.forEach((note, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note * 1.5 * register, this.ctx!.currentTime);
        osc.frequency.exponentialRampToValueAtTime(note * 2.2 * register, this.ctx!.currentTime + 0.4);

        gain.gain.setValueAtTime(0.1, this.ctx!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.55 + i * 0.05);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start();
        osc.stop(this.ctx!.currentTime + 0.6);
      });
    } catch {}
  }

  public playSpell(spell: ElementalSpell) {
    if (!this.isEnabled) return;
    this.initCtx();
    const context = this.ctx;
    if (!context) return;
    for (const [from, to, delay, length, waveform] of SPELL_SOUNDS[spell.id] || []) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      const start = context.currentTime + delay;
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(from, start);
      oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(waveform === 'sine' ? 0.035 : 0.014, start + Math.min(0.02, length / 4));
      gain.gain.exponentialRampToValueAtTime(0.001, start + length);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start); oscillator.stop(start + length + 0.02);
    }
    this.playElementTexture(spell);
  }

  private playElementTexture(spell: ElementalSpell) {
    const context = this.ctx;
    if (!context) return;
    const texture = {
      fire: ['lowpass', 520, 0.012], water: ['lowpass', 1100, 0.014],
      lightning: ['highpass', 2300, 0.006], ice: ['highpass', 1750, 0.007],
      wind: ['bandpass', 760, 0.016], soil: ['lowpass', 180, 0.018],
      trees: ['bandpass', 430, 0.009], dark: ['lowpass', 260, 0.011],
      light: ['highpass', 2100, 0.004], space: ['bandpass', 320, 0.01],
      time: ['bandpass', 980, 0.004], robot: ['highpass', 2600, 0.004],
      healing: ['bandpass', 1250, 0.004], void: ['lowpass', 105, 0.014],
    }[spell.element] as [BiquadFilterType, number, number];
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== context.sampleRate) {
      this.noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const start = context.currentTime;
    const length = Math.min(1.1, Math.max(0.35, spell.duration * 0.42));
    source.buffer = this.noiseBuffer;
    source.loop = length > 0.98;
    filter.type = texture[0];
    filter.frequency.setValueAtTime(texture[1], start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(45, texture[1] * (spell.element === 'void' ? 0.45 : 1.45)), start + length);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(texture[2], start + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.001, start + length);
    source.connect(filter); filter.connect(gain); gain.connect(context.destination);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    source.start(start); source.stop(start + length);
  }

  public playClick() {
    if (!this.isEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
