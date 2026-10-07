# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

## MODIFIED Requirements

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
