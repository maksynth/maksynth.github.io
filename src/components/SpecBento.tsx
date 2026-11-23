// "At a glance" bento grid: one card per spec, each with its own small animated
// visual built with GSAP. Visuals play once when the card scrolls into view; they
// are decorative (the numbers and notes carry the meaning).
import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { usePlayOnView, countUp, serialSteps } from '../lib/usePlayOnView';

const KNOBS = ['A', 'D', 'S', 'R', 'Cut', 'Res'];
const KNOB_ANGLES = [-90, 20, 95, -40, 120, -10];
const OCTAVES = ['C5', 'C4', 'C3', 'C2'];
const PACKETS = ['<0,0,0>', '<1,4,812>', '<0,4,0>', '<0,0,1>', '<1,2,640>', '<0,7,0>', '<0,4,1>', '<1,5,301>', '<1,3,455>', '<0,9,0>', '<0,9,1>'];

function Card({ area, label, value, note, children, build }: {
  area: string; label: string; value: number; note: string; children: ReactNode;
  build: (el: HTMLElement, tl: gsap.core.Timeline) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  usePlayOnView(ref, (el) => {
    const tl = gsap.timeline();
    countUp(tl, el.querySelector('.bento__value'), value, 0);
    build(el, tl);
    return tl;
  });
  return (
    <div ref={ref} className={`bento__card bento__card--${area}`}>
      <div className="bento__visual" aria-hidden="true">{children}</div>
      <dt className="bento__label">{label}</dt>
      <dd className="bento__data">
        <span className="bento__value">{value.toLocaleString('en-US')}</span>
        <span className="bento__note">{note}</span>
      </dd>
    </div>
  );
}

export default function SpecBento() {
  return (
    <dl className="bento">
      <Card
        area="keys" label="Keys" value={12} note="A C major scale, from C up to G."
        build={(el, tl) => {
          [0, 2, 4, 7, 9, 11, 9, 7, 4, 2].forEach((n, i) => {
            const k = el.querySelector(`[data-k="${n}"]`);
            if (!k) return;
            tl.call(() => k.classList.add('is-on'), undefined, 0.2 + i * 0.22)
              .to(k, { y: 3, duration: 0.1 }, 0.2 + i * 0.22)
              .call(() => k.classList.remove('is-on'), undefined, 0.38 + i * 0.22)
              .to(k, { y: 0, duration: 0.18 }, 0.38 + i * 0.22);
          });
        }}
      >
        <div className="mini-keys">
          {Array.from({ length: 12 }, (_, k) => <span key={k} className="mini-key" data-k={k} />)}
        </div>
      </Card>

      <Card
        area="waves" label="Waveforms" value={5} note="Sine, sawtooth, triangle, pulse and noise."
        build={(el, tl) => {
          const layers = el.querySelectorAll('.mini-wave img');
          tl.set(layers, { autoAlpha: 0 }, 0).set(layers[0], { autoAlpha: 1 }, 0);
          [1, 2, 3, 4].forEach((n, i) => {
            tl.to(layers[n - 1], { autoAlpha: 0, duration: 0.3 }, 0.8 + i * 0.85)
              .fromTo(layers[n], { autoAlpha: 0, scaleY: 0.6 }, { autoAlpha: 1, scaleY: 1, duration: 0.35, ease: 'back.out(2)' }, 0.85 + i * 0.85);
          });
        }}
      >
        <div className="mini-wave">
          {['sine', 'saw', 'triangle', 'pulse', 'noise'].map((w, i) => (
            <img key={w} src={`/img/waves/${w}.svg`} alt="" width={480} height={160} className={i === 0 ? 'is-first' : undefined} />
          ))}
        </div>
      </Card>

      <Card
        area="knobs" label="Knobs" value={6} note="Envelope and filter controls."
        build={(el, tl) => {
          el.querySelectorAll<HTMLElement>('.mini-knob__dial').forEach((d, i) => {
            tl.fromTo(d, { rotate: -135 }, { rotate: KNOB_ANGLES[i], duration: 1.1, ease: 'elastic.out(1, 0.55)' }, 0.15 + i * 0.12);
          });
        }}
      >
        <div className="mini-knobs">
          {KNOBS.map((k, i) => (
            <span key={k} className="mini-knob">
              <span className="mini-knob__dial" style={{ transform: `rotate(${KNOB_ANGLES[i]}deg)` }} />
              <span className="mini-knob__label">{k}</span>
            </span>
          ))}
        </div>
      </Card>

      <Card
        area="octaves" label="Octaves" value={4} note="From C2 up to C5."
        build={(el, tl) => {
          tl.fromTo(el.querySelectorAll('.mini-oct li'), { scaleX: 0.15 }, { scaleX: 1, duration: 0.5, ease: 'power3.out', stagger: { each: 0.12, from: 'end' } }, 0.1);
        }}
      >
        <ol className="mini-oct">
          {OCTAVES.map((o, i) => <li key={o} style={{ width: `${55 + (3 - i) * 15}%` }}><span>{o}</span></li>)}
        </ol>
      </Card>

      <Card
        area="notes" label="Notes at once" value={12} note="Layer keys into chords."
        build={(el, tl) => {
          tl.fromTo(el.querySelectorAll('.mini-dots span'), { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.35, ease: 'back.out(3)', stagger: 0.08 }, 0.1);
        }}
      >
        <div className="mini-dots">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
      </Card>

      <Card
        area="serial" label="Serial speed" value={115200} note="Baud, over USB."
        build={(el, tl) => {
          serialSteps(tl, el.querySelector('.mini-serial ul'));
        }}
      >
        <div className="mini-serial">
          <ul>{PACKETS.map((p, i) => <li key={i}><code translate="no">{p}</code></li>)}</ul>
        </div>
      </Card>
    </dl>
  );
}
