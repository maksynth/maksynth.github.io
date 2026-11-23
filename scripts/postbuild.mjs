// Post-build, for every page:
// 1. Marks brand and product names in visible text with translate="no", so browser
//    translation leaves them unchanged.
// 2. Adds a hash-based Content-Security-Policy meta tag.
// GitHub Pages cannot send response headers, so the policy ships in the HTML. Every
// inline script is allowed by its SHA-256 hash; everything else must come from this
// site. Inline styles stay allowed because the interactive components set CSS custom
// properties through style attributes.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const BRANDS = /\b(MAK SYNTH|SuperCollider|Arduino IDE|Arduino)\b/g;
const SKIP = ['script', 'style', 'code', 'pre', 'svg', 'title', 'head', 'textarea', 'astro-island'];
// Island markup is left alone so React hydration matches; islands mark brands themselves.

function protectBrands(html) {
  const parts = html.split(/(<[^>]+>)/g);
  const depth = Object.fromEntries(SKIP.map((t) => [t, 0]));
  let inBrandSpan = 0;
  return parts.map((part) => {
    if (part.startsWith('<')) {
      const m = part.match(/^<(\/?)([a-zA-Z0-9-]+)/);
      if (m) {
        const tag = m[2].toLowerCase();
        if (SKIP.includes(tag) && !part.endsWith('/>')) depth[tag] += m[1] ? -1 : 1;
        if (!m[1] && /translate="no"/.test(part) && tag === 'span') inBrandSpan++;
        else if (m[1] && tag === 'span' && inBrandSpan > 0) inBrandSpan--;
      }
      return part;
    }
    if (inBrandSpan > 0 || SKIP.some((t) => depth[t] > 0)) return part;
    return part.replace(BRANDS, '<span translate="no">$1</span>');
  }).join('');
}

const scriptRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

for (const file of await htmlFiles(dist)) {
  let html = protectBrands(await readFile(file, 'utf8'));
  const hashes = new Set();
  for (const [, attrs, body] of html.matchAll(scriptRe)) {
    if (/type=["']?application\/ld\+json/i.test(attrs)) continue; // data, never executed
    if (!body.trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  const policy = [
    "default-src 'self'",
    `script-src 'self' ${[...hashes].join(' ')}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, '');
  html = html.replace(/<meta charset="utf-8"\s*\/?>/i, (m) => `${m}<meta http-equiv="Content-Security-Policy" content="${policy}">`);
  await writeFile(file, html);
  console.log(`postbuild: ${file.replace(dist, '')} (${hashes.size} inline script hashes)`);
}
