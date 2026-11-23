// Scroll motion for content pages, built on GSAP ScrollTrigger.
// Content is visible in the HTML; GSAP only animates from a hidden state once the
// script runs, so nothing stays hidden if JavaScript fails. Everything is set up in
// gsap.matchMedia() and skipped when the device or the site asks for reduced motion.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionReduced, onPrefsChange } from '../lib/prefs';

gsap.registerPlugin(ScrollTrigger);

let mm: gsap.MatchMedia | null = null;

const GROUPS = '.card-grid, .path-cards, .bento, .faq, .scene-steps, .checklist, .steps, .settings, .explorer, .timeline, .stages, .play-scopes, .play-controls, .btn-row';
const SKIP = 'script, style, template, noscript, .sr-only, [data-reveal], .scene-stage, .hero, .page-head';

function collect(el: Element, out: HTMLElement[]) {
  if (el.tagName === 'ASTRO-ISLAND' || el.tagName === 'ASTRO-SLOT') {
    Array.from(el.children).forEach((c) => collect(c, out));
    return;
  }
  if (el.matches(SKIP) || el.closest('[data-reveal]')) return;
  if (el.matches(GROUPS)) {
    Array.from(el.children).forEach((c) => { if (!c.matches(SKIP)) out.push(c as HTMLElement); });
    return;
  }
  // Containers that hold a group are split up, so the group's items reveal one by one.
  if (el.querySelector(GROUPS) && el.children.length) {
    Array.from(el.children).forEach((c) => collect(c, out));
    return;
  }
  out.push(el as HTMLElement);
}

function autoReveal() {
  const wide = window.matchMedia('(min-width: 56rem)').matches;
  const items: HTMLElement[] = [];
  document.querySelectorAll('main .section > .container').forEach((c) => {
    // The pinned product scene animates itself on wide screens.
    if (wide && c.closest('.scene')) {
      c.querySelectorAll(':scope > :not(.scene-grid)').forEach((x) => collect(x, items));
      return;
    }
    Array.from(c.children).forEach((x) => collect(x, items));
  });
  // Content already on screen when the page loads stays put, so it is never hidden
  // while the page is still loading.
  const fold = window.innerHeight * 0.92;
  const list = Array.from(new Set(items)).filter((el) => el.getClientRects().length && el.getBoundingClientRect().top > fold);
  if (!list.length) return;
  gsap.set(list, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(list, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: 0.07, overwrite: true,
      clearProps: 'transform,opacity,visibility',
    }),
  });
}

function setup() {
  mm?.revert();
  mm = gsap.matchMedia();
  mm.add({ reduce: '(prefers-reduced-motion: reduce)' }, () => {
    if (motionReduced()) return;

    // Sections and groups that enter once (Chunking): 30 to 80 ms staggers.
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      const targets = el.dataset.reveal === 'stagger' ? Array.from(el.children) : el;
      gsap.from(targets, {
        autoAlpha: 0,
        y: 24,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // Real figures count up once when they enter view (the final value is in the HTML).
    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      const end = Number(el.dataset.count);
      if (!Number.isFinite(end)) return;
      const fmt = new Intl.NumberFormat('en-US');
      const state = { v: 0 };
      el.textContent = '0';
      gsap.to(state, {
        v: end,
        duration: end > 1000 ? 1.4 : 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = fmt.format(Math.round(state.v)); },
        onComplete: () => { el.textContent = fmt.format(end); },
      });
    });

    // Everything else in the page's sections fades up as it scrolls into view, in
    // small batches. Groups (card grids, lists, FAQs) reveal item by item.
    autoReveal();

    // Page titles ease in on load.
    const head = document.querySelectorAll('.page-head h1, .page-head .lead');
    if (head.length) gsap.from(head, { y: 16, duration: 0.5, ease: 'power2.out', stagger: 0.08 });

    // Card icons pop in with their group.
    gsap.utils.toArray<HTMLElement>('[data-reveal="stagger"]').forEach((group) => {
      const icons = group.querySelectorAll('.card__icon');
      if (!icons.length) return;
      gsap.from(icons, {
        scale: 0.5, rotate: -20, duration: 0.6, ease: 'back.out(2.5)', stagger: 0.07,
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });

    // Build timeline: step markers pop and photos drift slightly as you scroll.
    gsap.utils.toArray<HTMLElement>('.stage').forEach((stage) => {
      const marker = stage.querySelector('.stage__marker');
      if (marker) gsap.from(marker, { scale: 0.4, duration: 0.6, ease: 'back.out(3)', scrollTrigger: { trigger: stage, start: 'top 80%', once: true } });
      const img = stage.querySelector('.stage__media:not(.stage__media--contain) img');
      if (img) gsap.fromTo(img, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Connecting lines that fill as you move through a sequence (Uniform Connectedness).
    gsap.utils.toArray<HTMLElement>('[data-line-fill]').forEach((fill) => {
      const root = fill.closest<HTMLElement>('[data-line-root]') ?? fill.parentElement!;
      gsap.fromTo(fill, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top 65%', end: 'bottom 65%', scrub: true },
      });
    });
  });
}

setup();
onPrefsChange(setup);

// Expandable sections (troubleshooting answers, code previews) slide open and
// closed. The answer stays in the HTML; only the height and opacity animate.
document.querySelectorAll<HTMLDetailsElement>('details').forEach((d) => {
  const summary = d.querySelector(':scope > summary');
  if (!summary) return;
  summary.addEventListener('click', (e) => {
    if (motionReduced()) return;
    e.preventDefault();
    const body = Array.from(d.children).filter((c) => c.tagName !== 'SUMMARY');
    gsap.killTweensOf(body);
    if (!d.open || d.classList.contains('is-closing')) {
      d.classList.remove('is-closing');
      d.open = true;
      gsap.fromTo(body, { height: 0, autoAlpha: 0, overflow: 'hidden' }, {
        height: 'auto', autoAlpha: 1, duration: 0.35, ease: 'power2.out',
        clearProps: 'height,opacity,visibility,overflow',
      });
    } else {
      d.classList.add('is-closing');
      gsap.to(body, {
        height: 0, autoAlpha: 0, overflow: 'hidden', duration: 0.3, ease: 'power2.inOut',
        onComplete: () => {
          d.open = false;
          d.classList.remove('is-closing');
          gsap.set(body, { clearProps: 'height,opacity,visibility,overflow' });
        },
      });
    }
  });
});
