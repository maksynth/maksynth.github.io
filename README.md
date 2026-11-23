# MAK SYNTH website

The site for MAK SYNTH, a synthesizer kit for learning sound synthesis and electronics. It is a static Astro site with a few React islands, hosted on GitHub Pages at maksynth.com.

## Pages

| Path | What it holds |
|---|---|
| `/` | Product showcase: hero with the moving wave, a pinned scroll scene, a playable browser synth, specs |
| `/how-it-works` | The signal path, the six knobs (open one to try it), the five waveforms |
| `/process` | The build, from concept renders to the finished kit |
| `/setup` | Setup checklist and steps, with progress and a Windows or macOS choice |
| `/downloads` | The ZIP with the firmware and sound engine, with code previews |
| `/about` | The story and the disciplines behind the project |
| `/accessibility` | Display settings and the accessibility statement |

## Working on it

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # writes the site to dist/
```

`npm run build` runs `astro build`, then `scripts/postbuild.mjs`, which marks brand names with `translate="no"` and adds a hash-based Content-Security-Policy to every page (GitHub Pages can't send security headers).

## Deploying

1. Push this folder to a GitHub repository.
2. In the repository, open Settings, then Pages, and set Source to GitHub Actions.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and publishes the site.
4. Under Settings, then Pages, set the custom domain to `maksynth.com` and turn on Enforce HTTPS once the certificate is ready.

DNS for the apex domain: four `A` records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`, plus a `CNAME` record for `www` pointing to your GitHub Pages host (for example `username.github.io`).

## Where things live

- `src/pages/` holds one file per page. Page copy lives in these files.
- `src/components/` holds the site components. `src/components/reactbits/` holds React Bits components (official sources, adapted to the site's design rules; each file notes what changed).
- `src/lib/synthMap.ts` holds the six controls and their engine ranges, matching `synthFile.scd`.
- `public/assets/downloadables/` holds the download: `synthFiles.zip`, plus the unzipped `synthFile.scd` and `synthFile/synthFile.ino` that the downloads page previews. When you change the files, replace all three.
- `.app-standards.json` records the design decisions and the two approved exceptions (the gradient wave and the Lucide sun and moon icons).

## Credits

Components from React Bits (MIT plus Commons Clause), animation by GSAP, smooth scrolling by Lenis, icons from Font Awesome Free (icons CC BY 4.0, code MIT). Fonts: Synthek (the MAK SYNTH brand font) and IBM Plex Sans (SIL Open Font License).
