## Modified Requirements

### Requirement: Responsive canvas sizing
The system SHALL scale the playfield canvas to fit the available viewport while preserving its aspect ratio, inscribing it into the smaller side of the viewport (it may enlarge beyond its native size on larger screens), and SHALL inset the field from the top and bottom viewport edges by at least one board cell, so that the full board is always visible without horizontal or vertical scrolling and the board has clear breathing room at the top and bottom of the screen.

#### Scenario: Canvas fits a viewport smaller than its native size
- **WHEN** the viewport is narrower or shorter than the canvas's native size
- **THEN** the canvas is uniformly scaled down, inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without horizontal or vertical scrolling

#### Scenario: Canvas is not enlarged on larger viewports
- **WHEN** the viewport is at least as large as the canvas's native size
- **THEN** the canvas is enlarged to fill the smaller viewport dimension (width or height) while preserving its aspect ratio, remains inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without scrolling
