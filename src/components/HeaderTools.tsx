// Navbar icon buttons: the theme toggle and, on small screens, the menu button.
// Both are named by a tooltip (React Bits Warm Tooltip, shared group so the second
// tooltip opens instantly once one has been shown).
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '../lib/fa';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
// Line-style sun and moon for the theme toggle, as the user asked. Font Awesome Free has
// no line sun, so these two come from Lucide (ISC license), imported by name.
import { Sun, Moon } from 'lucide-react';
import { WarmTooltipGroup } from './reactbits/WarmTooltip';
import Tip from './Tip';
import { getTheme, setTheme, onPrefsChange, motionReduced, type Theme } from '../lib/prefs';

export default function HeaderTools() {
  // Dark is the default theme, so the server renders the "switch to light" state.
  const [theme, setThemeState] = useState<Theme>('dark');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setThemeState(getTheme());
    return onPrefsChange(() => setThemeState(getTheme()));
  }, []);

  useEffect(() => {
    const nav = document.getElementById('mobile-nav');
    if (!nav) return;
    document.documentElement.classList.toggle('nav-open', menuOpen);
    // Open: show the list, then add the class on the next frame so it slides down.
    // Close: slide it back up, then hide it so it leaves the tab order.
    let timer = 0;
    let frame = 0;
    if (menuOpen) {
      nav.hidden = false;
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => nav.classList.add('is-open')); });
    } else {
      nav.classList.remove('is-open');
      if (motionReduced()) nav.hidden = true;
      else timer = window.setTimeout(() => { if (!nav.classList.contains('is-open')) nav.hidden = true; }, 320);
      return () => window.clearTimeout(timer);
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    const wide = window.matchMedia('(min-width: 56rem)');
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const themeLabel = next === 'light' ? 'Switch to light mode' : 'Switch to dark mode';
  const menuLabel = menuOpen ? 'Close menu' : 'Open menu';

  return (
    <WarmTooltipGroup>
      <div className="header-tools">
        <Tip text={themeLabel} side="bottom">
          <button type="button" className="icon-btn theme-toggle" aria-label={themeLabel} onClick={() => setTheme(next)}>
            <Sun className="i-sun lucide-icon" aria-hidden="true" strokeWidth={1.75} />
            <Moon className="i-moon lucide-icon" aria-hidden="true" strokeWidth={1.75} />
          </button>
        </Tip>
        <Tip text={menuLabel} side="bottom">
          <button
            ref={menuBtn}
            type="button"
            className="icon-btn menu-btn"
            aria-label={menuLabel}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <FontAwesomeIcon icon={faBars} className="i-open" />
            <FontAwesomeIcon icon={faXmark} className="i-close" />
          </button>
        </Tip>
      </div>
    </WarmTooltipGroup>
  );
}
