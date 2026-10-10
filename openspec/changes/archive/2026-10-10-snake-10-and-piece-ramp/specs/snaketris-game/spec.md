# Spec Delta

## MODIFIED Requirements

### Requirement: Snake movement and classic growth
The system SHALL move the snake on a single-page HTML5 canvas in response to player input and grow it by classic growth (each eaten cell adds a segment) until the snake reaches its length cap of 10 segments.

#### Scenario: Classic growth
- **WHEN** the snake consumes an edible cell while it has fewer than 10 segments
- **THEN** the snake grows by one segment, increasing its length accordingly

#### Scenario: No growth past the cap
- **WHEN** the snake consumes an edible cell while it already has 10 segments
- **THEN** its length stays at 10 segments

### Requirement: Snake length cap
The system SHALL cap the snake at 10 segments. Once the snake has 10 segments, consuming an edible cell SHALL NOT add a segment, and the system SHALL record one overflow block instead. The cap SHALL apply to the snake in both roles, whether the player or the bot steers it.

#### Scenario: Growth stops at the cap
- **WHEN** the snake has 10 segments and consumes an edible cell
- **THEN** the snake still has 10 segments and the overflow count increases by 1

#### Scenario: The bot's snake is capped too
- **WHEN** the player plays the Tetris role and the bot's snake reaches 10 segments
- **THEN** the bot's snake stops growing at 10 segments

#### Scenario: A block falling onto the head does not break the cap
- **WHEN** a falling piece drops onto the head of a snake that already has 10 segments
- **THEN** the cell is consumed, the overflow count increases by 1, and the length stays 10

### Requirement: Rarity tiers from overflow blocks
The system SHALL recolour the snake's body segments from overflow blocks, one segment per overflow block, in order from the segment next to the head toward the tail. The head SHALL always be green and the body SHALL start grey. The first 9 overflow blocks SHALL turn body segments blue, the next 9 purple, and the next 9 gold. Once all body segments are gold, further overflow blocks SHALL NOT change any colour.

#### Scenario: The first overflow block colours one segment
- **WHEN** the snake reaches 10 segments and then consumes one more edible cell
- **THEN** the body segment next to the head is blue and the other eight are grey

#### Scenario: The blue wave completes
- **WHEN** the snake has 9 overflow blocks
- **THEN** all nine body segments are blue

#### Scenario: The purple wave starts at the head
- **WHEN** the snake has 10 overflow blocks
- **THEN** the body segment next to the head is purple and the other eight are blue

#### Scenario: Gold is final
- **WHEN** the snake has 27 or more overflow blocks
- **THEN** every body segment is gold

#### Scenario: Tiers change no rule
- **WHEN** a snake reaches a higher tier
- **THEN** its score, speed, growth and death conditions are unchanged

### Requirement: Landed-block difficulty ramp
The system SHALL increase fall speed every time three more pieces have completed (landed on the grid or been fully consumed by the snake), starting from a base fall speed of 0.04 cells/tick, increasing by a factor of 1.08 per three completed pieces, and capped at 0.9 cells/tick.

#### Scenario: Speed ticks up after three completed pieces
- **WHEN** three additional pieces have completed since the last tier step
- **THEN** the downward fall speed increases one step

#### Scenario: Slower start
- **WHEN** the game begins with no completed pieces
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
- **WHEN** three additional pieces have completed and the piece fall speed increases one step
- **THEN** the snake's step interval decreases by the same amount as the piece's step interval (2 ticks/cell apart, until the 1-tick/cell minimum is reached)

### Requirement: Line clear on a full row
The system SHALL clear a row when all of its cells are solid (landed) blocks, awarding 10 points to the Tetris side per cleared row. When a row clears, every solid block above that row shifts down by one cell; snake segments do not shift. A full row clears automatically; it does not require the snake to consume it. Clearing a row SHALL NOT reduce any landed-block or completed-piece count.

#### Scenario: A row fills completely
- **WHEN** every cell in a row is a solid (landed) block
- **THEN** that row is cleared, the Tetris side gains 10 points, and solid blocks above shift down by one

#### Scenario: Snake segments do not shift
- **WHEN** a row clears and snake segments sit above it
- **THEN** the snake segments remain in place while solid blocks above the cleared row shift down

#### Scenario: Multiple full rows in one tick
- **WHEN** more than one row is full at the same time
- **THEN** every full row clears, each awards 10 points, and every solid block above each cleared row shifts down by one
