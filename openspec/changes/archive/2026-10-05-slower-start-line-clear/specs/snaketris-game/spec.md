# Spec Delta

## ADDED Requirements

### Requirement: Line clear on a full row
The system SHALL clear a row when all of its cells are solid (landed) blocks, awarding the snake 10 points per cleared row and reducing the landed-block count by 10 per cleared row. A full row clears automatically; it does not require the snake to consume it.

#### Scenario: A row fills completely
- **WHEN** every cell in a row is a solid (landed) block
- **THEN** that row is cleared and the snake gains 10 points

#### Scenario: The clear counts back the ramp
- **WHEN** a full row clears
- **THEN** the landed-block count is reduced by 10 for that row

#### Scenario: Multiple full rows in one tick
- **WHEN** more than one row is full at the same time
- **THEN** every full row clears and each awards 10 points

## MODIFIED Requirements

### Requirement: Landed-block difficulty ramp
The system SHALL increase fall speed every time five more blocks have landed, starting from a base fall speed of 0.04 cells/tick, increasing by a factor of 1.08 per five landed blocks, and capped at 0.9 cells/tick.

#### Scenario: Speed ticks up after five landed blocks
- **WHEN** five additional blocks have landed since the last tick
- **THEN** the downward fall speed increases one step

#### Scenario: Slower start
- **WHEN** the game begins with 0 landed blocks
- **THEN** pieces fall at 0.04 cells/tick (one cell per 25 ticks)

### Requirement: Snake speed tied to piece fall speed
The system SHALL derive the snake's step interval from the current piece fall speed: the snake passes one cell every `max(1, 1/fallSpeed − 2)` ticks, where `fallSpeed` is the current piece fall speed in cells/tick. While the 1-tick-per-cell minimum is not reached, the snake's step interval is exactly 2 ticks/cell shorter than the piece's step interval (`1/fallSpeed`), and the snake MUST always pass a cell in strictly fewer ticks than a falling piece.

#### Scenario: Snake is 2 ticks/cell faster at base speed
- **WHEN** pieces fall at 0.04 cells/tick (25 ticks per cell)
- **THEN** the snake passes one cell every 23 ticks

#### Scenario: Snake stays faster as pieces accelerate
- **WHEN** the piece fall speed increases to the 0.9 cells/tick cap (1.11 ticks per cell)
- **THEN** the snake passes one cell every 1 tick (minimum), still faster than the piece's 1.11 ticks/cell

#### Scenario: Snake tracks the piece speed ramp
- **WHEN** five additional blocks have landed and the piece fall speed increases one step
- **THEN** the snake's step interval decreases by the same amount as the piece's step interval (2 ticks/cell apart, until the 1-tick/cell minimum is reached)
