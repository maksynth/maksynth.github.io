// How it works: the five waveforms, each with a drawing and a button that plays a
// one-second note (C4) through the same browser engine as the home page synth.
// While a note plays, its drawing scrolls sideways one period at a time, like a
// trace on an oscilloscope. The motion only runs during the note the visitor started.
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '../lib/fa';
import { faPlay, faStop } from '@fortawesome/free-solid-svg-icons';
import { WAVEFORMS, CONTROLS, midiToHz, type WaveId } from '../lib/synthMap';
import { SynthEngine } from '../lib/synthEngine';

const W = 480;
const MID = 80;
const AMP = 60;
const PERIOD = 192; // 2.5 cycles across the drawing

// A fixed pseudo-random sequence, so the noise drawing is the same on every load.
const NOISE = Array.from({ length: 81 }, (_, i) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
});

/** Path data for one waveform, drawn wide enough to scroll by one period. */
function wavePath(id: WaveId): { d: string; period: number } {
  if (id === 'noise') {
    const pts: string[] = [];
    for (let x = 0; x <= W * 2; x += 6) pts.push(`${x},${(MID - NOISE[(x / 6) % 80] * AMP).toFixed(1)}`);
    return { d: `M${pts.join('L')}`, period: W };
  }
  const end = W + PERIOD;
  if (id === 'pulse') {
    const half = PERIOD / 2;
    let d = `M0,${MID - AMP}`;
    for (let x = 0; x < end; x += PERIOD) {
      d += `L${x + half},${MID - AMP}L${x + half},${MID + AMP}L${x + PERIOD},${MID + AMP}L${x + PERIOD},${MID - AMP}`;
    }
    return { d, period: PERIOD };
  }
  if (id === 'saw') {
    let d = `M0,${MID}`;
    for (let x = 0; x < end; x += PERIOD) {
      d += `L${x + PERIOD / 2},${MID - AMP}L${x + PERIOD / 2},${MID + AMP}L${x + PERIOD},${MID}`;
    }
    return { d, period: PERIOD };
  }
  const pts: string[] = [];
  for (let x = 0; x <= end; x += 3) {
    const ph = (x / PERIOD) % 1;
    const v = id === 'sine'
      ? Math.sin(ph * 2 * Math.PI)
      : ph < 0.25 ? ph * 4 : ph < 0.75 ? 2 - ph * 4 : ph * 4 - 4;
    pts.push(`${x},${(MID - v * AMP).toFixed(1)}`);
  }
  return { d: `M${pts.join('L')}`, period: PERIOD };
}

const PATHS = Object.fromEntries(WAVEFORMS.map((w) => [w.id, wavePath(w.id)])) as Record<WaveId, { d: string; period: number }>;

export default function WaveCards() {
  const engine = useRef<SynthEngine | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [playing, setPlaying] = useState<WaveId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    return () => { window.clearTimeout(timer.current); engine.current?.close(); };
  }, []);

  const play = async (id: WaveId) => {
    if (!engine.current) engine.current = new SynthEngine();
    const e = engine.current;
    await e.resume();
    window.clearTimeout(timer.current);
    e.allOff();
    if (playing === id) { setPlaying(null); return; }
    e.wave = id;
    e.setEnvelope({ attack: 0.02, decay: 0.15, sustain: 0.7, release: 0.3 });
    e.setFilter(CONTROLS[4].map(CONTROLS[4].defaultRaw), CONTROLS[5].map(CONTROLS[5].defaultRaw));
    e.noteOn(0, midiToHz(60));
    setPlaying(id);
    timer.current = window.setTimeout(() => { e.noteOff(0); setPlaying(null); }, 1000);
  };

  return (
    <ul className="card-grid card-grid--5">
      {WAVEFORMS.map((w) => (
        <li key={w.id}>
          <article className={`card wave-card${playing === w.id ? ' is-playing' : ''}`}>
            <div className="card__media">
              <svg viewBox={`0 0 ${W} 160`} role="img" aria-label={`Drawing of a ${w.label.toLowerCase()} wave`}>
                <line x1="0" y1={MID} x2={W} y2={MID} className="wave-card__axis" />
                <path d={PATHS[w.id].d} className="wave-card__line" style={{ ['--period' as string]: `${-PATHS[w.id].period}px` }} />
              </svg>
            </div>
            <h3>{w.label}</h3>
            <p>{w.text}</p>
            <div className="card__actions">
              <button type="button" className="btn btn--secondary" onClick={() => void play(w.id)} disabled={!ready} aria-pressed={playing === w.id}>
                <FontAwesomeIcon icon={playing === w.id ? faStop : faPlay} />
                {`Hear the ${w.label.toLowerCase()} wave`}
              </button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
