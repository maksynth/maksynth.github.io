// A browser version of the MAK SYNTH voice from synthFile.scd, built on Web Audio.
// Each key starts a voice (oscillator or noise) with its own ADSR envelope. Voices
// share one resonant low-pass filter, like the engine's shared cutoff and resonance
// buses, and the mix is scaled by 0.25 / sqrt(voices) for headroom, as in the engine.
// A limiter is added at the end so very resonant settings stay comfortable to hear.

import type { WaveId } from './synthMap';

interface Voice {
  src: OscillatorNode | AudioBufferSourceNode;
  env: GainNode;
  release: number;
}

export interface EnvelopeSettings {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export class SynthEngine {
  readonly ctx: AudioContext;
  readonly analyser: AnalyserNode;
  private mix: GainNode;
  private filter: BiquadFilterNode;
  private noise: AudioBuffer;
  private voices = new Map<number, Voice>();
  private envSettings: EnvelopeSettings = { attack: 0.15, decay: 0.6, sustain: 0.9, release: 1.2 };
  wave: WaveId = 'sine';

  constructor() {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.mix = new GainNode(this.ctx, { gain: 0.25 });
    this.filter = new BiquadFilterNode(this.ctx, { type: 'lowpass', frequency: 6500, Q: 0 });
    const limiter = new DynamicsCompressorNode(this.ctx, { threshold: -10, knee: 6, ratio: 12, attack: 0.003, release: 0.15 });
    const out = new GainNode(this.ctx, { gain: 0.8 });
    this.analyser = new AnalyserNode(this.ctx, { fftSize: 2048, smoothingTimeConstant: 0.75 });
    this.mix.connect(this.filter).connect(limiter).connect(out);
    out.connect(this.analyser);
    out.connect(this.ctx.destination);

    // One second of white noise, looped for the Noise waveform.
    this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  async resume() {
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  get activeVoices() {
    return this.voices.size;
  }

  setEnvelope(e: EnvelopeSettings) {
    this.envSettings = e;
  }

  /** Cutoff in Hz; resonance as the filter's Q (1 / rq), with rq clipped at 0.85 like the engine. */
  setFilter(cutoffHz: number, q: number) {
    const now = this.ctx.currentTime;
    const hz = Math.min(15000, Math.max(40, cutoffHz));
    this.filter.frequency.setTargetAtTime(hz, now, 0.05);
    // Web Audio's low-pass Q is in decibels. Capped at 26 dB (a Q of 20) for comfort.
    const db = Math.min(26, Math.max(0, 20 * Math.log10(Math.max(q, 1 / 0.85))));
    this.filter.Q.setTargetAtTime(db, now, 0.05);
  }

  private rebalance() {
    const n = Math.max(1, this.voices.size);
    this.mix.gain.setTargetAtTime(0.25 / Math.sqrt(n), this.ctx.currentTime, 0.02);
  }

  noteOn(id: number, freq: number) {
    this.noteOff(id, true);
    const { attack, decay, sustain, release } = this.envSettings;
    const t = this.ctx.currentTime;
    let src: OscillatorNode | AudioBufferSourceNode;
    let level = 1;
    if (this.wave === 'noise') {
      src = new AudioBufferSourceNode(this.ctx, { buffer: this.noise, loop: true });
      level = 0.35;
    } else {
      const type: OscillatorType = this.wave === 'saw' ? 'sawtooth' : this.wave === 'pulse' ? 'square' : this.wave === 'triangle' ? 'triangle' : 'sine';
      src = new OscillatorNode(this.ctx, { type, frequency: freq });
      if (this.wave === 'saw' || this.wave === 'pulse') level = 0.6;
    }
    const env = new GainNode(this.ctx, { gain: 0 });
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(level, t + attack);
    env.gain.setTargetAtTime(level * sustain, t + attack, Math.max(0.003, decay / 4));
    src.connect(env).connect(this.mix);
    src.start(t);
    this.voices.set(id, { src, env, release });
    this.rebalance();
  }

  noteOff(id: number, immediate = false) {
    const v = this.voices.get(id);
    if (!v) return;
    this.voices.delete(id);
    const t = this.ctx.currentTime;
    const rel = immediate ? 0.01 : Math.max(0.01, this.envSettings.release);
    v.env.gain.cancelScheduledValues(t);
    v.env.gain.setValueAtTime(v.env.gain.value, t);
    v.env.gain.setTargetAtTime(0, t, rel / 4);
    v.src.stop(t + rel * 1.6 + 0.05);
    v.src.onended = () => v.env.disconnect();
    this.rebalance();
  }

  allOff() {
    for (const id of Array.from(this.voices.keys())) this.noteOff(id);
  }

  close() {
    this.allOff();
    void this.ctx.close();
  }
}
