/**
 * Dincharya Focus OS - Ultra-Lightweight Web Audio Synthesizer
 * 
 * Generates an elegant 2-tone melodic focus chime using purely the native Web Audio API.
 * - Zero external MP3/audio files to load
 * - Immediate teardown and AudioContext close to ensure 0% idle CPU & RAM overhead
 * - Clean exponential gain envelopes to eliminate audio clicks
 */

class AudioAlertEngine {
  private isMuted: boolean = false;

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dincharya_sound_enabled', (!muted).toString());
    }
  }

  public getMuted(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dincharya_sound_enabled');
      if (stored !== null) {
        this.isMuted = stored === 'false';
      }
    }
    return this.isMuted;
  }

  /**
   * Plays an assertive, uplifting 2-tone melodic chime (C5 -> G5)
   * Designed for Task Start Time notifications.
   */
  public async playTaskStartChime(): Promise<void> {
    if (this.getMuted()) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      // Master gain node for smooth global fade
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, now);
      masterGain.connect(ctx.destination);

      // Tone 1: C5 (523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(masterGain);

      // Tone 2: G5 (783.99 Hz) - Resonates slightly after tone 1 for an alert harmonic bell sound
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.16);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.001, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.20);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc2.connect(gain2);
      gain2.connect(masterGain);

      // Start oscillators
      osc1.start(now);
      osc1.stop(now + 0.5);

      osc2.start(now + 0.16);
      osc2.stop(now + 0.8);

      // CRITICAL FOR ZERO RESOURCE LEAKS: Cleanly close AudioContext once sounds finish
      setTimeout(async () => {
        try {
          if (ctx && ctx.state !== 'closed') {
            await ctx.close();
          }
        } catch {
          // Ignore context closure errors
        }
      }, 950);

    } catch (err) {
      console.warn('[AudioAlertEngine] Web Audio playback failed or blocked by policy:', err);
    }
  }

  /**
   * Plays a subtle, gentle single-tone chime (E5 659.25 Hz)
   * Designed for the 5-minute pre-transition warning.
   */
  public async playPreTransitionChime(): Promise<void> {
    if (this.getMuted()) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.6);

      setTimeout(async () => {
        try {
          if (ctx && ctx.state !== 'closed') {
            await ctx.close();
          }
        } catch {
          // Ignore
        }
      }, 700);

    } catch (err) {
      console.warn('[AudioAlertEngine] Gentle chime blocked:', err);
    }
  }

  /**
   * Celebratory completion sound when user finishes a focus session
   */
  public async playCompletionChime(): Promise<void> {
    if (this.getMuted()) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const startTime = now + idx * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });

      setTimeout(async () => {
        try {
          if (ctx && ctx.state !== 'closed') {
            await ctx.close();
          }
        } catch {
          // Ignore
        }
      }, 900);
    } catch {
      // Ignore
    }
  }
}

export const audioAlert = new AudioAlertEngine();
