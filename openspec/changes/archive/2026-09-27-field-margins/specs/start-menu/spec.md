## Modified Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over board overlays. The menu's navigation hint line SHALL fit within the board's width on every screen size (not clipped at the board edge).

#### Scenario: Menu shown on first launch
- **WHEN** the page loads the game for the first time
- **THEN** the starting menu is shown instead of the game board

#### Scenario: Menu shown after game over
- **WHEN** a game ends (game over)
- **THEN** control returns to the starting menu

#### Scenario: Menu hint fits the board width
- **WHEN** the starting menu is shown at any screen size
- **THEN** the menu's navigation hint line is fully visible within the board's width (not clipped at the board edge)

### Requirement: Help view shows controls and rules
The system SHALL display the game's controls and rules in the help view, and SHALL offer a control to return to the starting menu. All help-view text lines SHALL fit within the board's width on every screen size (not clipped at the board edge).

#### Scenario: Controls are listed
- **WHEN** the help view is shown
- **THEN** the steering controls (arrow keys / WASD, and swipe or tap on touch) and the start/restart control (R or click/tap) are listed

#### Scenario: Rules are listed
- **WHEN** the help view is shown
- **THEN** the core rules are listed (eat falling pieces for points, avoid landed solid blocks and your own body, edges wrap around)

#### Scenario: Help text fits the board width
- **WHEN** the help view is shown at any screen size
- **THEN** every control and rule line is fully visible within the board's width (not clipped at the board edge)

#### Scenario: Return to menu from help
- **WHEN** the player confirms or clicks/taps the return control in the help view
- **THEN** the starting menu is shown
