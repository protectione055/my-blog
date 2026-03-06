# Tasks: Add Mermaid Chart Rendering Support

## 1. Planning & Rendering Strategy

- [x] 1.1 Choose fenced code blocks with language `mermaid` as the authoring interface.
- [x] 1.2 Use on-demand client-side initialization so non-diagram pages load no Mermaid assets.

## 2. Implementation

- [x] 2.1 Add a Hugo render hook for `mermaid` code blocks.
- [x] 2.2 Add a reusable Mermaid bootstrap script with dark/light theme awareness.
- [x] 2.3 Make Mermaid output responsive inside article content.
- [x] 2.4 Add in-frame zoom controls for dense Mermaid charts.
- [x] 2.5 Add focused mouse-wheel zoom and left-button drag panning for dense Mermaid charts.

## 3. Validation & Docs

- [x] 3.1 Document Mermaid authoring in README.
- [ ] 3.2 Validate the OpenSpec change with `openspec validate add-mermaid-rendering --strict`.
- [ ] 3.3 Smoke-test an article containing Mermaid diagrams.
