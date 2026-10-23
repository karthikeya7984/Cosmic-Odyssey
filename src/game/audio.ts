import type { Settings } from './model';
export class Sound {
  private context?: AudioContext;
  unlock() { try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') void this.context.resume().catch(() => {}); } catch { /* Audio is optional. */ } }
  play(event: string, settings: Settings) {
    if (!settings.sfx || settings.volume <= 0 || !this.context || this.context.state !== 'running') return;
    const ctx = this.context, oscillator = ctx.createOscillator(), gain = ctx.createGain();
    const freq = event === 'shoot' ? 700 : event === 'pickup' ? 920 : event === 'win' ? 1100 : event === 'hit' ? 110 : 65;
    const duration = event === 'shoot' ? .055 : .19;
    oscillator.type = event === 'explode' || event === 'hit' ? 'sawtooth' : 'triangle'; oscillator.frequency.setValueAtTime(freq, ctx.currentTime); oscillator.frequency.exponentialRampToValueAtTime(freq * .35, ctx.currentTime + duration);
    gain.gain.setValueAtTime(settings.volume * .12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + duration);
    oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(); oscillator.stop(ctx.currentTime + duration); oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  dispose() { if (this.context) void this.context.close().catch(() => {}); }
}
