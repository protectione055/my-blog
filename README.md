# Hugo + Blowfish Bilingual Blog

A personal site that pairs [Hugo](https://gohugo.io/) with the [Blowfish theme](https://github.com/nunocoracao/blowfish) to publish Chinese/English longform writing, travel logs, and engineering notes. The project follows the OpenSpec workflow (`openspec/project.md`) so every feature begins with a proposal and spec changes.

## Requirements

- Hugo **Extended** v0.152+ (`hugo version` should report `extended`)
- Node.js 20+ / npm 10+
- Git Submodules enabled (Blowfish is checked out into `themes/blowfish`)

## Quick Start

```bash
npm install
npm run dev
```

The dev script runs `hugo server --buildDrafts --disableFastRender` and binds to `0.0.0.0:1313` for easier LAN previews. Content lives in `content/zh` and `content/en` with shared taxonomies.

## Build & Preview

- `npm run build` — production build with `hugo --gc --minify --enableGitInfo`
- `npm run preview` — production environment server for spot checks
- `npm run spec:validate` — `openspec validate --strict` (run before opening PRs)

Artifacts are static files under `public/`. Deploy them to GitHub Pages, Cloudflare Pages, or any CDN.

## Content & Customization

- `data/*.yaml` holds profile, hero, social, and featured-card metadata.
- `content/zh/_index.md` and `content/en/_index.md` define the copy that appears inside the Blowfish **background** homepage layout.
- `assets/img/background.svg` and `assets/img/featured.svg` are the gradient resources that feed default hero/featured images when no post image is provided.
- `assets/scss/custom.scss` and `assets/js/main.js` extend Blowfish via Hugo Pipes.
- `static/images/placeholders/*.svg` are lightweight placeholder illustrations; replace them with photography or artwork when ready.
- Use the `math` front-matter flag (planned in OpenSpec change `add-latex-rendering`) to toggle KaTeX once implemented.

## OpenSpec Workflow

1. Create a change under `openspec/changes/<change-id>/` with proposal, tasks, and spec delta files.
2. Run `openspec validate <change-id> --strict` and get approval **before** coding.
3. Implement tasks sequentially, keeping specs and README up to date.
4. Archive the change after deployment to merge requirements into canonical specs.

## Deployment Notes

A minimal GitHub Actions workflow can run `npm install && npm run build` and publish `public/` to GitHub Pages. Until CI is configured, run the build locally and upload the generated directory to your hosting provider.
