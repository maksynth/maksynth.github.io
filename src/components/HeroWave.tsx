// Home hero background: React Bits Gradient Waves, kept monochrome, slow and calm.
// The full gradient wave is the user's explicit request (an approved exception to the
// standards' gradient ban). Because it moves on its own for longer than 5 seconds next
// to content, it has a pause control (WCAG 2.2.2), shown only once JavaScript runs and
// only while motion is allowed. A pre-rendered still of the same wave (CSS background
// of .hero-wave) shows from the first paint, without JavaScript, when motion is reduced,
// and on devices that render WebGL in software; the live wave only runs on top of it
// when the device has GPU acceleration.
import { useEffect, useState } from 'react';
import GradientWaves from './reactbits/GradientWaves';
import Tip from './Tip';
import { FontAwesomeIcon } from '../lib/fa';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { getTheme, motionReduced, onPrefsChange } from '../lib/prefs';

const PAUSE_KEY = 'mak-wave-paused';

/** True when the browser would render WebGL in software (no GPU acceleration). There the
 *  raymarched wave would tie up the CPU, so it shows one still frame instead. */
function softwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return true;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
  } catch {
    return true;
  }
}

export default function HeroWave() {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [light, setLight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const sync = () => {
      setReduced(motionReduced());
      setLight(getTheme() === 'light');
    };
    sync();
    try { setPaused(localStorage.getItem(PAUSE_KEY) === '1'); } catch { /* storage unavailable */ }
    setStill(softwareWebGL());
    // Start the wave once the page has loaded and the browser is idle, so it never
    // competes with the first paint of the title and the synth image.
    const begin = () => setMounted(true);
    const idle = (cb: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(cb, { timeout: 1500 }) : window.setTimeout(cb, 300));
    if (document.readyState === 'complete') idle(begin);
    else window.addEventListener('load', () => idle(begin), { once: true });
    return onPrefsChange(sync);
  }, []);

  const togglePause = () => {
    setPaused((p) => {
      try { localStorage.setItem(PAUSE_KEY, p ? '0' : '1'); } catch { /* storage unavailable */ }
      return !p;
    });
  };
  // The pause control also stops the pulsing scroll arrow.
  useEffect(() => {
    if (paused) document.documentElement.dataset.heroPaused = '';
    else delete document.documentElement.dataset.heroPaused;
  }, [paused]);

  const colors = light
    ? { horizon: '#ffffff', wave: '#b9b9b9', crest: '#4a4a4a' }
    : { horizon: '#0d0d0d', wave: '#3a3a3a', crest: '#d4d4d4' };
  const label = paused ? 'Play animation' : 'Pause animation';

  return (
    <>
      <div className="hero-wave" aria-hidden="true">
        {mounted && !reduced && !still && (
          <GradientWaves
            horizonColor={colors.horizon}
            waveColor={colors.wave}
            crestColor={colors.crest}
            lightMode={light}
            speed={0.22}
            amplitude={2.2}
            waveScale={0.62}
            waveRatio={0.9}
            swell={30}
            turbulence={14}
            tilt={66}
            zoom={1}
            height={5}
            fogDepth={16}
            relief={0.8}
            sheen={0}
            brightness={1}
            opacity={light ? 0.75 : 0.95}
            grain={0}
            quality="medium"
            intro
            mouseInteraction={false}
            parallaxStrength={0}
            swellOnClick={false}
            paused={paused}
            dpr={1.5}
          />
        )}
      </div>
      {mounted && !reduced && !still && (
        <div className="wave-pause">
          <Tip text={label} side="left">
            <button type="button" className="icon-btn" aria-label={label} onClick={togglePause}>
              <FontAwesomeIcon icon={paused ? faPlay : faPause} />
            </button>
          </Tip>
        </div>
      )}
    </>
  );
}
