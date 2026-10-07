# Spec Delta

## ADDED Requirements

### Requirement: Touch piece control in Tetris role
In Tetris role the system SHALL map a tap in the left or right region of the board to a sideways shift of the falling piece, a tap in the centre region to a rotation, and a swipe with a dominant vertical displacement to a rotation, and SHALL NOT interpret any touch gesture as snake steering.

#### Scenario: Tap in the left region shifts the piece left
- **WHEN** the player taps the left region of the board while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the left

#### Scenario: Tap in the right region shifts the piece right
- **WHEN** the player taps the right region of the board while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the right

#### Scenario: Tap in the centre region rotates the piece
- **WHEN** the player taps the centre region of the board while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn

#### Scenario: Vertical swipe rotates the piece
- **WHEN** the player performs a swipe with a dominant vertical displacement while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn in the direction of the swipe

#### Scenario: Touch does not steer the snake in Tetris role
- **WHEN** the player performs any swipe or tap on the board while a game is in progress in Tetris role
- **THEN** the snake's direction is unchanged
