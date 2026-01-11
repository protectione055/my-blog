## 1. Environment Setup
- [ ] 1.1 Install Hugo Extended binary and verify `hugo version` matches requirement.
- [ ] 1.2 Add Blowfish theme via Hugo Modules or git submodule pinned to a tag.

## 2. Project Structure
- [ ] 2.1 Run `hugo new site .` (without overwriting existing OpenSpec files) and add `.gitignore`, `.editorconfig`.
- [ ] 2.2 Configure `hugo.toml` plus `config/_default/{languages,menus,params}.toml` for zh/en, site metadata, hero, and navigation.
- [ ] 2.3 Create `data/` entries for profile, social links, featured cards aligned with Blowfish features.

## 3. Content & Assets
- [ ] 3.1 Author sample posts (zh/en) plus `about`, `uses`, `projects` pages demonstrating archetypes and multilingual URLs.
- [ ] 3.2 Set up taxonomy pages (tags, categories) and list templates as needed.
- [ ] 3.3 Add custom assets directory (`assets/scss`, `assets/js`) with placeholder overrides ready for future customization.

## 4. Tooling & Docs
- [ ] 4.1 Create `package.json` with scripts (`dev`, `build`, `preview`, `spec:validate`) and add lint stubs.
- [ ] 4.2 Document local dev + deploy instructions in README, including Hugo/Node requirements.
- [ ] 4.3 Verify `npm run build` succeeds and optionally scaffold GitHub Actions workflow for deployment.
- [ ] 4.4 Run `openspec validate scaffold-hugo-blowfish --strict` before requesting review.
