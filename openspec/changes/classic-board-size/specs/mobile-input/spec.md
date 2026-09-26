## Modified Requirements

### Requirement: Responsive canvas sizing
The system SHALL scale the playfield canvas to fit the available viewport while preserving its aspect ratio, so the full board is always visible without horizontal or vertical scrolling. The board is inscribed into the smaller side of the viewport: it is as large as possible while remaining fully visible, and may enlarge beyond its native size on larger screens.

#### Scenario: Canvas fits a viewport smaller than its native size
- **WHEN** the viewport is narrower or shorter than the canvas's native size
- **THEN** the canvas is uniformly scaled down to fit within the viewport while preserving its aspect ratio, and the entire board remains visible

#### Scenario: Canvas fills the smaller viewport side on larger viewports
- **WHEN** the viewport is at least as large as the canvas's native size
- **THEN** the canvas is enlarged to fill the smaller viewport dimension (width or height) while preserving its aspect ratio, and the entire board remains visible without scrolling
