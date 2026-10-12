# Spec Delta — bot-opponent

## MODIFIED Requirements

### Requirement: Bot steers the falling piece by simulation
In Snake role the system SHALL choose the piece's shift and rotation by simulating the landing of
every legal rotation in every reachable column, and SHALL pick the option with the highest score,
where score is 10 points per row that would become full, minus 2 per hole created below the piece,
minus 1 per cell of resulting stack height, plus a bonus for near-complete rows. The simulation SHALL
account for cells occupied by the snake body and the head's next-step cell, so a landed block on a
snake cell is penalized as if it were a solid overlap. In addition, the simulation SHALL add a small
bounded penalty for each landing cell the snake can reach before the piece lands, so the bot avoids
placing blocks the snake would eat. This penalty SHALL be additive and small enough that it never
overrides a row completion or the near-complete-row bonus; it only breaks ties among placements of
equal board value.

#### Scenario: Bot aims at a row it can complete
- **WHEN** a shift or rotation would complete a full row on landing
- **THEN** the bot chooses that option over one that does not

#### Scenario: Bot avoids leaving a hole
- **WHEN** two options complete the same number of rows and one leaves an empty cell below the piece
- **THEN** the bot chooses the option with no hole

#### Scenario: Bot does not drop a block on the snake
- **WHEN** a shift or rotation would land a block on a cell occupied by the snake body
- **THEN** the bot chooses an option that does not, if one is available

#### Scenario: Bot avoids being eaten
- **WHEN** two placements have equal board value and the snake can reach the landing cells of one
  before the piece lands but not the other
- **THEN** the bot chooses the placement whose landing cells the snake cannot reach

#### Scenario: Bot cannot control the piece in Tetris role
- **WHEN** the player has chosen the Tetris role
- **THEN** the bot issues no shift or rotation for the piece
