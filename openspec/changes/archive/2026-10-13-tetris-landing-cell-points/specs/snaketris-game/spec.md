# Spec Delta

## MODIFIED Requirements

### Requirement: Two scores, one per side
The system SHALL keep two separate scores in every game: one for the snake side and one for the Tetris side. The snake score increases by 1 for each cell the snake consumes. The Tetris score increases by 2 for each cell that lands as a solid block and by 10 for each cleared row.

#### Scenario: Snake eats a cell
- **WHEN** the snake consumes one cell of a falling piece
- **THEN** the snake score increases by exactly 1 and the Tetris score is unchanged

#### Scenario: A piece lands
- **WHEN** a falling piece lands and some number of its cells become solid blocks
- **THEN** the Tetris score increases by 2 for each of those cells and the snake score is unchanged

#### Scenario: A row clears
- **WHEN** a full row clears
- **THEN** the Tetris score increases by 10 and the snake score is unchanged

#### Scenario: Snake role still keeps both scores
- **WHEN** a Snake-role game is in progress
- **THEN** the snake score is the player's score and the Tetris score is the bot's score
