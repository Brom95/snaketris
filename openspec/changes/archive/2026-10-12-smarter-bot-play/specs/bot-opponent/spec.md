# Spec Delta — bot-opponent

## ADDED Requirements

### Requirement: Bot does not oscillate
The system SHALL keep the snake's current direction whenever no other safe direction strictly improves the bot's goal value over it. A direction change requires a strictly better value; an equal value keeps the current direction. This rule applies in addition to the pursuit, exit-preference, and safety rules.

#### Scenario: Tied directions keep the current heading
- **WHEN** two safe directions tie on the bot's goal value
- **THEN** the bot keeps the snake's current direction instead of switching between them

#### Scenario: A strictly better direction is taken
- **WHEN** one safe direction improves the bot's goal value over the current direction
- **THEN** the bot takes that direction

### Requirement: Bot denies the snake free food
In Snake role, among placements whose board score is equal, the system SHALL prefer the placement
whose landing cells the snake reaches least before the piece lands. The system SHALL apply this as a
small additive penalty, so it SHALL NOT override a row completion or the near-complete-row bonus. A
cell occupied by the snake SHALL NOT count as a solid block when the system scores the board; the
system SHALL penalize such a landing cell only with that small penalty, because the snake leaves the
cell. The system SHALL NOT steer the snake or the piece so that the game ends while the snake is ahead.

#### Scenario: Equal placements prefer the column farthest from the snake
- **WHEN** two placements have equal board value
- **THEN** the bot chooses the one whose landing cells are least reachable by the snake before landing

#### Scenario: Denial never lands on the snake
- **WHEN** the only denial option would land a block on a snake cell
- **THEN** the bot does not take it and keeps the fair placement

## MODIFIED Requirements

### Requirement: Bot pursues the falling piece
The system SHALL make the bot move the snake head toward the predicted position of the nearest cell of the falling piece that lies inside the playfield, measured on the wrap-around board, whenever at least one safe direction reduces that distance. While the piece is entirely above the playfield, the bot has no target.

#### Scenario: Bot chases the predicted piece cell
- **WHEN** a piece is falling inside the playfield and a safe direction brings the head closer to the predicted position of its nearest cell
- **THEN** the bot chooses that direction

#### Scenario: Bot ignores a piece above the board
- **WHEN** the falling piece is entirely above the top row of the playfield
- **THEN** the bot keeps the current direction as long as it is safe

#### Scenario: Bot wanders with no piece on the board
- **WHEN** no piece is falling
- **THEN** the bot keeps the current direction as long as it is safe

### Requirement: Bot prefers directions that keep an exit
The system SHALL, among the safe directions, prefer a direction from which the snake can still reach at least three further steps. The system SHALL fall back to any safe direction when no direction keeps such an exit.

#### Scenario: Bot avoids a dead end
- **WHEN** one safe direction leads to a cell whose reachable cells do not extend past three steps and another safe direction does
- **THEN** the bot chooses the direction that keeps an exit

#### Scenario: Every safe direction is a dead end
- **WHEN** no safe direction leaves an exit beyond three steps on the next step
- **THEN** the bot still chooses a safe direction by its normal goal

### Requirement: Bot steers the falling piece by simulation
In Snake role the system SHALL choose the piece's shift and rotation by simulating the landing of every legal rotation in every reachable column, and SHALL pick the option with the highest score, where score is 10 points per row that would become full, plus a bonus for near-complete rows, minus 2 per hole created below the piece, minus 1 per cell of resulting stack height. The simulation SHALL read only solid blocks and the simulated piece cells when it decides whether a row is full, whether a hole exists and how tall the stack stands; a cell occupied by the snake SHALL NOT count as a solid block there, because the snake leaves that cell and a row with a gap the snake sits in never clears. The simulation SHALL add a small bounded penalty for each landing cell on the snake body, on the head's next-step cell, or on any cell the snake can reach before the piece lands, so the bot avoids feeding the snake. This penalty SHALL be additive and small enough that it never overrides a row completion or the near-complete-row bonus; it only breaks ties among placements of equal board value.

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
