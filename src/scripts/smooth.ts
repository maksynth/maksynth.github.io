// Lenis smooth scrolling, mounted only on the home page (an Apple-style product
// showcase). Driven by the GSAP ticker so pinned and scrubbed scenes stay in sync.
// Off when the device or the site asks for reduced motion; scrolling is then native.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionReduced, onPrefsChange } from '../lib/prefs';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
const tick = (time: number) => lenis?.raf(time * 1000);

function start() {
  if (lenis || motionReduced()) return;
  lenis = new Lenis({
    autoRaf: false,
    anchors: { offset: -72 },
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

function stop() {
  if (!lenis) return;
  gsap.ticker.remove(tick);
  lenis.destroy();
  lenis = null;
}

start();
onPrefsChange(() => (motionReduced() ? stop() : start()));
