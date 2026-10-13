# Spec Delta

## ADDED Requirements

### Requirement: Duration sub-menu lists three durations
The system SHALL show a duration sub-menu with exactly three selectable items — "1 minute", "3 minutes" and "5 minutes" — with exactly one highlighted as the current selection. The sub-menu SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: All durations listed
- **WHEN** the duration sub-menu is shown
- **THEN** "1 minute", "3 minutes" and "5 minutes" are listed and exactly one is highlighted

#### Scenario: Duration items are spaced apart
- **WHEN** the duration sub-menu is shown
- **THEN** the three items are separated from one another and each has its own distinct hit area

### Requirement: Duration sub-menu keyboard navigation
The system SHALL let the player move the duration selection with the arrow keys (and W/S) through the three duration items and a Back item, and SHALL confirm the highlighted item with Enter or Space. A single confirmation SHALL perform exactly one action.

#### Scenario: Arrows move duration selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the duration sub-menu is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle "1 minute" → "3 minutes" → "5 minutes" → "Back" → "1 minute"

#### Scenario: Enter confirms a duration
- **WHEN** the player presses Enter or Space while a duration item is highlighted
- **THEN** that duration is chosen and the role sub-menu is shown

#### Scenario: Confirmation fires once
- **WHEN** the player confirms the highlighted duration with Enter or Space
- **THEN** exactly one action runs, and no second action is triggered by the same key press

### Requirement: Duration sub-menu pointer selection
The system SHALL let the player choose a duration by clicking or tapping its item.

#### Scenario: Clicking a duration chooses it
- **WHEN** the player clicks or taps the "5 minutes" item in the duration sub-menu
- **THEN** the match is set to 5 minutes and the role sub-menu is shown

### Requirement: Duration sub-menu can be cancelled
The system SHALL return from the duration sub-menu to the starting menu in response to Escape (keyboard), the gamepad B button, a click or tap on the Back item, or a confirmation while the Back item is highlighted, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the duration sub-menu is shown and the player presses Escape
- **THEN** the starting menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back item on the duration sub-menu
- **THEN** the starting menu is shown again and no game has started

### Requirement: Duration screen replaces the starting menu
The system SHALL show the duration screen as its own view: the starting-menu items, the menu title and the GitHub link SHALL be hidden while the duration screen is shown, and the duration screen SHALL show only its own title, the three duration items and a Back control.

#### Scenario: Menu content is hidden on the duration screen
- **WHEN** the duration screen is shown
- **THEN** the "Play", "Records" and "How to Play" items, the "snaketris" title and the GitHub link are not shown

#### Scenario: Duration screen shows its own content
- **WHEN** the duration screen is shown
- **THEN** the duration title, the three duration items and the Back control are the only menu-area content on screen

### Requirement: Records view selects a board by duration
The records view SHALL show a duration selector with three items — "1 minute", "3 minutes" and "5 minutes" — above one leaderboard list, with exactly one selector item highlighted. The list SHALL show the board of the highlighted duration only.

#### Scenario: The highlighted selector item picks the board
- **WHEN** the records view is shown with "3 minutes" highlighted
- **THEN** the list shows the 3-minute board and no other board

#### Scenario: Switching the selection switches the list
- **WHEN** the player moves the records selector from "1 minute" to "5 minutes"
- **THEN** the list repaints with the 5-minute board and the selector highlights "5 minutes"

### Requirement: Records duration cursor starts at the 1-minute board
The system SHALL start the records duration cursor at the 1-minute board when the records view is opened.

#### Scenario: First board shown
- **WHEN** the player opens the records view
- **THEN** "1 minute" is the highlighted selector item and the list shows the 1-minute board

## MODIFIED Requirements

### Requirement: Play starts a new game
The system SHALL open the duration sub-menu when "Play" is selected from the menu, and SHALL open the role sub-menu only after the player confirms a duration. The system SHALL start a new game only after the player chooses a role.

#### Scenario: Play opens the duration sub-menu first
- **WHEN** "Play" is selected
- **THEN** the duration sub-menu is shown and the game board is not shown

#### Scenario: Play opens the role sub-menu first
- **WHEN** "Play" is selected and the player confirms a duration
- **THEN** the role sub-menu is shown and the game board is not shown

#### Scenario: Play launches gameplay
- **WHEN** "Play" is selected, a duration is confirmed and the player then chooses a role
- **THEN** a new game begins with a fresh board, a snake, the first piece queued and the chosen countdown

#### Scenario: A chosen role starts the game
- **WHEN** the player chooses a role in the role sub-menu
- **THEN** a new game starts with that role, the chosen duration and the game board shown

### Requirement: Role sub-menu can be cancelled
The system SHALL return from the role screen to the duration sub-menu in response to Escape (keyboard), the gamepad B button, a click or tap on the Back item, or a confirmation while the Back item is highlighted, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the role screen is shown and the player presses Escape
- **THEN** the duration sub-menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back item on the role screen
- **THEN** the duration sub-menu is shown again and no game has started

#### Scenario: Confirming the Back item returns to the menu
- **WHEN** the player highlights "Back" and presses Enter or Space
- **THEN** the duration sub-menu is shown again and no game has started

### Requirement: Records opens the records view
The system SHALL open the records view when "Records" is selected from the menu. The records view SHALL present its duration selector and one board list (see the `highscores` capability).

#### Scenario: Records opens leaderboard
- **WHEN** "Records" is selected
- **THEN** the records view is shown with its duration selector and one board list (see the `highscores` capability)

### Requirement: Field is hidden while the menu, records or help view is shown
The system SHALL show the play field only while a game is in progress or has just ended: the field SHALL be absent from the page while the starting menu, the duration sub-menu, the role sub-menu, the records view or the help view is shown, and SHALL be on screen in `PLAYING` and `GAME_OVER`. The field's visibility SHALL be derived from the same game-state authority that selects the view.

#### Scenario: No field behind the starting menu
- **WHEN** the starting menu is shown
- **THEN** the play field is not shown at all and the menu occupies the page on its own

#### Scenario: No field behind the duration or role sub-menu
- **WHEN** the duration sub-menu or the role sub-menu is shown
- **THEN** the play field is not shown

#### Scenario: No field behind the records or help view
- **WHEN** the records view or the help view is shown
- **THEN** the play field is not shown

#### Scenario: Final board stays visible at game over
- **WHEN** a game ends and the game-over message is shown
- **THEN** the final board remains visible in the play field until control returns to the starting menu
