// Accessibility page settings: theme, text size, high contrast and reduced motion.
// Device settings apply automatically; these let a visitor override them on this site.
// Controls are React Bits Rubber Segment (choices) and Squish Switch (on/off).
import { useEffect, useState } from 'react';
import RubberSegment from './reactbits/RubberSegment';
import SquishSwitch from './reactbits/SquishSwitch';
import {
  getTheme, setTheme, getContrast, setContrast, getTextStep, setTextStep,
  siteReducesMotion, setSiteReducesMotion, systemPrefersReducedMotion, resetAll, onPrefsChange,
  type Theme, type TextStep,
} from '../lib/prefs';

const TEXT = [
  { value: '0', label: 'Default' },
  { value: '1', label: 'Large' },
  { value: '2', label: 'Larger' },
  { value: '3', label: 'Largest' },
];

export default function AccessibilitySettings() {
  const [ready, setReady] = useState(false);
  const [theme, setThemeS] = useState<Theme>('dark');
  const [text, setTextS] = useState<TextStep>(0);
  const [high, setHigh] = useState(false);
  const [deviceHigh, setDeviceHigh] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [deviceReduce, setDeviceReduce] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const sync = () => {
      setThemeS(getTheme());
      setTextS(getTextStep());
      const dh = window.matchMedia('(prefers-contrast: more)').matches;
      setDeviceHigh(dh);
      const c = getContrast();
      setHigh(c === 'high' || (c === 'system' && dh));
      setDeviceReduce(systemPrefersReducedMotion());
      setReduce(siteReducesMotion());
    };
    sync();
    setReady(true);
    return onPrefsChange(sync);
  }, []);

  const saved = (what: string) => setStatus(`${what} saved in this browser.`);

  return (
    <>
      <div className="settings">
        <div className="setting">
          <div className="setting__text">
            <span className="setting__label" id="set-theme">Theme</span>
            <span className="setting__hint">Dark is the default. The sun and moon button in the navbar does the same.</span>
          </div>
          <RubberSegment
              trackColor="var(--surface-3)"
              thumbColor="var(--ink)"
              textColor="var(--ink)"
              activeTextColor="var(--on-ink)"
              radius={14}
            items={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]}
            value={theme}
            onChange={(v) => { setTheme(v as Theme); saved('Theme'); }}
            size="lg"
            aria-label="Theme"
            disabled={!ready}
          />
        </div>
        <div className="setting">
          <div className="setting__text">
            <span className="setting__label" id="set-text">Text size</span>
            <span className="setting__hint">Makes all text on the site larger. Browser zoom also works on every page.</span>
          </div>
          <RubberSegment
              trackColor="var(--surface-3)"
              thumbColor="var(--ink)"
              textColor="var(--ink)"
              activeTextColor="var(--on-ink)"
              radius={14}
            items={TEXT}
            value={String(text)}
            onChange={(v) => { setTextStep(Number(v) as TextStep); saved('Text size'); }}
            size="lg"
            aria-label="Text size"
            disabled={!ready}
          />
        </div>
        <div className="setting">
          <div className="setting__text">
            <span className="setting__label" id="set-contrast">High contrast mode</span>
            <span className="setting__hint">
              {deviceHigh ? 'Your device asks for more contrast, so this starts on.' : 'Uses pure black and white with stronger borders.'}
            </span>
          </div>
          <SquishSwitch
            checked={high}
            onChange={(on) => { setContrast(on ? 'high' : 'normal'); saved('Contrast'); }}
            ariaLabel="High contrast"
            width={60}
            height={32}
            trackColor="var(--surface-3)"
            trackOnColor="var(--ink)"
            thumbColor="var(--ink-3)"
            thumbOnColor="var(--bg)"
            disabled={!ready}
          />
        </div>
        <div className="setting">
          <div className="setting__text">
            <span className="setting__label" id="set-motion">Reduce motion</span>
            <span className="setting__hint">
              {deviceReduce
                ? 'Your device already asks for reduced motion, so animations and smooth scrolling are off.'
                : 'Turns off scroll animations, smooth scrolling and the moving background on the home page.'}
            </span>
          </div>
          <SquishSwitch
            checked={reduce || deviceReduce}
            onChange={(on) => { setSiteReducesMotion(on); saved('Motion setting'); }}
            ariaLabel="Reduce motion"
            width={60}
            height={32}
            trackColor="var(--surface-3)"
            trackOnColor="var(--ink)"
            thumbColor="var(--ink-3)"
            thumbOnColor="var(--bg)"
            disabled={!ready || deviceReduce}
          />
        </div>
      </div>
      <div className="settings-foot">
        <button type="button" className="btn btn--secondary btn--small" disabled={!ready} onClick={() => { resetAll(); setStatus('Settings reset to their defaults.'); }}>
          Reset to defaults
        </button>
        <p className="status-text" role="status">{status}</p>
      </div>
    </>
  );
}
