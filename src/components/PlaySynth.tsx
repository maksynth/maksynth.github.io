// "Play it in your browser": a working copy of the MAK SYNTH controls and engine.
// Twelve keys, five waveforms, four octaves and the six knobs, with the engine's three
// visualizers and the serial message the real controller would send for each action.
// Interactive pieces come from React Bits (Rubber Segment for the waveform, Elastic
// Slider for the knobs, Warm Tooltip for icon buttons); sound is Web Audio and only
// starts when the visitor plays a key.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import RubberSegment from './reactbits/RubberSegment';
import ElasticSlider from './reactbits/ElasticSlider';
import { WarmTooltipGroup } from './reactbits/WarmTooltip';
import Tip from './Tip';
import { FontAwesomeIcon } from '../lib/fa';
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { CONTROLS, WAVEFORMS, OCTAVES, SCALE, noteName, midiToHz, keyPacket, knobPacket, type WaveId } from '../lib/synthMap';
import { SynthEngine } from '../lib/synthEngine';
import { drawScope, drawSpectrum, drawEnvelope, readPalette, type Palette } from '../lib/scopes';
import { onPrefsChange } from '../lib/prefs';

// Physical key positions (event.code), so the layout works on any keyboard language.
// The twelve keys are all white, like the controller: a C major scale from C to G.
const KEY_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight'];
const KEY_LETTERS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']'];
const KEYS = Array.from({ length: 12 }, (_, k) => k);
const WAVE_SHORT: Record<WaveId, string> = { sine: 'Sine', saw: 'Saw', triangle: 'Triangle', pulse: 'Pulse', noise: 'Noise' };

export default function PlaySynth() {
  const [ready, setReady] = useState(false);
  const [wave, setWave] = useState<WaveId>('sine');
  const [octave, setOctave] = useState(1);
  const [raw, setRaw] = useState<number[]>(() => CONTROLS.map((c) => c.defaultRaw));
  const [down, setDown] = useState<Set<number>>(new Set());
  const [packet, setPacket] = useState<{ text: string; meaning: string }>({ text: '', meaning: 'Play a key or turn a knob to see one.' });

  const engine = useRef<SynthEngine | null>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<HTMLCanvasElement>(null);
  const palette = useRef<Palette | null>(null);
  const raf = useRef(0);
  const quietFrames = useRef(0);

  const values = useMemo(() => CONTROLS.map((c, i) => c.map(raw[i])), [raw]);
  const env = useMemo(
    () => ({ attack: values[0], decay: values[1], sustain: values[2], release: values[3] }),
    [values],
  );

  // Draw idle visualizers and keep them in the current theme.
  const drawIdle = useCallback(() => {
    palette.current = readPalette();
    if (scopeRef.current) drawScope(scopeRef.current, null, palette.current);
    if (specRef.current) drawSpectrum(specRef.current, null, 48000, palette.current);
  }, []);

  useEffect(() => {
    setReady(true);
    drawIdle();
    const off = onPrefsChange(() => { drawIdle(); if (envRef.current) drawEnvelope(envRef.current, env, readPalette()); });
    const onResize = () => drawIdle();
    window.addEventListener('resize', onResize);
    return () => {
      off();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf.current);
      engine.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (envRef.current) drawEnvelope(envRef.current, env, palette.current ?? readPalette());
    engine.current?.setEnvelope(env);
  }, [env]);

  useEffect(() => {
    engine.current?.setFilter(values[4], values[5]);
  }, [values]);

  useEffect(() => {
    if (engine.current) engine.current.wave = wave;
  }, [wave]);

  const loop = useCallback(() => {
    const e = engine.current;
    if (!e || !scopeRef.current || !specRef.current) return;
    const p = palette.current ?? readPalette();
    const time = new Float32Array(e.analyser.fftSize);
    const freq = new Uint8Array(e.analyser.frequencyBinCount);
    e.analyser.getFloatTimeDomainData(time);
    e.analyser.getByteFrequencyData(freq);
    drawScope(scopeRef.current, time, p);
    drawSpectrum(specRef.current, freq, e.ctx.sampleRate, p);
    let peak = 0;
    for (let i = 0; i < time.length; i += 8) peak = Math.max(peak, Math.abs(time[i]));
    quietFrames.current = e.activeVoices === 0 && peak < 0.002 ? quietFrames.current + 1 : 0;
    if (quietFrames.current > 20) { drawIdle(); raf.current = 0; return; }
    raf.current = requestAnimationFrame(loop);
  }, [drawIdle]);

  const ensureEngine = useCallback(async () => {
    if (!engine.current) {
      engine.current = new SynthEngine();
      engine.current.wave = wave;
      engine.current.setEnvelope(env);
      engine.current.setFilter(values[4], values[5]);
    }
    await engine.current.resume();
    return engine.current;
  }, [wave, env, values]);

  const press = useCallback(async (k: number) => {
    setDown((d) => (d.has(k) ? d : new Set(d).add(k)));
    setPacket({ text: keyPacket(k, true), meaning: `Key ${k + 1} pressed: its pin reads 0 (LOW)` });
    const e = await ensureEngine();
    e.noteOn(k, midiToHz(OCTAVES[octave] + SCALE[k]));
    if (!raf.current) { quietFrames.current = 0; raf.current = requestAnimationFrame(loop); }
  }, [ensureEngine, octave, loop]);

  const release = useCallback((k: number) => {
    setDown((d) => { if (!d.has(k)) return d; const n = new Set(d); n.delete(k); return n; });
    setPacket({ text: keyPacket(k, false), meaning: `Key ${k + 1} released: its pin reads 1 (HIGH)` });
    engine.current?.noteOff(k);
  }, []);

  const changeOctave = (dir: number) => {
    engine.current?.allOff();
    setDown(new Set());
    setOctave((o) => Math.max(0, Math.min(3, o + dir)));
  };

  const setKnob = (i: number, v: number) => {
    setRaw((r) => { const n = r.slice(); n[i] = v; return n; });
    setPacket({ text: knobPacket(i, v), meaning: `${CONTROLS[i].name} knob turned to ${Math.round(v)} of 1023` });
  };

  // Computer keyboard: the Q to ] row plays notes, Z and X change octave. Active while
  // focus is inside the synth panel, so it never captures typing elsewhere.
  const onPanelKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement;
    if (target.getAttribute('role') === 'slider' || target.getAttribute('role') === 'radio') return;
    if (e.code === 'KeyZ') { e.preventDefault(); changeOctave(-1); return; }
    if (e.code === 'KeyX') { e.preventDefault(); changeOctave(1); return; }
    const k = KEY_CODES.indexOf(e.code);
    if (k < 0) return;
    e.preventDefault();
    if (!e.repeat) void press(k);
  };
  const onPanelKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = KEY_CODES.indexOf(e.code);
    if (k >= 0) release(k);
  };

  const keyButton = (k: number) => {
    const midi = OCTAVES[octave] + SCALE[k];
    return (
      <button
        key={k}
        type="button"
        className={`key key--white${down.has(k) ? ' is-down' : ''}`}
        aria-label={noteName(midi)}
        aria-pressed={down.has(k)}
        disabled={!ready}
        onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ } void press(k); }}
        onPointerUp={() => release(k)}
        onPointerCancel={() => release(k)}
        onLostPointerCapture={() => release(k)}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); e.stopPropagation(); void press(k); }
        }}
        onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(k); } }}
      >
        <span className="key__label" aria-hidden="true">{KEY_LETTERS[k]}</span>
      </button>
    );
  };

  const control = (i: number) => {
    const c = CONTROLS[i];
    return (
      <div className="control" key={c.id}>
        <span className="control__name" id={`ctl-${c.id}`}>{c.name}</span>
        <ElasticSlider
          value={raw[i]}
          startingValue={0}
          maxValue={1023}
          onChange={(v) => setKnob(i, v)}
          leftIcon={null}
          rightIcon={null}
          valuePosition="none"
          formatValue={(v) => c.format(c.map(v))}
          thickness={8}
          activeThickness={8}
          maxStretch={24}
          trackColor="var(--surface-3)"
          rangeColor="var(--ink)"
          ariaLabel={c.name}
          disabled={!ready}
        />
        <span className="control__value" aria-hidden="true">{c.format(values[i])}</span>
      </div>
    );
  };

  return (
    <div
      className="play-panel"
      data-ready={ready ? 'true' : 'false'}
      onKeyDown={onPanelKeyDown}
      onKeyUp={onPanelKeyUp}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { engine.current?.allOff(); setDown(new Set()); } }}
    >
      <WarmTooltipGroup>
        <div className="play-top">
          <div className="play-field">
            <span className="play-field__label" id="wave-label">Waveform</span>
            <RubberSegment
              trackColor="var(--surface-3)"
              thumbColor="var(--ink)"
              textColor="var(--ink)"
              activeTextColor="var(--on-ink)"
              radius={14}
              items={WAVEFORMS.map((w) => ({ value: w.id, label: WAVE_SHORT[w.id] }))}
              value={wave}
              onChange={(v) => setWave(v as WaveId)}
              size="lg"
              aria-label="Waveform"
              disabled={!ready}
            />
          </div>
          <div className="play-field">
            <span className="play-field__label" id="oct-label">Octave</span>
            <div className="octave" role="group" aria-labelledby="oct-label">
              <Tip text="Lower octave">
                <button type="button" className="icon-btn" aria-label="Lower octave" onClick={() => changeOctave(-1)} disabled={!ready || octave === 0}>
                  <FontAwesomeIcon icon={faMinus} />
                </button>
              </Tip>
              <output aria-live="polite">{noteName(OCTAVES[octave])}</output>
              <Tip text="Raise octave">
                <button type="button" className="icon-btn" aria-label="Raise octave" onClick={() => changeOctave(1)} disabled={!ready || octave === 3}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </Tip>
            </div>
          </div>
        </div>
      </WarmTooltipGroup>

      <div className="keys-scroll">
        <div className="keys" role="group" aria-label="Keyboard, twelve keys in C major">
          {KEYS.map(keyButton)}
        </div>
      </div>
      <p className="play-help keys-hint">Swipe the keyboard sideways to reach every key.</p>
      <p className="play-help">
        Click or tap a key. With a keyboard, click inside the synth and use the top letter row, from <kbd>Q</kbd> to <kbd>]</kbd>. <kbd>Z</kbd> and <kbd>X</kbd> change the octave.
      </p>
      <div className="serial">
        <span>Serial message the controller would send</span>
        {packet.text && <code translate="no">{packet.text}</code>}
        <span>{packet.meaning}</span>
      </div>

      <div className="play-scopes">
        <figure className="scope">
          <h3>Oscilloscope</h3>
          <p>The shape of the wave over time.</p>
          <canvas ref={scopeRef} aria-label="Oscilloscope showing the current waveform" role="img" />
        </figure>
        <figure className="scope">
          <h3>Spectrum analyzer</h3>
          <p>The frequencies in the sound, low to high.</p>
          <canvas ref={specRef} aria-label="Spectrum analyzer showing the frequencies in the sound" role="img" />
        </figure>
        <figure className="scope">
          <h3>Envelope</h3>
          <p>Attack, decay, sustain and release.</p>
          <canvas
            ref={envRef}
            role="img"
            aria-label={`Envelope graph: attack ${CONTROLS[0].format(env.attack)}, decay ${CONTROLS[1].format(env.decay)}, sustain ${CONTROLS[2].format(env.sustain)}, release ${CONTROLS[3].format(env.release)}`}
          />
        </figure>
      </div>

      <div className="play-controls">
        <fieldset className="control-group">
          <legend>Envelope</legend>
          {[0, 1, 2, 3].map(control)}
        </fieldset>
        <fieldset className="control-group">
          <legend>Filter</legend>
          {[4, 5].map(control)}
        </fieldset>
      </div>
    </div>
  );
}
