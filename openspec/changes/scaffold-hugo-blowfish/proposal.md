# Change: Scaffold Hugo + Blowfish Blog

## Why
The repository is empty; we need a working Hugo project with the Blowfish theme, bilingual content structure, npm tooling, and documentation before any feature (e.g., LaTeX support) can be implemented. A clear scaffold ensures future OpenSpec changes have a stable baseline.

## What Changes
- Initialize a Hugo Extended site in the repo root, configure multilingual support (zh/en), and wire Blowfish as a git submodule via Hugo Modules.
- Set up config files (`hugo.toml`, `config/_default/*.toml`) that capture branding, menus, taxonomy, and theme params matching the desired Blowfish demo look.
- Add npm toolchain (package.json, lockfile) with scripts for `dev`, `build`, `lint`, and OpenSpec validation helpers.
- Provide starter content: about/uses pages, example posts, and taxonomy pages with bilingual versions.
- Document local development, deployment (GitHub Pages), and contribution workflow in README along with assets such as `.gitignore` and `.editorconfig`.

## Impact
- Affected specs: site-foundation
- Affected code: repository root (Hugo config, content, assets), `themes/` or module cache, `package.json`, README, npm scripts, CI templates
