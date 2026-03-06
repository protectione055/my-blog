# Spec Delta: Mermaid Rendering for Articles

## ADDED Requirements

### Requirement: Mermaid Fenced Code Rendering

Article pages SHALL render fenced code blocks with language `mermaid` as Mermaid charts instead of plain code listings.

#### Scenario: Mermaid diagram in a post

- **WHEN** an article contains a fenced code block starting with ```mermaid
- **THEN** the published page renders the diagram as SVG/chart output in the article body.

### Requirement: Conditional Mermaid Asset Loading

The site SHALL load Mermaid initialization code only on pages that contain Mermaid diagrams so regular posts avoid extra client-side cost.

#### Scenario: Post with Mermaid block

- **WHEN** a rendered article contains at least one Mermaid code block
- **THEN** the page includes the Mermaid bootstrap script needed to render the diagram.

#### Scenario: Post without Mermaid block

- **WHEN** a rendered article contains no Mermaid code blocks
- **THEN** the page does not include Mermaid-specific bootstrap code.

### Requirement: Responsive Mermaid Output

Rendered Mermaid diagrams SHALL remain readable across desktop and mobile layouts, including horizontal overflow handling for wide charts.

#### Scenario: Wide flowchart on a small screen

- **WHEN** a diagram is wider than the article column
- **THEN** the chart remains usable via responsive sizing or horizontal scrolling instead of clipping.

### Requirement: Appearance-aware Mermaid Theme

Rendered Mermaid diagrams SHALL adapt to the site appearance mode so charts remain legible in both light and dark themes.

#### Scenario: Reader switches appearance mode

- **WHEN** the site changes between light and dark appearance
- **THEN** Mermaid diagrams are re-rendered or themed so text and connectors remain legible in the active mode.

### Requirement: Inline Mermaid Zoom Controls

Rendered Mermaid diagrams SHALL support in-frame zoom controls for dense charts such as sequence diagrams.

#### Scenario: Reader zooms a sequence diagram in place

- **WHEN** the reader uses the zoom controls shown above a Mermaid chart
- **THEN** the diagram scales inside the article frame and remains horizontally scrollable when it exceeds the column width.
