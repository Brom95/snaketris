# start-menu Specification

## Purpose
The starting menu shown on launch and after game over, offering "Play", "Records", and "How to Play" items selectable by keyboard or pointer, and the flow that launches the game, opens the records view, opens the help view, and returns to the menu.

## Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over board overlays. The menu shows the title, the three selectable items, and the GitHub icon, and no longer shows a navigation hint line (the icon takes the space where it used to be).

#### Scenario: Menu shown on first launch
- **WHEN** the page loads the game for the first time
- **THEN** the starting menu is shown instead of the game board

#### Scenario: Menu shown after game over
- **WHEN** a game ends (game over)
- **THEN** control returns to the starting menu

#### Scenario: No navigation hint line on the menu
- **WHEN** the starting menu is shown
- **THEN** no navigation hint line is rendered below the menu items; the space below the items holds the GitHub icon instead

### Requirement: Menu labels are left-aligned with the block centered
The system SHALL render the starting menu's labels — the "snaketris" title and the three menu items ("Play", "Records", "How to Play") — left-aligned so that every label line begins at the same horizontal position. That shared left edge SHALL be positioned so the menu block remains horizontally centered on the screen: the widest menu label's horizontal center shall coincide with the board's horizontal center, and every menu label line SHALL be fully visible (not clipped) at the board edge on every screen size.

#### Scenario: All menu labels share a common left edge
- **WHEN** the starting menu is shown
- **THEN** the title and each menu item start at the same horizontal x position (left-aligned) rather than each line being centered individually

#### Scenario: Menu block stays centered and unclipped
- **WHEN** the starting menu is shown at any screen size and any item is highlighted
- **THEN** the leftmost label edge and the widest label's right edge are symmetric about the board's horizontal center, so the menu block remains centered on the screen and no menu label is clipped at the board edge

### Requirement: Three menu items
The system SHALL present exactly three selectable items in the starting menu — "Play", "Records", and "How to Play" — with exactly one item highlighted as the current selection.

#### Scenario: All items listed
- **WHEN** the starting menu is shown
- **THEN** the items "Play", "Records", and "How to Play" are listed and exactly one is highlighted

### Requirement: Keyboard navigation and confirmation
The system SHALL let the player move the selection with the arrow keys (and W/S) and confirm the highlighted item with Enter or Space.

#### Scenario: Arrows move selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the menu is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle ("Play" → "Records" → "How to Play" → "Play")

#### Scenario: Enter or Space confirms
- **WHEN** the player presses Enter or Space while the menu is shown
- **THEN** the highlighted item's action is performed

### Requirement: Pointer and touch selection
The system SHALL let the player select a menu item by clicking or tapping it.

#### Scenario: Clicking or tapping selects an item
- **WHEN** the player clicks or taps a menu item while the menu is shown
- **THEN** that item is selected and its action is performed (Play starts the game; Records opens the records view; How to Play opens the help view)

### Requirement: Play starts a new game
The system SHALL start a new game when "Play" is selected from the menu.

#### Scenario: Play launches gameplay
- **WHEN** "Play" is selected
- **THEN** a new game starts and the game board is shown

### Requirement: Records opens the records view
The system SHALL open the records view when "Records" is selected from the menu.

#### Scenario: Records opens leaderboard
- **WHEN** "Records" is selected
- **THEN** the records view is shown (see the `highscores` capability)

### Requirement: How to Play opens the help view
The system SHALL open the help view when "How to Play" is selected from the menu.

#### Scenario: How to Play opens help screen
- **WHEN** "How to Play" is selected
- **THEN** the help view is shown

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

### Requirement: GitHub link displayed below menu items
The system SHALL display a GitHub link/icon below the three standard menu items ("Play", "Records", "How to Play") in the starting menu. The link shall be visually distinct from the selectable menu items and shall not participate in keyboard or gamepad navigation.

#### Scenario: GitHub link visible on menu
- **WHEN** the starting menu is shown
- **THEN** a GitHub link/icon is rendered below the "How to Play" item, separated from the selectable menu items

### Requirement: GitHub opens the repository page
The system SHALL open the GitHub repository page `https://github.com/Brom95/snaketris` in a new browser tab when the GitHub link/icon is clicked or tapped.

#### Scenario: Click opens repo
- **WHEN** the player clicks or taps the GitHub link/icon on the menu
- **THEN** the browser navigates to `https://github.com/Brom95/snaketris` in a new tab
