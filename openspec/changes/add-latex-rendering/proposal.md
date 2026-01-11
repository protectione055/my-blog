# Change: Add LaTeX Rendering Support

## Why
Blog articles need to display mathematical notation cleanly. Today Markdown posts render plain text, which makes technical notes unreadable and pushes authors to embed screenshots. We need built-in math rendering that matches Blowfish styling.

## What Changes
- Bundle KaTeX (CSS + JS) via Hugo Pipes and load it only on pages that declare math support in front matter.
- Extend markdown rendering pipeline to detect `$...$` and `$$...$$` blocks and emit KaTeX-compatible markup.
- Expose authoring guidance (front-matter toggle, shortcode) and document usage in the README/opening post.
- Add regression tests (sample content + screenshot checklist) to ensure inline/block formulas survive builds.

## Impact
- Affected specs: article-rendering
- Affected code: Hugo config (`hugo.toml`), theme overrides (`layouts/_default`, partials), assets (`assets/js`, `assets/scss`), sample content, README
