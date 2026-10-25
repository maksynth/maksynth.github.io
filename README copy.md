# MAK Synth website

A static, multi-page information hub for the MAK Synth educational synthesizer kit.
Pure HTML, CSS, and a small amount of progressive-enhancement JavaScript. No build
step is required to host it.

## Pages
- `/` Home
- `/about` About the project
- `/how-it-works` How the instrument works (signal chain, controls, waveforms)
- `/process` The build, prototype by prototype
- `/setup` Setup guide, requirements, and troubleshooting
- `/downloads` The Arduino firmware and SuperCollider engine files
- `404`, `500`, `503` error pages

## Preview locally
From this folder:

    python3 -m http.server 8000

Then open `http://localhost:8000`. Clean URLs such as `/about` resolve to
`about/index.html` on real static hosts; locally you can open `/about/`.

## Deploy on GitHub Pages (maksynth.com)
This build is configured for GitHub Pages with the custom domain `maksynth.com`.

1. Create a GitHub repository and push the entire contents of this folder to the
   root of the branch GitHub Pages serves (usually `main`).
2. In the repository, go to Settings, then Pages. Under "Build and deployment,"
   set Source to "Deploy from a branch," pick that branch and the `/ (root)`
   folder, and save.
3. The included `CNAME` file sets the custom domain to `maksynth.com`. Confirm it
   appears under Settings, then Pages, as the custom domain.
4. At your DNS provider, point the domain at GitHub Pages:
   - Apex `maksynth.com`: four A records to `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (and optionally the matching AAAA
     records for IPv6).
   - `www.maksynth.com`: a CNAME record to `<your-username>.github.io`.
5. Back in Settings, then Pages, tick "Enforce HTTPS" once the certificate has
   been issued (this can take a little while after the DNS records resolve).

Notes specific to GitHub Pages:
- GitHub Pages serves directory URLs with a trailing slash, so the pages live at
  `/about/`, `/setup/`, and so on. The links, canonical tags, and sitemap already
  use that form.
- GitHub Pages cannot set custom HTTP headers, so the Content-Security-Policy and
  referrer policy are applied through `<meta>` tags in each page instead. HTTPS and
  caching are handled by GitHub.
- `.nojekyll` tells GitHub Pages to serve the files as-is without Jekyll
  processing.

## Editing content
- Text lives directly in each page's `index.html`.
- Shared styles are in `assets/css/styles.css`. Colors, spacing, and the corner
  radius scale are defined as CSS variables at the top.
- The display font is Synthek (titles) and the body font is IBM Plex Sans, both
  self-hosted in `assets/fonts/`.
- If you change the inline structured-data (`application/ld+json`) blocks, update
  the matching `sha256` hashes in the Content-Security-Policy `<meta>` tag (the
  `script-src` list) in each page's `<head>`.

## Before launch
Fill in the `TEAM` and `THANKS` sections of `humans.txt`, submit `sitemap.xml` to
Google Search Console and Bing, and run PageSpeed Insights on the live URL.
