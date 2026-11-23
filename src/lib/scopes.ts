// Canvas drawing for the three visualizers in the MAK SYNTH engine: an oscilloscope,
// a spectrum analyzer and an envelope graph. Colors come from the site's theme tokens.

export interface Palette { ink: string; faint: string; bg: string }

export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  return {
    ink: cs.getPropertyValue('--ink').trim() || '#f4f4f4',
    faint: cs.getPropertyValue('--line-strong').trim() || '#474747',
    bg: cs.getPropertyValue('--surface').trim() || '#161616',
  };
}

/** Matches the canvas buffer to its CSS size at the device pixel ratio. */
export function fit(canvas: HTMLCanvasElement) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d')!;
  return { ctx, w, h, dpr };
}

function grid(ctx: CanvasRenderingContext2D, w: number, h: number, p: Palette, dpr: number) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = p.faint;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = dpr;
  ctx.beginPath();
  ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawScope(canvas: HTMLCanvasElement, data: Float32Array | null, p: Palette) {
  const { ctx, w, h, dpr } = fit(canvas);
  grid(ctx, w, h, p, dpr);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  if (!data) { ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); return; }
  // Start at a rising zero crossing so periodic waves hold still.
  let start = 0;
  for (let i = 1; i < data.length / 2; i++) { if (data[i - 1] < 0 && data[i] >= 0) { start = i; break; } }
  const span = Math.min(data.length - start, Math.floor(data.length / 2));
  for (let i = 0; i < span; i++) {
    const x = (i / (span - 1)) * w;
    const y = h / 2 - data[start + i] * (h * 0.42) * 1.6;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

export function drawSpectrum(canvas: HTMLCanvasElement, data: Uint8Array | null, sampleRate: number, p: Palette) {
  const { ctx, w, h, dpr } = fit(canvas);
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  if (!data) return;
  const nyquist = sampleRate / 2;
  const lo = Math.log10(30), hi = Math.log10(16000);
  ctx.fillStyle = p.ink;
  const bars = Math.floor(w / (3 * dpr));
  for (let b = 0; b < bars; b++) {
    const f0 = Math.pow(10, lo + ((hi - lo) * b) / bars);
    const f1 = Math.pow(10, lo + ((hi - lo) * (b + 1)) / bars);
    const i0 = Math.floor((f0 / nyquist) * data.length);
    const i1 = Math.max(i0 + 1, Math.floor((f1 / nyquist) * data.length));
    let m = 0;
    for (let i = i0; i < i1 && i < data.length; i++) m = Math.max(m, data[i]);
    const bh = (m / 255) * (h - 4 * dpr);
    ctx.fillRect(b * 3 * dpr, h - bh, 2 * dpr, bh);
  }
}

export function drawEnvelope(
  canvas: HTMLCanvasElement,
  env: { attack: number; decay: number; sustain: number; release: number },
  p: Palette,
  highlight?: 'attack' | 'decay' | 'sustain' | 'release' | null,
) {
  const { ctx, w, h, dpr } = fit(canvas);
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  const hold = 0.6; // seconds the key is shown held, for the sustain stage
  const total = env.attack + env.decay + hold + env.release;
  const pad = 8 * dpr;
  const X = (t: number) => pad + (t / total) * (w - pad * 2);
  const Y = (v: number) => h - pad - v * (h - pad * 2);
  const pts: [number, number][] = [
    [0, 0], [env.attack, 1], [env.attack + env.decay, env.sustain],
    [env.attack + env.decay + hold, env.sustain], [total, 0],
  ];
  const stages = ['attack', 'decay', 'sustain', 'release'] as const;
  for (let s = 0; s < 4; s++) {
    ctx.strokeStyle = p.ink;
    ctx.globalAlpha = !highlight || highlight === stages[s] ? 1 : 0.35;
    ctx.lineWidth = (highlight === stages[s] ? 3 : 2) * dpr;
    ctx.beginPath();
    ctx.moveTo(X(pts[s][0]), Y(pts[s][1]));
    ctx.lineTo(X(pts[s + 1][0]), Y(pts[s + 1][1]));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Magnitude response of a resonant low-pass filter, drawn on a log frequency axis. */
export function drawFilter(canvas: HTMLCanvasElement, cutoff: number, q: number, p: Palette) {
  const { ctx, w, h, dpr } = fit(canvas);
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  const lo = Math.log10(30), hi = Math.log10(16000);
  const qq = Math.min(Math.max(q, 1 / 0.85), 20);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = 2 * dpr;
  ctx.beginPath();
  for (let x = 0; x <= w; x += dpr) {
    const f = Math.pow(10, lo + ((hi - lo) * x) / w);
    const r = f / cutoff;
    const mag = 1 / Math.sqrt((1 - r * r) ** 2 + (r / qq) ** 2);
    const db = Math.max(-36, Math.min(28, 20 * Math.log10(mag)));
    const y = h * 0.62 - (db / 36) * h * 0.55;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = p.faint;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = dpr;
  const cx = ((Math.log10(cutoff) - lo) / (hi - lo)) * w;
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
  ctx.globalAlpha = 1;
}
