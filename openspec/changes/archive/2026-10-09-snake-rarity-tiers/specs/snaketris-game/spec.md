# Spec Delta

## ADDED Requirements

### Requirement: Snake length cap
The system SHALL cap the snake at 8 segments. Once the snake has 8 segments, consuming an edible cell SHALL NOT add a segment, and the system SHALL record one overflow block instead. The cap SHALL apply to the snake in both roles, whether the player or the bot steers it.

#### Scenario: Growth stops at the cap
- **WHEN** the snake has 8 segments and consumes an edible cell
- **THEN** the snake still has 8 segments and the overflow count increases by 1

#### Scenario: The bot's snake is capped too
- **WHEN** the player plays the Tetris role and the bot's snake reaches 8 segments
- **THEN** the bot's snake stops growing at 8 segments

#### Scenario: A block falling onto the head does not break the cap
- **WHEN** a falling piece drops onto the head of a snake that already has 8 segments
- **THEN** the cell is consumed, the overflow count increases by 1, and the length stays 8

### Requirement: Rarity tiers from overflow blocks
The system SHALL recolour the snake's body segments from overflow blocks, one segment per overflow block, in order from the segment next to the head toward the tail. The head SHALL always be green and the body SHALL start grey. The first 7 overflow blocks SHALL turn body segments blue, the next 7 purple, and the next 7 gold. Once all body segments are gold, further overflow blocks SHALL NOT change any colour.

#### Scenario: The first overflow block colours one segment
- **WHEN** the snake reaches 8 segments and then consumes one more edible cell
- **THEN** the body segment next to the head is blue and the other six are grey

#### Scenario: The blue wave completes
- **WHEN** the snake has 7 overflow blocks
- **THEN** all seven body segments are blue

#### Scenario: The purple wave starts at the head
- **WHEN** the snake has 8 overflow blocks
- **THEN** the body segment next to the head is purple and the other six are blue

#### Scenario: Gold is final
- **WHEN** the snake has 21 or more overflow blocks
- **THEN** every body segment is gold

#### Scenario: Tiers change no rule
- **WHEN** a snake reaches a higher tier
- **THEN** its score, speed, growth and death conditions are unchanged

### Requirement: Restart clears the tier progress
The system SHALL reset the overflow count to zero when a new game starts.

#### Scenario: Restart returns the snake to grey
- **WHEN** the player starts a new game after a game over
- **THEN** the overflow count is zero and every body segment is grey

## MODIFIED Requirements

### Requirement: Snake movement and classic growth
The system SHALL move the snake on a single-page HTML5 canvas in response to player input and grow it by classic growth (each eaten cell adds a segment) until the snake reaches its length cap of 8 segments.

#### Scenario: Classic growth
- **WHEN** the snake consumes an edible cell while it has fewer than 8 segments
- **THEN** the snake grows by one segment, increasing its length accordingly

#### Scenario: No growth past the cap
- **WHEN** the snake consumes an edible cell while it already has 8 segments
- **THEN** its length stays at 8 segments

### Requirement: Eating a piece while it falls
The system SHALL consume edible pieces cell-by-cell, adding exactly 1 to the snake's score per cell, with each tick computed **snake-first** (the snake steps, then the pieces fall). Only the snake's **head** eats: the head consumes the cell it moves into, and a falling piece that drops onto the head is consumed as well. The snake's body never eats. The snake grows one segment per cell consumed until it reaches its length cap.

#### Scenario: Consuming one cell
- **WHEN** the snake eats a single cell of an edible piece
- **THEN** the snake's score increases by exactly 1

#### Scenario: Eating a piece from below
- **WHEN** the snake moves upward into a falling piece
- **THEN** it consumes each cell the head reaches, not only the first one

#### Scenario: A block falls onto the head
- **WHEN** a falling piece drops onto the snake's head
- **THEN** that cell is consumed

#### Scenario: The body does not eat
- **WHEN** a falling piece overlaps the snake's body but not its head
- **THEN** nothing is consumed

### Requirement: Snake starts with three segments
The system SHALL start every game with a snake of exactly three segments arranged in a straight line on the middle row of the playfield, with a green head and two grey body segments.

#### Scenario: New game starts with three segments
- **WHEN** a game starts
- **THEN** the snake has exactly three segments

#### Scenario: Restart restores three segments
- **WHEN** the player restarts after a game over
- **THEN** the snake again has exactly three segments
