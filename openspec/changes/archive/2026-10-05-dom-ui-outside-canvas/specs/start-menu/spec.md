# Spec Delta

## MODIFIED Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over views. The menu shows the title, the three selectable items, and the GitHub icon, and no longer shows a navigation hint line (the icon takes the space where it used to be). The menu SHALL be composed of page elements rather than text painted onto the play field.

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
The system SHALL render the starting menu's labels — the "snaketris" title and the three menu items ("Play", "Records", "How to Play") — left-aligned so that every label line begins at the same horizontal position. That shared left edge SHALL be positioned so the menu block remains horizontally centered within the interface area the menu occupies, and every menu label line SHALL be fully visible (not clipped) at every supported viewport size.

#### Scenario: All menu labels share a common left edge
- **WHEN** the starting menu is shown
- **THEN** the title and each menu item start at the same horizontal position (left-aligned) rather than each line being centered individually

#### Scenario: Menu block stays centered and unclipped
- **WHEN** the starting menu is shown at any viewport size and any item is highlighted
- **THEN** the leftmost label edge and the widest label's right edge are symmetric about the center of the menu's own area, so the block stays centered and no menu label is clipped

### Requirement: Keyboard navigation and confirmation
The system SHALL let the player move the selection with the arrow keys (and W/S) and confirm the highlighted item with Enter or Space, whether or not the menu items are focusable page elements. A single confirmation SHALL perform exactly one menu action.

#### Scenario: Arrows move selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the menu is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle ("Play" → "Records" → "How to Play" → "Play")

#### Scenario: Enter or Space confirms
- **WHEN** the player presses Enter or Space while the menu is shown
- **THEN** the highlighted item's action is performed

#### Scenario: Confirmation fires once
- **WHEN** the player confirms the highlighted item with Enter or Space while the menu is shown
- **THEN** exactly one menu action runs, and no second action is triggered by the same key press

### Requirement: Pointer and touch selection
The system SHALL let the player select a menu item by clicking or tapping it, whether the item is a page element or a painted label.

#### Scenario: Clicking or tapping selects an item
- **WHEN** the player clicks or taps a menu item while the menu is shown
- **THEN** that item is selected and its action is performed (Play starts the game; Records opens the records view; How to Play opens the help view)

#### Scenario: Tapping the interface does not steer the snake
- **WHEN** the player taps a menu item while the menu is shown
- **THEN** the tap selects the item and is not interpreted as a steering gesture

### Requirement: Help view shows controls and rules
The system SHALL display the game's controls and rules in the help view, and SHALL offer a control to return to the starting menu. All help-view text lines SHALL fit within the viewport width at every supported viewport size (not clipped).

#### Scenario: Controls are listed
- **WHEN** the help view is shown
- **THEN** the steering controls (arrow keys / WASD, and swipe or tap on touch) and the start/restart control (R or click/tap) are listed

#### Scenario: Rules are listed
- **WHEN** the help view is shown
- **THEN** the core rules are listed (eat falling pieces for points, avoid landed solid blocks and your own body, edges wrap around)

#### Scenario: Help text fits the board width
- **WHEN** the help view is shown at any supported viewport size
- **THEN** every control and rule line is fully visible within the visible page width and the page does not scroll horizontally

#### Scenario: Return to menu from help
- **WHEN** the player confirms or clicks/taps the return control in the help view
- **THEN** the starting menu is shown

### Requirement: GitHub link displayed below menu items
The system SHALL display a GitHub link below the three standard menu items ("Play", "Records", "How to Play") in the starting menu, as a page-level link element visually distinct from the selectable menu items. The link SHALL NOT participate in keyboard or gamepad navigation.

#### Scenario: GitHub link visible on menu
- **WHEN** the starting menu is shown
- **THEN** a GitHub link/icon is rendered below the "How to Play" item, separated from the selectable menu items

### Requirement: GitHub opens the repository page
The system SHALL navigate to the GitHub repository page `https://github.com/Brom95/snaketris` in a new browser tab when the GitHub link/icon is clicked or tapped. The navigation SHALL NOT depend on script-opened windows, so a popup blocker cannot suppress it.

#### Scenario: Click opens repo
- **WHEN** the player clicks or taps the GitHub link/icon on the menu
- **THEN** the browser navigates to `https://github.com/Brom95/snaketris` in a new tab

## ADDED Requirements

### Requirement: Menu, records and help views are page elements
The system SHALL render the starting menu, the records view and the help view as page elements, so their text is selectable, browser-scalable, and readable by assistive technology, and so their hit areas follow their rendered boxes rather than a separately maintained layout.

#### Scenario: Records list is page text
- **WHEN** the records view is shown
- **THEN** each leaderboard line is page text the browser can select and scale

#### Scenario: Hit area follows the rendered label
- **WHEN** the player clicks just outside a rendered menu label
- **THEN** the item is not selected, and clicking on the rendered label selects it

### Requirement: One view authority
The system SHALL derive which of the menu, records, help and game-over views is shown from a single game-state authority, so the visible page elements and the accepted input never disagree.

#### Scenario: Input matches the shown view
- **WHEN** any view is shown
- **THEN** the input that acts is the input defined for that shown view, and no input belonging to another view is accepted

### Requirement: Field is hidden while the menu, records or help view is shown
The system SHALL show the play field only while a game is in progress or has just ended: the field SHALL be absent from the page while the starting menu, the records view or the help view is shown, and SHALL be on screen in `PLAYING` and `GAME_OVER`. The field's visibility SHALL be derived from the same game-state authority that selects the view.

#### Scenario: No field behind the starting menu
- **WHEN** the starting menu is shown
- **THEN** the play field is not shown at all and the menu occupies the page on its own

#### Scenario: No field behind the records or help view
- **WHEN** the records view or the help view is shown
- **THEN** the play field is not shown

#### Scenario: Final board stays visible at game over
- **WHEN** a game ends and the game-over message is shown
- **THEN** the final board remains visible in the play field until control returns to the starting menu
