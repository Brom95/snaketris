# Spec Delta

## ADDED Requirements

### Requirement: Role determines which side the player controls
The system SHALL let the player choose one of two roles before a game starts: Snake or Tetris. In Snake role the player steers the snake and the bot steers the falling piece. In Tetris role the player controls the falling piece and the bot steers the snake.

#### Scenario: Snake role keeps the snake under the player
- **WHEN** the player chooses Snake role
- **THEN** the player's steering input drives the snake and the falling piece is driven by the bot

#### Scenario: Tetris role swaps the sides
- **WHEN** the player chooses Tetris role
- **THEN** the player controls the falling piece and the snake is driven by the bot

#### Scenario: Role is chosen before the game starts
- **WHEN** the player selects a role
- **THEN** the game starts with that role and the role does not change during the game

### Requirement: The side that controls the piece can shift and rotate it
The system SHALL move the falling piece sideways in response to the controlling side's input and SHALL rotate it in response to that input. The system SHALL NOT provide a drop or fast-fall control.

#### Scenario: Piece shifts sideways
- **WHEN** the controlling side requests a left or right shift while a piece is falling
- **THEN** the piece moves one cell in that direction

#### Scenario: Piece rotates
- **WHEN** the controlling side requests a rotation while a piece is falling
- **THEN** the piece's orientation changes by one quarter turn

#### Scenario: No drop control
- **WHEN** the controlling side presses any control in Tetris role
- **THEN** the piece's downward speed is unchanged by that control

### Requirement: Piece shift is throttled to the snake's speed
The system SHALL allow the piece to shift at most one cell per the snake's current step interval, so the piece's sideways speed equals the snake's speed. A shift request that arrives before that interval has elapsed SHALL be ignored. The throttle SHALL apply to the player and to the bot alike.

#### Scenario: Two rapid presses give one cell
- **WHEN** the player presses the shift key twice within one snake step interval
- **THEN** the piece moves sideways by exactly one cell

#### Scenario: Throttle follows the ramp
- **WHEN** the piece fall speed increases and the snake's step interval decreases
- **THEN** the allowed shift rate increases by the same amount

#### Scenario: The bot obeys the same throttle
- **WHEN** the bot requests a piece shift in the same interval as a player shift would
- **THEN** the bot's shift is limited to one cell per interval

### Requirement: Rotation is rejected when blocked
The system SHALL reject a rotation when any cell of the rotated piece would fall outside the playfield or overlap a solid block, and SHALL leave the piece unchanged in that case.

#### Scenario: Rotation against a wall
- **WHEN** the player requests a rotation and the rotated shape would extend past the left or right edge
- **THEN** the rotation is not applied and the piece keeps its previous orientation

#### Scenario: Rotation into a solid block
- **WHEN** the player requests a rotation and the rotated shape would overlap a solid block
- **THEN** the rotation is not applied and the piece keeps its previous orientation

### Requirement: Two scores, one per side
The system SHALL keep two separate scores in every game: one for the snake side and one for the Tetris side. The snake score increases by 1 for each cell the snake consumes. The Tetris score increases by 1 for each cell that lands as a solid block and by 10 for each cleared row.

#### Scenario: Snake eats a cell
- **WHEN** the snake consumes one cell of a falling piece
- **THEN** the snake score increases by exactly 1 and the Tetris score is unchanged

#### Scenario: A piece lands
- **WHEN** a falling piece lands
- **THEN** the Tetris score increases by the number of cells that became solid

#### Scenario: A row clears
- **WHEN** a full row clears
- **THEN** the Tetris score increases by 10 and the snake score is unchanged

#### Scenario: Snake role still keeps both scores
- **WHEN** a Snake-role game is in progress
- **THEN** the snake score is the player's score and the Tetris score is the bot's score

### Requirement: Bonus for a fully consumed piece
The system SHALL award the snake an additional 4 points when a falling piece is consumed completely, on top of the 1 point per consumed cell.

#### Scenario: Whole piece eaten
- **WHEN** the snake consumes the last remaining cell of a falling piece
- **THEN** the snake score increases by 1 for that cell and by 4 as the whole-piece bonus

#### Scenario: Partial piece eaten
- **WHEN** the snake consumes some but not all cells of a piece
- **THEN** the snake score increases only by the number of cells consumed

### Requirement: Winner is the higher side score
The system SHALL determine the winner of a game by comparing the two side scores when the game ends, and SHALL report the winner on the game-over screen.

#### Scenario: Tetris side wins
- **WHEN** a game ends and the Tetris score is higher than the snake score
- **THEN** the game-over screen reports the Tetris side as the winner

#### Scenario: Snake side wins
- **WHEN** a game ends and the snake score is higher than the Tetris score
- **THEN** the game-over screen reports the snake side as the winner

#### Scenario: Scores are equal
- **WHEN** a game ends with both scores equal
- **THEN** the game-over screen reports a draw

### Requirement: Snake starts with three segments
The system SHALL start every game with a snake of exactly three segments arranged in a straight line on the middle row of the playfield.

#### Scenario: New game starts with three segments
- **WHEN** a game starts
- **THEN** the snake has exactly three segments

#### Scenario: Restart restores three segments
- **WHEN** the player restarts after a game over
- **THEN** the snake again has exactly three segments

### Requirement: Top-out ends the game
The system SHALL end the game when a falling piece lands and none of its cells lie inside the playfield.

#### Scenario: Stack reaches the top
- **WHEN** a piece comes to rest entirely above the top row of the playfield
- **THEN** the game ends and no further pieces spawn

#### Scenario: Partial landing does not end the game
- **WHEN** a piece lands with at least one cell inside the playfield
- **THEN** the game continues

## MODIFIED Requirements

### Requirement: Eating a piece while it falls
The system SHALL consume edible pieces cell-by-cell, adding exactly 1 to the snake's score per cell, with each tick computed **snake-first** (the snake steps, then the pieces fall). Only the snake's **head** eats: the head consumes the cell it moves into, and a falling piece that drops onto the head is consumed as well. The snake's body never eats. The snake grows one segment per cell consumed.

#### Scenario: Consuming one cell
- **WHEN** the snake eats a single cell of an edible piece
- **THEN** the snake's score increases by exactly 1

#### Scenario: Eating a piece from below
- **WHEN** the snake moves upward into a falling piece
- **THEN** it consumes each cell the head reaches, not only the first one

#### Scenario: A block falls onto the head
- **WHEN** a falling piece drops onto the snake's head
- **THEN** that cell is consumed and the snake grows by one segment

#### Scenario: The body does not eat
- **WHEN** a falling piece overlaps the snake's body but not its head
- **THEN** nothing is consumed

### Requirement: Line clear on a full row
The system SHALL clear a row when all of its cells are solid (landed) blocks, awarding 10 points to the Tetris side and reducing the landed-block count by 10 per cleared row. A full row clears automatically; it does not require the snake to consume it.

#### Scenario: A row fills completely
- **WHEN** every cell in a row is a solid (landed) block
- **THEN** that row is cleared and the Tetris side gains 10 points

#### Scenario: The clear counts back the ramp
- **WHEN** a full row clears
- **THEN** the landed-block count is reduced by 10 for that row

#### Scenario: Multiple full rows in one tick
- **WHEN** more than one row is full at the same time
- **THEN** every full row clears and each awards 10 points

### Requirement: Restart after game over
The system SHALL offer a restart so the player can start again from scratch.

#### Scenario: Restarting after game over
- **WHEN** the game ends (self-collision, touching a solid block, or a top-out)
- **THEN** the player can start a new game from scratch
