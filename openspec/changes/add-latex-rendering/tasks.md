## 1. Planning & Dependencies
- [ ] 1.1 Pin KaTeX version and add npm (or Hugo resources) dependency strategy.
- [ ] 1.2 Decide front matter flag name (e.g., `math: true`) and document author workflow.

## 2. Implementation
- [ ] 2.1 Wire KaTeX assets through Hugo Pipes (CSS + JS) with fingerprinting and conditional loading.
- [ ] 2.2 Update Markdown/shortcode rendering to transform inline `$...$` and block `$$...$$` expressions into KaTeX spans/divs.
- [ ] 2.3 Provide shortcode/partial for escaping complex formulas when needed.
- [ ] 2.4 Create sample bilingual post demonstrating inline and block math plus numbered equations.
- [ ] 2.5 Ensure Blowfish typography and dark/light themes style KaTeX output consistently.

## 3. Validation & Docs
- [ ] 3.1 Run `hugo server` to confirm math toggling works and assets load only when requested.
- [ ] 3.2 Add regression instructions to README (how to enable math, limitations, testing matrix).
- [ ] 3.3 Run `openspec validate add-latex-rendering --strict` before requesting review.
