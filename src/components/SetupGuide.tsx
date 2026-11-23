// Setup guide: a checklist of what you need, the four steps with "mark done" checks
// (React Bits Spring Check), real progress (Goal-Gradient), and a Windows or macOS
// choice (React Bits Rubber Segment) kept in the URL so the view survives a refresh.
// Progress is remembered in this browser only, as a convenience.
import { useEffect, useState, type ReactNode } from 'react';
import SpringCheck from './reactbits/SpringCheck';
import RubberSegment from './reactbits/RubberSegment';
import { FontAwesomeIcon } from '../lib/fa';
import { faDownload, faArrowUpRightFromSquare, faCircleCheck } from '@fortawesome/free-solid-svg-icons';

type OS = 'windows' | 'macos' | null;
const KEY = 'mak-setup';
const ZIP = '/assets/downloadables/synthFiles.zip';

const NEEDS: { label: ReactNode; key: string; link?: { href: string; text: ReactNode } }[] = [
  { key: 'controller', label: 'Your assembled controller and a USB cable' },
  { key: 'computer', label: 'A computer running Windows or macOS' },
  { key: 'arduino', label: <>The <span translate="no">Arduino IDE</span>, installed</>, link: { href: 'https://www.arduino.cc/en/software', text: <>Get the <span translate="no">Arduino IDE</span></> } },
  { key: 'supercollider', label: <><span translate="no">SuperCollider</span> 3.14 or newer, installed</>, link: { href: 'https://supercollider.github.io/', text: <>Get <span translate="no">SuperCollider</span></> } },
];

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ext-icon" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function SetupGuide() {
  const [os, setOs] = useState<OS>(null);
  const [have, setHave] = useState<boolean[]>([false, false, false, false]);
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get('os');
    if (fromUrl === 'windows' || fromUrl === 'macos') setOs(fromUrl);
    else {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
      const platform = nav.userAgentData?.platform || navigator.platform || '';
      setOs(/mac/i.test(platform) ? 'macos' : 'windows');
    }
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved?.have?.length === 4) setHave(saved.have);
      if (saved?.done?.length === 4) setDone(saved.done);
    } catch { /* storage unavailable or empty */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ have, done })); } catch { /* storage unavailable */ }
  }, [have, done, loaded]);

  const chooseOs = (v: string) => {
    const next = v as Exclude<OS, null>;
    setOs(next);
    const url = new URL(location.href);
    url.searchParams.set('os', next);
    history.replaceState(history.state, '', url);
  };

  const count = done.filter(Boolean).length;
  const mac = os === 'macos';
  const win = os === 'windows';
  const shortcut = mac ? <><kbd>⌘</kbd> + <kbd>Return</kbd></> : win ? <><kbd>Ctrl</kbd> + <kbd>Enter</kbd></> : <><kbd>Ctrl</kbd> + <kbd>Enter</kbd> (<kbd>⌘</kbd> + <kbd>Return</kbd> on a Mac)</>;
  const port = mac ? 'a port named usbmodem or usbserial' : win ? 'a COM port, such as COM3' : 'a COM port on Windows, or a usbmodem or usbserial port on macOS';
  const osName = mac ? 'macOS' : win ? 'Windows' : 'Windows or macOS';

  const toggle = (list: boolean[], set: (v: boolean[]) => void, i: number, v: boolean) => {
    const n = list.slice(); n[i] = v; set(n);
  };

  const steps = [
    {
      title: 'Download and unzip the files',
      body: (
        <>
          <p>One ZIP file holds both parts: <code translate="no">synthFile.ino</code>, the controller firmware, inside a <code translate="no">synthFile</code> folder as the <span translate="no">Arduino IDE</span> expects, and <code translate="no">synthFile.scd</code>, the sound engine. Unzip it somewhere you can find it.</p>
          <div className="btn-row">
            <a className="btn btn--secondary" href={ZIP} download><FontAwesomeIcon icon={faDownload} />Download the synth files (ZIP)</a>
          </div>
        </>
      ),
    },
    {
      title: 'Flash the controller',
      body: (
        <p>Open <code translate="no">synthFile.ino</code> from the <code translate="no">synthFile</code> folder in the <span translate="no">Arduino IDE</span> and connect the controller with a USB cable. Under <strong>Tools</strong>, choose your board and its port ({port}), then click <strong>Upload</strong>. When the IDE says “Done uploading,” the controller is ready.</p>
      ),
    },
    {
      title: 'Start the sound engine',
      body: (
        <>
          <p>Open <code translate="no">synthFile.scd</code> in <span translate="no">SuperCollider</span>, click inside the code and press {shortcut} to run it. The audio server starts and a full-screen window opens. Check that the OS selector at the top shows {osName}; it picks your system on its own. The status reads CONNECTED once the engine finds your controller.</p>
          <figure className="step__media">
            <img src="/img/synth-in-use-800.webp" srcSet="/img/synth-in-use-480.webp 480w, /img/synth-in-use-800.webp 800w" sizes="(min-width: 40rem) 32rem, 80vw" width={800} height={599} loading="lazy" decoding="async" alt="The sound engine running on screen while a hand plays the MAK SYNTH keys." />
          </figure>
        </>
      ),
    },
    {
      title: 'Play and shape the sound',
      body: (
        <p>Press the keys to play notes and turn the knobs to shape the sound. The top row of the engine window sets the waveform and octave, and the oscilloscope, spectrum analyzer, and envelope graph that update as you play.</p>
      ),
    },
  ];

  return (
    <div className="setup-layout">
      <section className="panel" aria-labelledby="needs-title">
        <h2 id="needs-title">Before you start, make sure you have the following:</h2>
        <ul className="checklist">
          {NEEDS.map((n, i) => (
            <li key={n.key}>
              <SpringCheck
                label={n.label}
                checked={have[i]}
                onChange={(v) => toggle(have, setHave, i, v)}
                color="var(--ink)"
                fillColor="var(--ink)"
                checkColor="var(--on-ink)"
                boxSize={24}
                boxRadius={8}
                fontSize={17}
                doneOpacity={0.75}
                strike="none"
              />
              {n.link && <span className="hint"><Ext href={n.link.href}>{n.link.text}</Ext></span>}
            </li>
          ))}
        </ul>
      </section>

      <div className="setup-tools">
        <div className="progress">
          <div className="progress__label" id="progress-label">
            <span>Your progress</span>
            <span>{count} of 4 steps done</span>
          </div>
          <div className="progress__track" role="progressbar" aria-labelledby="progress-label" aria-valuemin={0} aria-valuemax={4} aria-valuenow={count} aria-valuetext={`${count} of 4 steps done`}>
            <div className="progress__bar" style={{ transform: `scaleX(${count / 4})` }} />
          </div>
        </div>
        <div className="os-pick">
          <span className="play-field__label">Your computer</span>
          <RubberSegment
              trackColor="var(--surface-3)"
              thumbColor="var(--ink)"
              textColor="var(--ink)"
              activeTextColor="var(--on-ink)"
              radius={14}
            items={[{ value: 'windows', label: 'Windows' }, { value: 'macos', label: 'macOS' }]}
            value={os ?? 'windows'}
            onChange={chooseOs}
            size="lg"
            aria-label="Your computer"
          />
        </div>
      </div>

      <ol className="steps" aria-label="Setup steps">
        {steps.map((s, i) => (
          <li key={s.title} className={`step${done[i] ? ' is-done' : ''}`}>
            <span className="step__num" aria-hidden="true">{i + 1}</span>
            <div className="step__body">
              <h3>{s.title}</h3>
              {s.body}
              <div className="step__done">
                <SpringCheck
                  label={done[i] ? 'Done' : 'Mark this step done'}
                  ariaLabel={`${done[i] ? 'Done' : 'Mark this step done'}: ${s.title}`}
                  checked={done[i]}
                  onChange={(v) => toggle(done, setDone, i, v)}
                  color="var(--ink)"
                  fillColor="var(--ink)"
                  checkColor="var(--on-ink)"
                  boxSize={24}
                  boxRadius={8}
                  fontSize={16}
                  doneOpacity={1}
                  strike="none"
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      {count === 4 && (
        <p className="setup-done" role="status">
          <FontAwesomeIcon icon={faCircleCheck} />
          Your <span translate="no">MAK SYNTH</span> is set up. Press a key and start playing.
        </p>
      )}
      {(count > 0 || have.some(Boolean)) && (
        <button type="button" className="btn btn--secondary btn--small" onClick={() => { setHave([false, false, false, false]); setDone([false, false, false, false]); }}>
          Clear my checklist
        </button>
      )}
    </div>
  );
}
