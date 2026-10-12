# bot-opponent Specification

## Purpose
Defines the bot that drives the side the player does not choose: how it steers the snake, how it steers the falling piece, the safety and fairness rules it obeys, and what makes its behaviour reproducible.

## Requirements

### Requirement: Bot drives the side the player does not choose
The system SHALL run the bot on the snake in Tetris role and on the falling piece in Snake role. The system SHALL NOT run the bot on the side the player controls.

#### Scenario: Bot steers the snake in Tetris role
- **WHEN** the player has chosen the Tetris role and a game is in progress
- **THEN** the snake's direction is set by the bot and the piece is set by the player

#### Scenario: Bot steers the piece in Snake role
- **WHEN** the player has chosen the Snake role and a game is in progress
- **THEN** the piece's shift and rotation are set by the bot and the snake is set by the player

### Requirement: Bot chooses the snake direction
The system SHALL choose the snake's direction from the bot whenever the player controls the falling piece, and SHALL NOT accept player steering for the snake in that mode.

#### Scenario: Bot steers while the player moves the piece
- **WHEN** the player has chosen the Tetris role and a game is in progress
- **THEN** the snake's direction is set by the bot, and a player steering input does not change it

#### Scenario: Player steering still works in Snake role
- **WHEN** the player has chosen the Snake role
- **THEN** the player's steering input sets the snake's direction and no bot steering decision is applied

### Requirement: Bot obeys the shared steering rules
The system SHALL route every bot direction through the same steering path as player steering, so the in-game no-reverse rule applies to the bot in exactly the same way as to the player.

#### Scenario: Bot cannot reverse
- **WHEN** the bot's chosen direction is the exact opposite of the snake's current direction
- **THEN** that direction is not applied and the snake keeps moving in its current direction

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

#### Scenario: Bot fills a gap the snake is sitting in
- **WHEN** a row is missing exactly one cell and that cell currently holds a snake body cell
- **THEN** the bot places the piece's remaining cell into that gap, because the snake cell does not make the row full and the fill earns the row-completion score

#### Scenario: Bot avoids being eaten
- **WHEN** two placements have equal board value and the snake can reach the landing cells of one before the piece lands but not the other
- **THEN** the bot chooses the placement whose landing cells the snake cannot reach

#### Scenario: Bot cannot control the piece in Tetris role
- **WHEN** the player has chosen the Tetris role
- **THEN** the bot issues no shift or rotation for the piece

### Requirement: Bot does not oscillate
The system SHALL keep the snake's current direction whenever no other safe direction strictly improves the bot's goal value over it. A direction change requires a strictly better value; an equal value keeps the current direction. This rule applies in addition to the pursuit, exit-preference, and safety rules.

#### Scenario: Tied directions keep the current heading
- **WHEN** two safe directions tie on the bot's goal value
- **THEN** the bot keeps the snake's current direction instead of switching between them

#### Scenario: A strictly better direction is taken
- **WHEN** one safe direction improves the bot's goal value over the current direction
- **THEN** the bot takes that direction

### Requirement: Bot denies the snake free food
In Snake role, among placements whose board score is equal, the system SHALL prefer the placement whose landing cells the snake reaches least before the piece lands. The system SHALL apply this as a small additive penalty, so it SHALL NOT override a row completion or the near-complete-row bonus. A cell occupied by the snake SHALL NOT count as a solid block when the system scores the board; the system SHALL penalize such a landing cell only with that small penalty, because the snake leaves the cell. The system SHALL NOT steer the snake or the piece so that the game ends while the snake is ahead.

#### Scenario: Equal placements prefer the column farthest from the snake
- **WHEN** two placements have equal board value
- **THEN** the bot chooses the one whose landing cells are least reachable by the snake before landing

#### Scenario: Denial never lands on the snake
- **WHEN** the only denial option would land a block on a snake cell
- **THEN** the bot does not take it and keeps the fair placement

### Requirement: Bot behaviour is deterministic
The system SHALL derive every bot decision from the current game state alone, with no random input, so the same state and the same direction history produce the same decision.

#### Scenario: Same state gives the same direction
- **WHEN** the bot is asked for a direction twice from an identical game state
- **THEN** both answers are the same direction

#### Scenario: Same state gives the same piece move
- **WHEN** the bot is asked for a piece move twice from an identical game state
- **THEN** both answers are the same shift and rotation
