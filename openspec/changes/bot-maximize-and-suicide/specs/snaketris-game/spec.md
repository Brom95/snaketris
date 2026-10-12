# Spec Delta — snaketris-game

## ADDED Requirements

### Requirement: Suicide gives the opponent an automatic win
The system SHALL record why a game ended and SHALL hand the win to the opponent when a side kills
itself, regardless of the two scores. When the snake dies (its head touches a solid landed block or
overlaps its own body), the Tetris side wins. When the stack tops out (a falling piece comes to rest
with none of its cells inside the playfield), the Snake side wins. The recorded cause SHALL NOT
change any other rule; it only decides the winner reported on the game-over screen.

#### Scenario: Snake suicide hands the win to Tetris
- **WHEN** the snake's head touches a solid landed block or overlaps its own body and the game ends
- **THEN** the game-over screen reports the Tetris side as the winner even if the snake score is
  higher than the Tetris score

#### Scenario: Top-out hands the win to Snake
- **WHEN** a falling piece comes to rest with none of its cells inside the playfield and the game
  ends
- **THEN** the game-over screen reports the Snake side as the winner even if the Tetris score is
  higher than the snake score

#### Scenario: A normal end still compares scores
- **WHEN** the game ends for a reason that is neither a snake death nor a top-out
- **THEN** the winner is still decided by comparing the two side scores

## MODIFIED Requirements

### Requirement: Two scores, one per side
The system SHALL keep two separate scores in every game: one for the snake side and one for the
Tetris side. The snake score increases by 1 for each cell the snake consumes. The Tetris score
increases by 3 for each cell that lands as a solid block and by 10 for each cleared row.

#### Scenario: Snake eats a cell
- **WHEN** the snake consumes one cell of a falling piece
- **THEN** the snake score increases by exactly 1 and the Tetris score is unchanged

#### Scenario: A piece lands
- **WHEN** a falling piece lands and some number of its cells become solid blocks
- **THEN** the Tetris score increases by 3 for each of those cells and the snake score is unchanged

#### Scenario: A row clears
- **WHEN** a full row clears
- **THEN** the Tetris score increases by 10 and the snake score is unchanged

#### Scenario: Snake role still keeps both scores
- **WHEN** a Snake-role game is in progress
- **THEN** the snake score is the player's score and the Tetris score is the bot's score

### Requirement: Winner is the higher side score
The system SHALL determine the winner of a game by comparing the two side scores when the game ends,
and SHALL report the winner on the game-over screen, UNLESS a side killed itself: a suicide hands
the win to the opponent outright (see "Suicide gives the opponent an automatic win") and overrides
the score comparison.

#### Scenario: Tetris side wins
- **WHEN** a game ends without a suicide and the Tetris score is higher than the snake score
- **THEN** the game-over screen reports the Tetris side as the winner

#### Scenario: Snake side wins
- **WHEN** a game ends without a suicide and the snake score is higher than the Tetris score
- **THEN** the game-over screen reports the snake side as the winner

#### Scenario: Scores are equal
- **WHEN** a game ends without a suicide and both scores are equal
- **THEN** the game-over screen reports a draw
