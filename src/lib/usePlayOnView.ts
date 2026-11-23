// Plays a short GSAP timeline once, when an element scrolls into view. Each run is
// kept under five seconds, so nothing keeps moving next to the
// content (WCAG 2.2.2). Nothing plays when the device or the site reduces motion.
import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { motionReduced } from './prefs';

export function usePlayOnView(
  ref: RefObject<HTMLElement | null>,
  build: (el: HTMLElement) => gsap.core.Timeline,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || motionReduced()) return;
    let io: IntersectionObserver | null = null;
    const ctx = gsap.context(() => {
      const tl = build(el).pause(0);
      io = new IntersectionObserver(
        (entries) => { if (entries.some((e) => e.isIntersecting)) { tl.restart(); io?.disconnect(); } },
        { threshold: 0.35 },
      );
      io.observe(el);
    }, el);
    return () => {
      io?.disconnect();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Counts a number up inside `el` from 0 to its final value (already in the HTML). */
export function countUp(tl: gsap.core.Timeline, el: Element | null, end: number, at = 0) {
  if (!el) return tl;
  const fmt = new Intl.NumberFormat('en-US');
  const state = { v: 0 };
  return tl.fromTo(state, { v: 0 }, {
    v: end, duration: end > 1000 ? 1.4 : 0.9, ease: 'power2.out',
    onUpdate: () => { el.textContent = fmt.format(Math.round(state.v)); },
    onComplete: () => { el.textContent = fmt.format(end); },
  }, at);
}

/**
 * Moves a list of serial messages up one line at a time, pausing on each, like
 * messages arriving from the controller. Five steps keep the run under five seconds.
 */
export function serialSteps(tl: gsap.core.Timeline, list: Element | null, steps = 5) {
  if (!list || !list.children.length) return tl;
  const row = 100 / list.children.length;
  tl.set(list, { yPercent: 0 }, 0);
  for (let i = 1; i <= steps; i++) {
    tl.to(list, { yPercent: -row * i, duration: 0.45, ease: 'power2.inOut' }, 0.35 + (i - 1) * 0.9);
  }
  return tl;
}
