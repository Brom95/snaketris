# start-menu Specification

## Purpose
The starting menu shown on launch and after game over, offering "Play", "Records", and "How to Play" items selectable by keyboard or pointer, and the flow that launches the game, opens the records view, opens the help view, and returns to the menu. "Play" opens a role sub-menu where the player chooses to play as the Snake or as Tetris before the game begins.

## Requirements

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

### Requirement: Three menu items
The system SHALL present exactly three selectable items in the starting menu — "Play", "Records", and "How to Play" — with exactly one item highlighted as the current selection.

#### Scenario: All items listed
- **WHEN** the starting menu is shown
- **THEN** the items "Play", "Records", and "How to Play" are listed and exactly one is highlighted

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

### Requirement: Play starts a new game
The system SHALL open the role sub-menu when "Play" is selected from the menu, and SHALL start a new game only after the player chooses a role.

#### Scenario: Play launches gameplay
- **WHEN** "Play" is selected and the player then chooses a role
- **THEN** a new game begins with a fresh board, a snake, and the first piece queued

#### Scenario: Play opens the role sub-menu first
- **WHEN** "Play" is selected
- **THEN** the role sub-menu is shown and the game board is not shown

#### Scenario: A chosen role starts the game
- **WHEN** the player chooses a role in the role sub-menu
- **THEN** a new game starts with that role and the game board is shown

### Requirement: Role sub-menu lists two roles
The system SHALL show a role sub-menu with exactly two selectable items, "Snake" and "Tetris", each shown with its role marker (Snake: 🐍, Tetris: 🏗️), with exactly one highlighted as the current selection. The sub-menu SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: Both roles listed
- **WHEN** the role sub-menu is shown
- **THEN** "Snake" and "Tetris" are listed and exactly one is highlighted

#### Scenario: Each role item shows its marker
- **WHEN** the role sub-menu is shown
- **THEN** the Snake item shows the 🐍 marker and the Tetris item shows the 🏗️ marker

#### Scenario: Role items are spaced apart
- **WHEN** the role sub-menu is shown
- **THEN** the two items are separated from one another and each has its own distinct hit area

### Requirement: Role screen replaces the starting menu
The system SHALL show the role screen as its own view in `SELECT_ROLE`: the starting-menu items, the menu title and the GitHub link SHALL be hidden while the role screen is shown, and the role screen SHALL show only its own title, the two role items and a Back control. The role screen SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: Menu content is hidden on the role screen
- **WHEN** the role screen is shown
- **THEN** the "Play", "Records" and "How to Play" items, the "snaketris" title and the GitHub link are not shown

#### Scenario: Role screen shows its own content
- **WHEN** the role screen is shown
- **THEN** the role title, the two role items and the Back control are the only menu-area content on screen

### Requirement: Keyboard role selection
The system SHALL let the player move the role selection with the arrow keys (and W/S) and confirm it with Enter or Space. A single confirmation SHALL perform exactly one action.

#### Scenario: Arrows move the role selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the role sub-menu is shown
- **THEN** the highlighted role moves to the other role

#### Scenario: Enter confirms the role
- **WHEN** the player presses Enter or Space while the role sub-menu is shown
- **THEN** the highlighted role is chosen and the game starts

### Requirement: Pointer role selection
The system SHALL let the player choose a role by clicking or tapping its item.

#### Scenario: Clicking a role chooses it
- **WHEN** the player clicks or taps the "Tetris" item in the role sub-menu
- **THEN** the game starts in Tetris role

### Requirement: Role sub-menu can be cancelled
The system SHALL return to the starting menu from the role sub-menu in response to Escape (keyboard), the gamepad B button, or a click or tap on the Back control, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the role sub-menu is shown and the player presses Escape
- **THEN** the starting menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back control on the role screen
- **THEN** the starting menu is shown again and no game has started

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
The system SHALL display the game's controls and rules in the help view, and SHALL offer a control to return to the starting menu. The controls list SHALL cover every input device for the role the player chose: keyboard, touch/pointer, and gamepad. All help-view text lines SHALL fit within the viewport width at every supported viewport size (not clipped).

#### Scenario: Controls are listed
- **WHEN** the help view is shown
- **THEN** the steering controls for both roles are listed for the keyboard (arrow keys / WASD), for touch (swipe or tap), and for the gamepad (D-pad and left thumbstick), together with the start control (R or click/tap) and the gamepad confirm/back buttons (A and B)

#### Scenario: Rules are listed
- **WHEN** the help view is shown
- **THEN** the core rules are listed (the bot plays the side the player did not choose, snake points for eaten cells and whole pieces, Tetris points for landed blocks and cleared rows, a blocked rotation is ignored, a piece shifts sideways once per snake step, edges wrap around)

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

### Requirement: Menu items have distinct spacing and hit targets
The system SHALL space the three starting-menu items ("Play", "Records", "How to Play") apart from one another, so that each item is a distinct target rather than a dense block of labels. The spacing SHALL be large enough that tapping one item does not select a neighbour by accident.

#### Scenario: Items are spaced apart
- **WHEN** the starting menu is shown
- **THEN** the three items are separated from one another (not clustered together) and each has its own distinct hit area

#### Scenario: Tapping an item selects only that item
- **WHEN** the player taps one menu item while the menu is shown
- **THEN** only that item is selected, and no other item is selected by the same tap
