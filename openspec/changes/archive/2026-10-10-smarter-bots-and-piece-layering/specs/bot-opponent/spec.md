# Spec Delta

## MODIFIED Requirements

### Requirement: Bot avoids moves that end the game
The system SHALL NOT move the snake into a cell that is solid, occupied by its own body, or where a falling piece will come to rest (treated as solid), unless no other direction is available.

#### Scenario: Bot turns away from a solid block
- **WHEN** the direction the bot would otherwise take leads the head into a solid block
- **THEN** the bot chooses a different direction that does not

#### Scenario: Bot turns away from its own body
- **WHEN** the direction the bot would otherwise take leads the head into its own body
- **THEN** the bot chooses a different direction that does not

#### Scenario: Bot avoids a landing cell
- **WHEN** the direction the bot would otherwise take leads the head into a cell where a falling piece will come to rest
- **THEN** the bot treats that cell as solid and chooses a different direction that does not

#### Scenario: Bot has no safe direction
- **WHEN** every non-reversing direction leads the head into a solid block, into its own body, or into a landing cell
- **THEN** the bot keeps the current direction and the snake dies on the next step

### Requirement: Bot steers the falling piece by simulation
In Snake role the system SHALL choose the piece's shift and rotation by simulating the landing of every legal rotation in every reachable column, and SHALL pick the option with the highest score, where score is 10 points per row that would become full, minus 2 per hole created below the piece, minus 1 per cell of resulting stack height, and the simulation SHALL account for cells occupied by the snake body, so a landed block on a snake cell is penalized as if it were a solid overlap.

#### Scenario: Bot aims at a row it can complete
- **WHEN** a shift or rotation would complete a full row on landing
- **THEN** the bot chooses that option over one that does not

#### Scenario: Bot avoids leaving a hole
- **WHEN** two options complete the same number of rows and one leaves an empty cell below the piece
- **THEN** the bot chooses the option with no hole

#### Scenario: Bot does not drop a block on the snake
- **WHEN** a shift or rotation would land a block on a cell occupied by the snake body
- **THEN** the bot chooses an option that does not, if one is available

#### Scenario: Bot cannot control the piece in Tetris role
- **WHEN** the player has chosen the Tetris role
- **THEN** the bot issues no shift or rotation for the piece
