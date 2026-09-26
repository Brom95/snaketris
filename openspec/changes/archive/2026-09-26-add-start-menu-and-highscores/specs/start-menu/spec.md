# Spec Delta

## Purpose

The starting menu shown on launch and after game over, offering "Play", "Records", and "How to Play" items selectable by keyboard or pointer, and the flow that launches the game, opens the records view, opens the help view, and returns to the menu.

## ADDED Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over board overlays.

#### Scenario: Menu shown on first launch
- **WHEN** the page loads the game for the first time
- **THEN** the starting menu is shown instead of the game board

#### Scenario: Menu shown after game over
- **WHEN** a game ends (game over)
- **THEN** control returns to the starting menu

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
The system SHALL display the game's controls and rules in the help view, and SHALL offer a control to return to the starting menu.

#### Scenario: Controls are listed
- **WHEN** the help view is shown
- **THEN** the steering controls (arrow keys / WASD, and swipe or tap on touch) and the start/restart control (R or click/tap) are listed

#### Scenario: Rules are listed
- **WHEN** the help view is shown
- **THEN** the core rules are listed (eat falling pieces for points, avoid landed solid blocks and your own body, edges wrap around)

#### Scenario: Return to menu from help
- **WHEN** the player confirms or clicks/taps the return control in the help view
- **THEN** the starting menu is shown
