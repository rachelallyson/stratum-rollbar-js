# Documentation site (GitHub Pages)

The docs are built with [Nextra](https://nextra.site) and deployed to **GitHub Pages** when you push to `main` (or trigger the workflow manually).

## Local development

```bash
# Install root deps (if needed)
npm install
npm run build

# Install docs deps (one-time)
cd docs && npm install && cd ..

# Start dev server
npm run docs:dev
```

Open <http://localhost:3000>. For production-style base path (e.g. `/stratum-rollbar-js`), run with:

```bash
BASE_PATH=/stratum-rollbar-js npm run docs:dev
```

(from the `docs` folder, or set in `docs/.env.local`).

## Build static site

```bash
npm run docs:build
```

Output is in `docs/out/`. The GitHub Actions workflow runs this with `BASE_PATH=/stratum-rollbar-js` and uploads `docs/out` as the GitHub Pages artifact.

## Enabling GitHub Pages

1. In the repo: **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main` (or run the "Deploy Docs" workflow). The site will be at `https://<username>.github.io/stratum-rollbar-js/`.

## Content

- **Source**: `docs/content/` — MDX files and `_meta.json` for sidebar order.
- **Structure**: `index.mdx`, `installation.mdx`, `guides/*.mdx`, `reference/*.mdx`.

Edit the `.mdx` files and push (or run the workflow) to update the live site.

## Search

Search is powered by [Pagefind](https://pagefind.app) and indexes the built HTML. It **works on the deployed GitHub Pages site** and when serving the production build locally.

- **Deployed site**: After the workflow runs, the `postbuild` script indexes `docs/out` and writes `out/_pagefind/`, which is included in the artifact. The search script is loaded from `/_pagefind/pagefind.js` (with base path when using `BASE_PATH`).
- **Local dev** (`npm run docs:dev`): Search returns 404 until the Pagefind bundle is in `public/_pagefind`. To enable search in dev: run `npm run docs:build` once (creates `docs/out/` and `docs/out/_pagefind/`), then from the repo root run `cd docs && npm run dev:with-search`. That runs `index:search` (which copies the index from `out/` to `public/_pagefind`) and starts the dev server so `/_pagefind/pagefind.js` is served.
