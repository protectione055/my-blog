## ADDED Requirements

### Requirement: Hugo Multilingual Base
The repository SHALL contain a Hugo Extended site initialized in the root with multilingual configuration for Simplified Chinese (`zh`) and English (`en`), shared taxonomies, and language-specific `content/<lang>/` trees.

#### Scenario: Hugo version and config
- **WHEN** a contributor runs `hugo version`
- **THEN** the output shows the Extended build and at least the minimum version documented in project.md.
- **AND WHEN** they inspect `hugo.toml`
- **THEN** it declares multiple languages with `defaultContentLanguage = "zh"` and per-language settings.

### Requirement: Blowfish Theme Integration
The Blowfish theme MUST be added via Hugo Modules or git submodule pinned to a released tag, with overrides stored under `layouts/` and `assets/` in this repo (never editing the upstream copy).

#### Scenario: Theme module available
- **WHEN** `hugo mod graph` (or `git submodule status`) runs
- **THEN** it lists Blowfish at the expected tag/commit.
- **AND WHEN** the site builds
- **THEN** Blowfish layouts load while local overrides take precedence where provided.

### Requirement: Starter Content & Taxonomies
The scaffold SHALL include sample posts, about/uses pages, and taxonomy landing pages in both languages so navigation, hero cards, and featured sections render without additional authoring.

#### Scenario: Sample content renders
- **WHEN** `hugo server` starts on a clean clone
- **THEN** the home page displays at least two featured posts (one per language) plus working About/Uses links and populated tag/category pages.

### Requirement: Tooling & Documentation
The repository MUST include npm scripts for `dev`, `build`, and `spec:validate`, a README explaining setup/deploy steps, and configuration files such as `.gitignore`, `.editorconfig`, and (optionally) GitHub Actions workflow for CI/CD.

#### Scenario: Contributor onboarding
- **WHEN** a new contributor runs `npm install && npm run dev`
- **THEN** the Hugo dev server starts with instructions from README.
- **AND WHEN** they run `npm run spec:validate`
- **THEN** it executes `openspec validate --strict` without manual arguments.
