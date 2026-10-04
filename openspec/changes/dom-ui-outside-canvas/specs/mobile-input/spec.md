# Spec Delta

## MODIFIED Requirements

### Requirement: Responsive canvas sizing
The system SHALL scale the playfield canvas to fit the available viewport while preserving its aspect ratio, inscribing it into the smaller side of the viewport — where the height available to the field is the viewport height less the band the stacked interface occupies on that axis, and that band is zero while the interface shares a track beside the field — (it may enlarge beyond its native size on larger screens), and SHALL inset the field from the top and bottom viewport edges by at least one board cell, so that the full board is always visible without horizontal or vertical scrolling and the board has clear breathing room at the top and bottom of the screen. The interface SHALL be sized and placed by its own rule and SHALL NOT scale with the field.

#### Scenario: Canvas fits a viewport smaller than its native size
- **WHEN** the viewport is narrower or shorter than the canvas's native size
- **THEN** the canvas is uniformly scaled down, inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without horizontal or vertical scrolling

#### Scenario: Canvas is not enlarged on larger viewports
- **WHEN** the viewport is at least as large as the canvas's native size
- **THEN** the canvas is enlarged to fill the smaller of the viewport width and the height remaining to the field after the stacked interface band (width or height) while preserving its aspect ratio, remains inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without scrolling

#### Scenario: Interface keeps its own size while the field enlarges
- **WHEN** the viewport is large enough that the field is enlarged to fill the smaller dimension available to it
- **THEN** the interface is not scaled by the field's factor and remains fully visible without scrolling

### Requirement: Touch gesture handling
The system SHALL prevent the browser from scrolling or zooming in response to touch gestures performed on the board, and SHALL suppress text selection and long-press context menus on the board so gestures are handled entirely as game input. These rules SHALL apply to the board only; the interface elements are ordinary page content and keep their normal browser touch behaviour.

#### Scenario: A swipe does not scroll the page
- **WHEN** the player performs a swipe gesture on the board
- **THEN** the page does not scroll and the gesture is handled entirely as game input

#### Scenario: No text selection or long-press menu on the board
- **WHEN** the player touches or holds on the board
- **THEN** text selection and the long-press context menu are suppressed on the board

#### Scenario: Interface text is not gesture-suppressed
- **WHEN** the player touches an interface element such as a menu label
- **THEN** normal browser touch behaviour applies to that element and it is not treated as a steering gesture
