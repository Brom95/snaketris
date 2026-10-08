# controller Delta

## MODIFIED Requirements

### Requirement: Controller piece control in Tetris role
In Tetris role the system SHALL map the D-pad left/right buttons (standard gamepad buttons 14 and 15) to a sideways shift of the falling piece, the D-pad up/down buttons (standard gamepad buttons 12 and 13) to a rotation, and the A button (standard gamepad button 0) to a clockwise rotation. The system SHALL NOT use them to steer the snake. When a held shift and an A press occur in the same frame, the system SHALL apply the rotation and keep the shift for a later frame.

#### Scenario: D-pad left shifts the piece left
- **WHEN** the player presses the D-pad left button while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the left

#### Scenario: D-pad up rotates the piece
- **WHEN** the player presses the D-pad up button while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn

#### Scenario: A rotates the piece clockwise
- **WHEN** the player presses the A button while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn clockwise

#### Scenario: A rotation is not lost while a direction is held
- **WHEN** the player holds the D-pad left and presses A in the same frame
- **THEN** the piece rotates clockwise, and the shift is applied on a later frame

#### Scenario: Controller cannot steer the snake in Tetris role
- **WHEN** the player presses any D-pad direction while a game is in progress in Tetris role
- **THEN** the snake's direction is unchanged

## ADDED Requirements

### Requirement: Controller A button is unused while the player controls the snake
The system SHALL NOT change the snake's direction, the game state, or any score in response to the A button while a game is in progress in Snake role.

#### Scenario: A does nothing in Snake role
- **WHEN** a game is in progress in Snake role and the player presses the A button
- **THEN** the snake's direction is unchanged and the game continues
