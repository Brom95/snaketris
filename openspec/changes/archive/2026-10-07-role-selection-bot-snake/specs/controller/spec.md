# Spec Delta

## ADDED Requirements

### Requirement: Controller role selection
The system SHALL let the player move the role selection with the D-pad up/down or the left-stick up/down, confirm the highlighted role with the A button, and return to the starting menu with the B button, matching the keyboard behaviour.

#### Scenario: D-pad moves the role selection
- **WHEN** the role sub-menu is shown and the player presses the D-pad down button
- **THEN** the highlighted role moves to the other role

#### Scenario: A confirms the role
- **WHEN** the role sub-menu is shown and the player presses the A button
- **THEN** the highlighted role is chosen and the game starts

#### Scenario: B cancels the role sub-menu
- **WHEN** the role sub-menu is shown and the player presses the B button
- **THEN** the starting menu is shown again and no game has started

### Requirement: Controller piece control in Tetris role
In Tetris role the system SHALL map the D-pad left/right buttons (standard gamepad buttons 14 and 15) to a sideways shift of the falling piece and the D-pad up/down buttons (standard gamepad buttons 12 and 13) to a rotation, and SHALL NOT use them to steer the snake.

#### Scenario: D-pad left shifts the piece left
- **WHEN** the player presses the D-pad left button while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the left

#### Scenario: D-pad up rotates the piece
- **WHEN** the player presses the D-pad up button while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn

#### Scenario: Controller cannot steer the snake in Tetris role
- **WHEN** the player presses any D-pad direction while a game is in progress in Tetris role
- **THEN** the snake's direction is unchanged
