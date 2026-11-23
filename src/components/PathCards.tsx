// How it works, step by step: one card per stage of the signal path, each with a
// visual. Photos show the hardware and the engine; GSAP draws the animated visuals
// (serial messages, waveforms, envelope, spectrum) once when a card scrolls into
// view. Visuals are decorative; the card text carries the content.
import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { usePlayOnView, serialSteps } from '../lib/usePlayOnView';

const PACKETS = ['<0,5,0>', '<1,4,812>', '<0,5,1>', '<0,0,0>', '<1,2,640>', '<0,0,1>', '<1,5,301>', '<0,7,0>', '<1,3,455>', '<0,9,0>', '<0,9,1>'];
const BARS = [0.35, 0.6, 0.9, 0.75, 0.55, 0.7, 0.45, 0.3, 0.5, 0.38, 0.26, 0.2, 0.16, 0.12];

type Step = { title: string; text: string; visual: ReactNode; build?: (el: HTMLElement, tl: gsap.core.Timeline) => void };

// Render serial packets in the text as code, without raw HTML.
const withCode = (t: string) =>
  t.split(/(<[01],\d,\d+>)/g).map((p, i) => (/^<[01],/.test(p) ? <code key={i} translate="no">{p}</code> : p));

const photo = (src: string, set: string, alt: string) => (
  <img src={src} srcSet={set} sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 45vw, 90vw" width={800} height={599} alt={alt} loading="lazy" decoding="async" />
);

const STEPS: Step[] = [
  {
    title: 'The controller',
    text: 'Twelve keys and six knobs sit on a custom board wired to an Arduino. Pressing a key pulls its pin low, and each knob is read as a number from 0 to 1023.',
    visual: photo('/img/pcb-kit-800.webp', '/img/pcb-kit-480.webp 480w, /img/pcb-kit-800.webp 800w', 'The green MAK SYNTH circuit board with a row of twelve buttons and a pin header.'),
  },
  {
    title: 'Serial messages',
    text: 'The firmware sends a short message when something changes: <0,5,0> for a key press, <1,4,812> for a knob. They travel over USB at 115,200 baud, with keys debounced and knobs smoothed.',
    visual: (
      <div className="pv-serial"><ul>{PACKETS.map((p, i) => <li key={i}><code translate="no">{p}</code></li>)}</ul></div>
    ),
    build: (el, tl) => {
      serialSteps(tl, el.querySelector('.pv-serial ul'));
    },
  },
  {
    title: 'The sound engine',
    text: 'SuperCollider reads those messages on your computer. Each key starts a voice, and each knob changes one setting in real time.',
    visual: photo('/img/synth-in-use-800.webp', '/img/synth-in-use-480.webp 480w, /img/synth-in-use-800.webp 800w', 'A hand playing the MAK SYNTH while the sound engine runs on the monitor behind it.'),
  },
  {
    title: 'Oscillators and filter',
    text: 'A voice starts as a sine, sawtooth, triangle, pulse or noise wave, then passes through a resonant low-pass filter set by the Cutoff and Resonance knobs.',
    visual: (
      <div className="pv-wave">
        {['sine', 'saw', 'triangle', 'pulse', 'noise'].map((w, i) => <img key={w} src={`/img/waves/${w}.svg`} alt="" width={480} height={160} className={i === 1 ? 'is-first' : undefined} />)}
      </div>
    ),
    build: (el, tl) => {
      const layers = el.querySelectorAll('.pv-wave img');
      tl.set(layers, { autoAlpha: 0 }, 0).set(layers[0], { autoAlpha: 1 }, 0);
      [1, 2, 3, 4].forEach((n, i) => {
        const prev = n - 1;
        tl.to(layers[prev], { autoAlpha: 0, duration: 0.3 }, 0.8 + i * 0.85)
          .fromTo(layers[n], { autoAlpha: 0, scaleY: 0.6 }, { autoAlpha: 1, scaleY: 1, duration: 0.35, ease: 'back.out(2)' }, 0.85 + i * 0.85);
      });
    },
  },
  {
    title: 'The envelope',
    text: 'Attack, decay, sustain and release shape each note’s volume over time, so a note can swell in slowly or stop the moment you let go.',
    visual: (
      <svg className="pv-env" viewBox="0 0 320 160" preserveAspectRatio="none">
        <line x1="0" y1="128" x2="320" y2="128" className="pv-env__base" />
        <polyline points="10,128 60,16 110,58 230,58 310,128" className="pv-env__line" pathLength={1} />
        {[['A', 31], ['D', 81], ['S', 166], ['R', 266]].map(([t, x]) => <text key={t as string} x={x as number} y="152" className="pv-env__label">{t}</text>)}
      </svg>
    ),
    build: (el, tl) => {
      const line = el.querySelector('.pv-env__line');
      if (line) tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: 'power1.inOut' }, 0.1);
      tl.fromTo(el.querySelectorAll('.pv-env__label'), { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, stagger: 0.45, duration: 0.3 }, 0.3);
    },
  },
  {
    title: 'Sound and visualizers',
    text: 'Voices are mixed with headroom so chords don’t clip, then sent to your speakers. On screen, an oscilloscope, a spectrum analyzer and an envelope graph follow along.',
    visual: <div className="pv-bars">{BARS.map((h, i) => <span key={i} style={{ height: `${h * 100}%` }} />)}</div>,
    build: (el, tl) => {
      const bars = el.querySelectorAll<HTMLElement>('.pv-bars span');
      bars.forEach((b, i) => {
        tl.fromTo(b, { scaleY: 0.05 }, { scaleY: 1, duration: 0.5, ease: 'power2.out' }, i * 0.04)
          .to(b, { scaleY: 0.4 + Math.abs(Math.sin(i * 1.7)) * 0.6, duration: 0.4, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.6 + i * 0.03);
      });
    },
  },
];

function Card({ step, n }: { step: Step; n: number }) {
  const ref = useRef<HTMLLIElement>(null);
  usePlayOnView(ref, (el) => {
    const tl = gsap.timeline();
    step.build?.(el, tl);
    return tl;
  });
  return (
    <li ref={ref} className="path-card">
      <div className="path-card__visual" aria-hidden={step.build ? 'true' : undefined}>{step.visual}</div>
      <div className="path-card__body">
        <h3><span className="path-card__num" aria-hidden="true">{n}</span>{step.title}</h3>
        <p>{withCode(step.text)}</p>
      </div>
    </li>
  );
}

export default function PathCards() {
  return (
    <ol className="path-cards">
      {STEPS.map((s, i) => <Card key={s.title} step={s} n={i + 1} />)}
    </ol>
  );
}
