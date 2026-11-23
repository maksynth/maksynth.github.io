// The six MAK SYNTH controls and how the sound engine maps them. Raw knob values are
// 0 to 1023 (the Arduino's analog range); the ranges and defaults below match synthFile.scd.

export type ControlId = 0 | 1 | 2 | 3 | 4 | 5;

const linexp = (v: number, lo: number, hi: number) => lo * Math.pow(hi / lo, v / 1023);
const linlin = (v: number, lo: number, hi: number) => lo + (hi - lo) * (v / 1023);
const explin = (x: number, lo: number, hi: number) => Math.round((1023 * Math.log(x / lo)) / Math.log(hi / lo));

const seconds = (s: number) => (s < 1 ? `${Math.round(s * 1000)} ms` : `${s.toFixed(2)} s`);
const hertz = (hz: number) => (hz < 1000 ? `${Math.round(hz)} Hz` : `${(hz / 1000).toFixed(hz < 10000 ? 2 : 1)} kHz`);

export interface ControlDef {
  id: ControlId;
  name: string;
  concept: string;
  group: 'envelope' | 'filter';
  description: string;
  /** Engine value for a raw knob reading. */
  map: (raw: number) => number;
  format: (value: number) => string;
  range: string;
  defaultRaw: number;
}

export const CONTROLS: ControlDef[] = [
  {
    id: 0, name: 'Attack', concept: 'Envelope', group: 'envelope',
    description: 'How quickly a note reaches full volume after you press a key.',
    map: (r) => linexp(r, 0.01, 1.5), format: seconds, range: '10 ms to 1.5 s',
    defaultRaw: explin(0.15, 0.01, 1.5),
  },
  {
    id: 1, name: 'Decay', concept: 'Envelope', group: 'envelope',
    description: 'How quickly it falls from full volume to the sustain level.',
    map: (r) => linexp(r, 0.01, 2.5), format: seconds, range: '10 ms to 2.5 s',
    defaultRaw: explin(0.6, 0.01, 2.5),
  },
  {
    id: 2, name: 'Sustain', concept: 'Envelope', group: 'envelope',
    description: 'The volume held while the key stays down.',
    map: (r) => linlin(r, 0, 1), format: (v) => `${Math.round(v * 100)}%`, range: '0 to 100%',
    defaultRaw: Math.round(0.9 * 1023),
  },
  {
    id: 3, name: 'Release', concept: 'Envelope', group: 'envelope',
    description: 'How long the note takes to fade after you let go.',
    map: (r) => linexp(r, 0.01, 4), format: seconds, range: '10 ms to 4 s',
    defaultRaw: explin(1.2, 0.01, 4),
  },
  {
    id: 4, name: 'Cutoff', concept: 'Low-pass filter', group: 'filter',
    description: 'The frequency above which the filter removes sound.',
    map: (r) => linexp(r, 120, 12000), format: hertz, range: '120 Hz to 12 kHz',
    defaultRaw: explin(6500, 120, 12000),
  },
  {
    id: 5, name: 'Resonance', concept: 'Filter resonance', group: 'filter',
    description: 'How much the frequencies near the cutoff are emphasized.',
    // The engine maps the knob to the filter's rq, from 0.99 down to 0.01 (lower is
    // more resonant), and shows it as a percentage. The value here is the filter's Q
    // (1 / rq); the engine and the graphs clip rq at 0.85, as RLPF does in the patch.
    map: (r) => 1 / linexp(r, 0.99, 0.01),
    format: (q) => `${Math.round(Math.min(100, Math.max(0, ((1 - 1 / q - 0.01) / 0.98) * 100)))}%`,
    range: '0 to 100%',
    defaultRaw: explin(0.45, 0.99, 0.01),
  },
];

export const WAVEFORMS = [
  { id: 'sine', label: 'Sine', text: 'A pure, smooth tone with no added harmonics.' },
  { id: 'saw', label: 'Sawtooth', text: 'Bright and buzzy, rich in harmonics: a classic synth sound.' },
  { id: 'triangle', label: 'Triangle', text: 'Soft and round, between a sine and a pulse, with a few quiet harmonics.' },
  { id: 'pulse', label: 'Pulse', text: 'Hollow and reedy, built from a square-edged wave.' },
  { id: 'noise', label: 'Noise', text: 'Unpitched hiss, useful for percussion and texture.' },
] as const;
export type WaveId = (typeof WAVEFORMS)[number]['id'];

/** Base MIDI notes for the four octaves the engine offers (C2, C3, C4, C5). */
export const OCTAVES = [36, 48, 60, 72];
export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const noteName = (midi: number) => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
/** The twelve keys play a C major scale from C up to the G above the next C. */
export const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];
export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Firmware serial packets: <type,id,value>. Keys use pull-ups, so pressed reads 0. */
export const keyPacket = (key: number, pressed: boolean) => `<0,${key},${pressed ? 0 : 1}>`;
export const knobPacket = (id: number, raw: number) => `<1,${id},${Math.round(raw)}>`;
