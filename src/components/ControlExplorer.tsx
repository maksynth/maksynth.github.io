// How it works: the six controls as an accordion. Each control's name and description
// is a heading button; opening one shows its knob, the serial message the controller
// would send, the engine value and the matching graph right under it. One control is
// open at a time, and the open one can be closed again.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ElasticSlider from './reactbits/ElasticSlider';
import { FontAwesomeIcon } from '../lib/fa';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { CONTROLS, knobPacket } from '../lib/synthMap';
import { drawEnvelope, drawFilter, readPalette } from '../lib/scopes';
import { onPrefsChange, motionReduced } from '../lib/prefs';
import gsap from 'gsap';

const STAGES = ['attack', 'decay', 'sustain', 'release'] as const;
const slug = (i: number) => CONTROLS[i].name.toLowerCase();

export default function ControlExplorer() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [closing, setClosing] = useState<number | null>(null);
  const [raw, setRaw] = useState<number[]>(() => CONTROLS.map((c) => c.defaultRaw));
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const values = useMemo(() => CONTROLS.map((k, i) => k.map(raw[i])), [raw]);
  const animate = useRef(false);

  const draw = () => {
    if (open === null) return;
    const canvas = canvases.current[open];
    if (!canvas) return;
    const p = readPalette();
    if (CONTROLS[open].group === 'envelope') {
      drawEnvelope(canvas, { attack: values[0], decay: values[1], sustain: values[2], release: values[3] }, p, STAGES[open]);
    } else {
      drawFilter(canvas, values[4], values[5], p);
    }
  };

  // The open control lives in the URL (?control=cutoff) so refresh and shared links keep it.
  useEffect(() => {
    const wanted = new URLSearchParams(location.search).get('control');
    const i = CONTROLS.findIndex((k) => k.name.toLowerCase() === wanted);
    if (i >= 0) setOpen(i);
    setReady(true);
  }, []);

  const toggle = (i: number) => {
    animate.current = !motionReduced();
    const next = open === i ? null : i;
    setClosing(animate.current ? open : null);
    setOpen(next);
    const url = new URL(location.href);
    if (next === null) url.searchParams.delete('control');
    else url.searchParams.set('control', slug(next));
    history.replaceState(history.state, '', url);
  };

  // Opening eases the panel down to its height; closing eases it back up first.
  useLayoutEffect(() => {
    if (!animate.current) return;
    const tweens: gsap.core.Tween[] = [];
    const opening = open !== null ? panels.current[open] : null;
    if (opening) {
      tweens.push(gsap.fromTo(opening, { height: 0, autoAlpha: 0 }, {
        height: 'auto', autoAlpha: 1, duration: 0.38, ease: 'power2.out', clearProps: 'height,opacity,visibility',
      }));
    }
    const shutting = closing !== null ? panels.current[closing] : null;
    if (shutting) {
      tweens.push(gsap.to(shutting, {
        height: 0, autoAlpha: 0, duration: 0.3, ease: 'power2.inOut', onComplete: () => setClosing(null),
      }));
    }
    animate.current = false;
    return () => tweens.forEach((t) => t.progress(1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(draw);
  useEffect(() => {
    const off = onPrefsChange(draw);
    window.addEventListener('resize', draw);
    return () => { off(); window.removeEventListener('resize', draw); };
  });

  return (
    <ul className="explorer" aria-label="The six controls">
      {CONTROLS.map((c, i) => {
        const isOpen = open === i;
        const shown = isOpen || closing === i;
        const graphLabel = c.group === 'envelope'
          ? `Envelope graph with the ${c.name.toLowerCase()} stage highlighted`
          : `Filter response with the cutoff at ${CONTROLS[4].format(values[4])} and resonance at ${CONTROLS[5].format(values[5])}`;
        return (
          <li key={c.id} className={`explorer__entry${isOpen ? ' is-open' : ''}`}>
            <h3 className="explorer__heading">
              <button
                type="button"
                className="explorer__item"
                id={`ctl-btn-${c.id}`}
                aria-expanded={isOpen}
                aria-controls={`ctl-panel-${c.id}`}
                onClick={() => toggle(i)}
              >
                <span className="explorer__name">{c.name}<span className="explorer__concept">{c.concept}</span></span>
                <span className="explorer__desc">{c.description}</span>
                <FontAwesomeIcon icon={faChevronDown} className="explorer__chevron" />
              </button>
            </h3>
            <div
              className="explorer__panel"
              id={`ctl-panel-${c.id}`}
              role="region"
              aria-labelledby={`ctl-btn-${c.id}`}
              hidden={!shown}
              ref={(el) => { panels.current[i] = el; }}
            >
              {shown && (
                <div className="explorer__inner">
                  <div className="explorer__try">
                    <span className="explorer__try-label" aria-hidden="true">Turn the {c.name} knob</span>
                    <ElasticSlider
                      value={raw[i]}
                      startingValue={0}
                      maxValue={1023}
                      onChange={(v) => setRaw((r) => { const n = r.slice(); n[i] = v; return n; })}
                      leftIcon={null}
                      rightIcon={null}
                      valuePosition="none"
                      formatValue={(v) => c.format(c.map(v))}
                      thickness={8}
                      activeThickness={8}
                      maxStretch={24}
                      trackColor="var(--surface-3)"
                      rangeColor="var(--ink)"
                      ariaLabel={`${c.name} knob`}
                      disabled={!ready}
                    />
                    <dl className="explorer__readout">
                      <div><dt>Knob reading</dt><dd>{Math.round(raw[i])} of 1023</dd></div>
                      <div><dt>Serial message</dt><dd><code translate="no">{knobPacket(c.id, raw[i])}</code></dd></div>
                      <div><dt>Engine value</dt><dd>{c.format(values[i])}</dd></div>
                      <div><dt>Full range</dt><dd>{c.range}</dd></div>
                    </dl>
                  </div>
                  <canvas
                    ref={(el) => { canvases.current[i] = el; }}
                    className="explorer__graph"
                    role="img"
                    aria-label={graphLabel}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
