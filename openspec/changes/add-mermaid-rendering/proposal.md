# Change: Add Mermaid Chart Rendering Support

## Why

Technical posts already include Mermaid diagrams, but the current site renders them as plain fenced code blocks. This breaks article readability and forces authors to use screenshots instead of editable diagrams.

## What Changes

- Add a Hugo code block render hook for fenced `mermaid` blocks.
- Load Mermaid on demand only for pages that contain Mermaid diagrams.
- Make Mermaid output responsive and compatible with dark/light appearance switching.
- Document the authoring workflow in the README.

## Impact

- Affected specs: article-rendering
- Affected code: Hugo render hooks under `layouts/_default/_markup/`, static JS bootstrap, custom styles, README
