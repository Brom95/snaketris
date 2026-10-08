# controller Delta

## MODIFIED Requirements

### Requirement: Controller role selection
The system SHALL let the player move the role-screen selection with the D-pad up/down or the left-stick up/down through "Snake", "Tetris" and "Back", confirm the highlighted item with the A button, and return to the starting menu with the B button, matching the keyboard behaviour. Confirming "Back" returns to the starting menu.

#### Scenario: D-pad moves the role selection
- **WHEN** the role screen is shown and the player presses the D-pad down button
- **THEN** the highlighted item moves to the next item in the cycle "Snake" → "Tetris" → "Back" → "Snake"

#### Scenario: A confirms the role
- **WHEN** the role screen is shown with a role item highlighted and the player presses the A button
- **THEN** the highlighted role is chosen and the game starts

#### Scenario: A on Back returns to the menu
- **WHEN** the role screen is shown with "Back" highlighted and the player presses the A button
- **THEN** the starting menu is shown again and no game has started

#### Scenario: B cancels the role sub-menu
- **WHEN** the role sub-menu is shown and the player presses the B button
- **THEN** the starting menu is shown again and no game has started
