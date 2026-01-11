# Project Context

## Purpose
- Build a personal blog that showcases long-form writing, technical notes, and lifestyle updates in both Simplified Chinese and English.
- Prioritize a polished reading experience that mirrors the Hugo Blowfish demo (hero section, featured articles, rich typography, dark/light toggle).
- Keep publishing frictionless so new posts can be drafted and deployed via simple Markdown files and a single Hugo build command.

## Tech Stack
- **Hugo Extended ≥ 0.134** for static-site generation, Markdown content rendering, and SCSS asset pipelines.
- **Blowfish theme** referenced as a Git submodule (https://github.com/nunocoracao/blowfish) so upstream updates can be pulled without copying.
- **Node.js ≥ 20 & npm** for auxiliary tooling (OpenSpec CLI, linting, potential Tailwind/ESBuild hooks).
- **OpenSpec CLI** to drive spec-first planning and validation of changes.
- **GitHub Actions / GitHub Pages** as the default CI/CD target (swap to Cloudflare/Netlify later if hosting requirements change).

## Project Conventions

### Code Style
- Hugo configuration lives in `hugo.toml` with snake_case keys and inline comments kept to a minimum; per-environment overrides go under `config/_default/`.
- Content files use Markdown with TOML front matter; required front matter keys: `title`, `date`, `summary`, `tags`, `categories`, `draft`.
- Custom SCSS follows BEM-inspired naming (`.bf-card__title`) and is compiled via Hugo Pipes; prefer variables defined in `assets/scss/_variables.scss`.
- Copy and UI strings should default to Simplified Chinese with optional English translations via Hugo i18n files.

### Architecture Patterns
- Treat Blowfish as the base theme and override via Hugo’s lookup order (`layouts/partials`, `layouts/_default`, `assets/`); avoid editing theme files directly.
- Use Hugo Modules (or theme submodule) to manage the theme and any future component libraries.
- Organize content into language folders (`content/zh/`, `content/en/`) with shared taxonomies.
- Keep structured metadata (social links, hero cards, resume info) in `data/*.yaml` for easier reuse across templates.
- Provide npm scripts (`npm run dev`, `npm run build`) that wrap `hugo server` and `hugo --gc --minify` so contributors have a consistent entry point.

### Testing Strategy
- Local preview: `hugo server --buildDrafts --disableFastRender --baseURL http://localhost:1313` to catch template or CSS regressions.
- Production check: `hugo --gc --minify --enableGitInfo` before every commit/PR; the command must finish without warnings.
- Content linting (future): add `markdownlint` + `textlint` npm scripts for drafts; keep placeholders in spec until tooling is added.
- Non-automated QA: smoke-test dark/light modes, mobile menu, code blocks, and bilingual navigation before publishing.
- Run `openspec validate --strict` whenever specs or proposals change.

### Git Workflow
- Default branch: `main` (protected). Feature work happens on `feature/<change-id>` branches where `<change-id>` matches the OpenSpec change directory.
- Commit messages follow Conventional Commits (`feat(theme): add custom hero`) so release notes can be auto-generated later.
- Every non-trivial change starts with an approved OpenSpec proposal; implementation cannot begin until reviewers sign off.
- Rebase feature branches before opening PRs to keep history linear.

## Domain Context
- Blog focuses on software engineering, personal productivity, and travel photography; expect frequent code snippets, diagrams, and bilingual prose.
- Needs built-in components for featured articles, tag clouds, rich galleries, and “uses”/“about” pages similar to Blowfish’s presets.
- Audience is primarily desktop/laptop readers in Mainland China, so fonts should degrade gracefully when Google Fonts are blocked.
- Future integrations may include privacy-friendly analytics (Plausible/Umami) and a contact form powered by Formspree or StaticForms.

## Important Constraints
- Output must remain a static site—no server-side runtimes or client-side frameworks beyond what Hugo/Blowfish ships with.
- Pages should pass core web vitals (LCP < 2.5s on 4G, CLS < 0.1) and deliver optimized images (WebP/AVIF, <1 MB each).
- All textual content must be accessible offline-friendly (progressive enhancement) and support dark/light themes.
- Keep build times under 60 seconds on GitHub Actions runners; avoid heavyweight npm dependencies.
- Respect OpenSpec workflow: proposals + tasks -> validation -> implementation -> archive; never bypass the checklist.
- Prefer MIT-compatible assets and avoid embedding third-party trackers without explicit consent.

## External Dependencies
- Hugo Extended binaries from https://github.com/gohugoio/hugo/releases (vendor via script or `brew` in CI).
- Blowfish theme repository (https://github.com/nunocoracao/blowfish), pinned to a tag for reproducibility and pulled as a submodule.
- Node.js 20.x runtime plus npm for OpenSpec CLI (`openspec`), linting, and potential asset tooling.
- Optional services: GitHub Pages (deployment), GitHub Actions (CI), privacy-friendly analytics provider (TBD), StaticForms/Formspree for contact forms.
