# Spec Delta

## MODIFIED Requirements

### Requirement: Falling Tetris pieces
The system SHALL spawn the seven classic tetromino shapes (I, O, T, S, Z, L, J) at the top of the playfield and fall them downward, one at a time: a new piece may spawn only when no piece is falling on the board (the previous piece has landed and become solid, or the snake has fully consumed it).

#### Scenario: A piece falls from the top
- **WHEN** a new Tetromino piece spawns
- **THEN** it appears at the top and moves downward until it lands

#### Scenario: Sequential spawn
- **WHEN** the previous piece has landed (become solid) or been fully consumed
- **THEN** the next piece may spawn, and only when the spawn interval has elapsed

#### Scenario: At most one falling piece
- **WHEN** the game is running
- **THEN** at most one Tetromino piece is falling on the board at any time

### Requirement: Landed-block difficulty ramp
The system SHALL increase fall speed every time two more blocks have landed, starting from a base fall speed of 0.08 cells/tick, increasing by a factor of 1.08 per two landed blocks, and capped at 0.9 cells/tick.

#### Scenario: Speed ticks up after two landed blocks
- **WHEN** two additional blocks have landed since the last tick
- **THEN** the downward fall speed increases one step

#### Scenario: Slower start
- **WHEN** the game begins with 0 landed blocks
- **THEN** pieces fall at 0.08 cells/tick (one cell per 12.5 ticks)

## ADDED Requirements

### Requirement: Snake speed tied to piece fall speed
The system SHALL derive the snake's step interval from the current piece fall speed: the snake passes one cell every `max(1, 1/fallSpeed − 2)` ticks, where `fallSpeed` is the current piece fall speed in cells/tick. While the 1-tick-per-cell minimum is not reached, the snake's step interval is exactly 2 ticks/cell shorter than the piece's step interval (`1/fallSpeed`), and the snake MUST always pass a cell in strictly fewer ticks than a falling piece.

#### Scenario: Snake is 2 ticks/cell faster at base speed
- **WHEN** pieces fall at 0.08 cells/tick (12.5 ticks per cell)
- **THEN** the snake passes one cell every 10.5 ticks

#### Scenario: Snake stays faster as pieces accelerate
- **WHEN** the piece fall speed increases to the 0.9 cells/tick cap (1.11 ticks per cell)
- **THEN** the snake passes one cell every 1 tick (minimum), still faster than the piece's 1.11 ticks/cell

#### Scenario: Snake tracks the piece speed ramp
- **WHEN** two additional blocks have landed and the piece fall speed increases one step
- **THEN** the snake's step interval decreases by the same amount as the piece's step interval (2 ticks/cell apart, until the 1-tick/cell minimum is reached)
