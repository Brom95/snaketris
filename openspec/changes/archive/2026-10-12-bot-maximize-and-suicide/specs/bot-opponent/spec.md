# Spec Delta — bot-opponent

## MODIFIED Requirements

### Requirement: Bot steers the falling piece by simulation
In Snake role the system SHALL choose the piece's shift and rotation by simulating the landing of
every legal rotation in every reachable column, and SHALL pick the option with the highest score,
where score is 10 points per row that would become full, plus a bonus for near-complete rows, minus
2 per hole created below the piece, minus 1 per cell of resulting stack height. The simulation SHALL
read only solid blocks and the simulated piece cells when it decides whether a row is full, whether
a hole exists and how tall the stack stands; a cell occupied by the snake SHALL NOT count as a solid
block there, because the snake leaves that cell and a row with a gap the snake sits in never clears.
The simulation SHALL add a small bounded penalty for each landing cell on the snake body, on the
head's next-step cell, or on any cell the snake can reach before the piece lands, so the bot avoids
feeding the snake. This penalty SHALL be additive and small enough that it never overrides a row
completion or the near-complete-row bonus; it only breaks ties among placements of equal board value.

#### Scenario: Bot aims at a row it can complete
- **WHEN** a shift or rotation would complete a full row on landing
- **THEN** the bot chooses that option over one that does not

#### Scenario: Bot avoids leaving a hole
- **WHEN** two options complete the same number of rows and one leaves an empty cell below the piece
- **THEN** the bot chooses the option with no hole

#### Scenario: Bot does not drop a block on the snake
- **WHEN** a shift or rotation would land a block on a cell occupied by the snake body
- **THEN** the bot chooses an option that does not, if one is available

#### Scenario: Bot fills a gap the snake is sitting in
- **WHEN** a row is missing exactly one cell and that cell currently holds a snake body cell
- **THEN** the bot places the piece's remaining cell into that gap, because the snake cell does not
  make the row full and the fill earns the row-completion score

#### Scenario: Bot avoids being eaten
- **WHEN** two placements have equal board value and the snake can reach the landing cells of one
  before the piece lands but not the other
- **THEN** the bot chooses the placement whose landing cells the snake cannot reach

#### Scenario: Bot cannot control the piece in Tetris role
- **WHEN** the player has chosen the Tetris role
- **THEN** the bot issues no shift or rotation for the piece
