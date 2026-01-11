## ADDED Requirements

### Requirement: Conditional Math Assets
Article pages SHALL expose a `math` front-matter flag; KaTeX CSS/JS MUST load only when this flag is `true` to avoid penalizing non-math posts.

#### Scenario: Math-enabled article
- **WHEN** a post declares `math: true`
- **THEN** the rendered HTML includes KaTeX assets and initialization script after the main content bundle.

#### Scenario: Non-math article
- **WHEN** a post omits the flag or sets `math: false`
- **THEN** KaTeX assets are not referenced in the HTML head or footer.

### Requirement: Inline LaTeX Rendering
Markdown inline math delimited by single dollar signs (`$expr$`) MUST render as KaTeX inline spans while preserving adjacent punctuation and bilingual text flow.

#### Scenario: Inline formula in paragraph
- **WHEN** the content contains `爱因斯坦提出 $E = mc^2$`
- **THEN** the built page displays the equation using KaTeX inline styling and keeps the sentence baseline intact.

### Requirement: Block LaTeX Rendering
Double-dollar blocks (`$$ ... $$`) MUST render as display-mode KaTeX blocks with automatic numbering disabled by default and responsive overflow handling.

#### Scenario: Display equation block
- **WHEN** a post contains
  $$\int_{0}^{\infty} e^{-x^2} dx$$
- **THEN** the generated HTML wraps it in a KaTeX display container that centers on desktop and scrolls horizontally on narrow screens.

### Requirement: Authoring Guidance
Documentation SHALL explain how to enable math, provide shortcode usage for complex expressions, and describe testing expectations before publishing.

#### Scenario: Contributor reads README
- **WHEN** a new author opens the README math section
- **THEN** they find steps covering front-matter flags, inline/block syntax, KaTeX limitations, and preview commands.
