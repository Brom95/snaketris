# start-menu Delta

## ADDED Requirements

### Requirement: Menu items keep their geometry when the selection moves
The system SHALL keep every menu item and every role-screen item at the same width, font size and position when the selection marker moves from one item to another. The marker SHALL be present on every item and SHALL change only its visibility. A selected item SHALL differ from an unselected item by colour only.

#### Scenario: The marker moves to the longest item
- **WHEN** the selection marker moves onto "How to Play" in the starting menu
- **THEN** the width of the item list and the left edge of every item are unchanged

#### Scenario: The marker moves on the role screen
- **WHEN** the selection marker moves between the role items and the Back item
- **THEN** the width of the role item list and the left edge of every item are unchanged

#### Scenario: No item changes its font size
- **WHEN** an item becomes selected or unselected
- **THEN** its font size is the same as before

### Requirement: Menu and role items use one font size
The system SHALL render the three starting-menu items and the role-screen items at the same font size.

#### Scenario: Both screens use the same size
- **WHEN** the starting menu and the role screen are shown
- **THEN** every selectable item on both screens uses the same font size

### Requirement: Back is a selectable item on the role screen
The system SHALL place the Back control in the same item list as the two role items on the role screen, and SHALL include it in the selection cycle.

#### Scenario: Back is listed with the role items
- **WHEN** the role screen is shown
- **THEN** the item list contains "Snake", "Tetris" and "Back" in that order

#### Scenario: The marker reaches Back
- **WHEN** the player moves the selection down from "Tetris" on the role screen
- **THEN** "Back" is highlighted

## MODIFIED Requirements

### Requirement: Keyboard role selection
The system SHALL let the player move the role-screen selection with the arrow keys (and W/S) through "Snake", "Tetris" and "Back", and SHALL confirm the highlighted item with Enter or Space. Confirming a role item starts the game. Confirming "Back" returns to the starting menu. A single confirmation SHALL perform exactly one action.

#### Scenario: Arrows move the role selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the role screen is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle "Snake" → "Tetris" → "Back" → "Snake"

#### Scenario: Enter confirms the role
- **WHEN** the player presses Enter or Space while a role item is highlighted
- **THEN** the highlighted role is chosen and the game starts

#### Scenario: Enter on Back returns to the menu
- **WHEN** the player presses Enter or Space while "Back" is highlighted
- **THEN** the starting menu is shown again and no game has started

### Requirement: Role sub-menu can be cancelled
The system SHALL return to the starting menu from the role screen in response to Escape (keyboard), the gamepad B button, a click or tap on the Back item, or a confirmation while the Back item is highlighted, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the role screen is shown and the player presses Escape
- **THEN** the starting menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back item on the role screen
- **THEN** the starting menu is shown again and no game has started

#### Scenario: Confirming the Back item returns to the menu
- **WHEN** the player highlights "Back" and presses Enter or Space
- **THEN** the starting menu is shown again and no game has started
