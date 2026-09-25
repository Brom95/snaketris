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
The system SHALL spawn the seven classic tetromino shapes (I, O, T, S, Z, L, J) at the top of the playfield and fall them downward.

#### Scenario: A piece falls from the top
- **WHEN** a new Tetris piece spawns
- **THEN** it appears at the top and moves downward until it lands

### Requirement: Edible while falling, solid once landed
The system SHALL treat a Tetris piece as edible while it is falling and as a solid obstacle once it has landed (touches the bottom or rests on other pieces).

#### Scenario: A landed block becomes an obstacle
- **WHEN** a Tetris piece touches the bottom or comes to rest on other pieces
- **THEN** it stops being edible and becomes a solid obstacle for the snake

### Requirement: Cell-by-cell eating with scoring
The system SHALL consume edible pieces cell-by-cell and add exactly 1 to the running score for each cell consumed.

#### Scenario: Consuming one cell
- **WHEN** the snake eats a single cell of an edible piece
- **THEN** the running score increases by exactly 1

### Requirement: Landed-block difficulty ramp
The system SHALL increase fall speed every time two more blocks have landed.

#### Scenario: Speed ticks up after two landed blocks
- **WHEN** two additional blocks have landed since the last tick
- **THEN** the downward fall speed increases one step

### Requirement: Restart after game over
The system SHALL offer a restart so the player can start again from scratch.

#### Scenario: Restarting after game over
- **WHEN** the game ends (self-collision or touching a solid block)
- **THEN** the player can start a new game from scratch
