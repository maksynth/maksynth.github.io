// Display preferences shared by the theme toggle, the Accessibility page, the hero
// wave and the motion scripts. Stored per browser as a convenience; every read and
// write is guarded because storage can be unavailable (private windows, previews).

export type Theme = 'dark' | 'light';
export type Contrast = 'system' | 'high' | 'normal';
export type TextStep = 0 | 1 | 2 | 3;

const root = () => document.documentElement;

function save(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice still applies to this page view */
  }
}

function announce() {
  window.dispatchEvent(new CustomEvent('mak:prefs'));
}

export function getTheme(): Theme {
  return root().dataset.theme === 'light' ? 'light' : 'dark';
}
function syncThemeColor(theme: Theme) {
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) =>
    m.setAttribute('content', theme === 'light' ? '#ffffff' : '#0d0d0d'));
}
function applyTheme(theme: Theme) {
  root().dataset.theme = theme;
  syncThemeColor(theme);
  save('mak-theme', theme);
  announce();
}
/**
 * Switches the theme with a short cross-fade. Browsers with view transitions fade the
 * whole page from the old colors to the new ones; others ease the color properties.
 * With reduced motion the switch is instant.
 */
export function setTheme(theme: Theme) {
  if (theme === getTheme()) return;
  if (motionReduced()) { applyTheme(theme); return; }
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === 'function') {
    root().classList.add('theme-vt');
    const vt = doc.startViewTransition(() => applyTheme(theme)) as { finished?: Promise<unknown> };
    const done = () => root().classList.remove('theme-vt');
    if (vt?.finished) vt.finished.then(done, done); else done();
    return;
  }
  root().classList.add('theme-fade');
  applyTheme(theme);
  window.setTimeout(() => root().classList.remove('theme-fade'), 500);
}

export function getContrast(): Contrast {
  const c = root().dataset.contrast;
  return c === 'high' || c === 'normal' ? c : 'system';
}
export function setContrast(c: Contrast) {
  if (c === 'system') delete root().dataset.contrast;
  else root().dataset.contrast = c;
  save('mak-contrast', c === 'system' ? null : c);
  announce();
}

export function systemPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function siteReducesMotion(): boolean {
  return root().dataset.motion === 'reduce';
}
/** True when either the device or the site setting asks for reduced motion. */
export function motionReduced(): boolean {
  return systemPrefersReducedMotion() || siteReducesMotion();
}
export function setSiteReducesMotion(on: boolean) {
  if (on) root().dataset.motion = 'reduce';
  else delete root().dataset.motion;
  save('mak-motion', on ? 'reduce' : null);
  announce();
}

export function getTextStep(): TextStep {
  const t = Number(root().dataset.text || 0);
  return (t >= 0 && t <= 3 ? t : 0) as TextStep;
}
export function setTextStep(step: TextStep) {
  if (step === 0) delete root().dataset.text;
  else root().dataset.text = String(step);
  save('mak-text', step === 0 ? null : String(step));
  announce();
}

export function resetAll() {
  ['mak-theme', 'mak-contrast', 'mak-motion', 'mak-text'].forEach((k) => save(k, null));
  root().dataset.theme = 'dark';
  syncThemeColor('dark');
  delete root().dataset.contrast;
  delete root().dataset.motion;
  delete root().dataset.text;
  announce();
}

/** Calls `fn` whenever any preference or the device motion setting changes. */
export function onPrefsChange(fn: () => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener('mak:prefs', fn);
  mq.addEventListener('change', fn);
  return () => {
    window.removeEventListener('mak:prefs', fn);
    mq.removeEventListener('change', fn);
  };
}
