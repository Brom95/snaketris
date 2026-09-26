# snaketris-game Specification

## Purpose
Lets a player pilot a snake that eats falling Tetris pieces before they land, where each landed piece becomes a solid obstacle. Defines the playfield mechanics, cell-by-cell scoring, difficulty ramp, and restart for the single-page HTML snaketris game.

## Requirements

### Requirement: Snake movement and classic growth
The system SHALL move the snake on a single-page HTML5 canvas in response to player input and grow it by classic growth (each eaten cell adds a segment).

#### Scenario: Classic growth
- **WHEN** the snake consumes an edible cell
- **THEN** the snake grows by one segment, increasing its length accordingly

### Requirement: Wrap-around edges
The system SHALL treat the playfield as closed with wrap-around at screen edges, so there are no walls.

#### Scenario: Wrapping off the edge
- **WHEN** the snake's head moves off one side of the playfield
- **THEN** the snake re-enters from the opposite side and continues unimpeded

### Requirement: Death conditions
The system SHALL end the game when the snake collides with its own body or touches a solid (landed) block.

#### Scenario: Self-collision
- **WHEN** the snake's head overlaps any of its own segments
- **THEN** the game ends (game over)

#### Scenario: Touching a solid block
- **WHEN** the snake's head touches a landed (solid) Tetris block
- **THEN** the game ends (game over)

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

### Requirement: Edible while falling, solid once landed
The system SHALL treat a Tetris piece as edible while it is falling and as a solid obstacle once it has landed (touches the bottom or rests on other pieces).

#### Scenario: A landed block becomes an obstacle
- **WHEN** a Tetris piece touches the bottom or comes to rest on other pieces
- **THEN** it stops being edible and becomes a solid obstacle for the snake

### Requirement: Eating a piece while it falls
The system SHALL consume edible pieces cell-by-cell, adding exactly 1 to the running score per cell, with each tick computed **snake-first** (the snake steps, then the pieces fall). Only the snake's **head** eats: the head consumes the cell it moves into, and a falling piece that drops onto the head is consumed as well. The snake's body never eats. The snake grows one segment per cell consumed.

#### Scenario: Consuming one cell
- **WHEN** the snake eats a single cell of an edible piece
- **THEN** the running score increases by exactly 1

#### Scenario: Eating a piece from below
- **WHEN** the snake moves upward into a falling piece
- **THEN** it consumes each cell the head reaches, not only the first one

#### Scenario: A block falls onto the head
- **WHEN** a falling piece drops onto the snake's head
- **THEN** that cell is consumed and the snake grows by one segment

#### Scenario: The body does not eat
- **WHEN** a falling piece overlaps the snake's body but not its head
- **THEN** nothing is consumed

### Requirement: Landed-block difficulty ramp
The system SHALL increase fall speed every time two more blocks have landed, starting from a base fall speed of 0.08 cells/tick, increasing by a factor of 1.08 per two landed blocks, and capped at 0.9 cells/tick.

#### Scenario: Speed ticks up after two landed blocks
- **WHEN** two additional blocks have landed since the last tick
- **THEN** the downward fall speed increases one step

#### Scenario: Slower start
- **WHEN** the game begins with 0 landed blocks
- **THEN** pieces fall at 0.08 cells/tick (one cell per 12.5 ticks)

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

### Requirement: Restart after game over
The system SHALL offer a restart so the player can start again from scratch.

#### Scenario: Restarting after game over
- **WHEN** the game ends (self-collision or touching a solid block)
- **THEN** the player can start a new game from scratch
