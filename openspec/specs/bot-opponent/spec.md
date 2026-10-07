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
The system SHALL NOT move the snake into a cell that is solid or that is occupied by its own body, unless no other direction is available.

#### Scenario: Bot turns away from a solid block
- **WHEN** the direction the bot would otherwise take leads the head into a solid block
- **THEN** the bot chooses a different direction that does not

#### Scenario: Bot turns away from its own body
- **WHEN** the direction the bot would otherwise take leads the head into its own body
- **THEN** the bot chooses a different direction that does not

#### Scenario: Bot has no safe direction
- **WHEN** every non-reversing direction leads the head into a solid block or into its own body
- **THEN** the bot keeps the current direction and the snake dies on the next step

### Requirement: Bot pursues the falling piece
The system SHALL make the bot move the snake head toward the nearest cell of the falling piece that lies inside the playfield, measured on the wrap-around board, whenever at least one safe direction reduces that distance. While the piece is entirely above the playfield, the bot has no target.

#### Scenario: Bot closes on a falling piece
- **WHEN** a piece is falling inside the playfield and a safe direction brings the head closer to the nearest cell of that piece
- **THEN** the bot chooses that direction

#### Scenario: Bot ignores a piece above the board
- **WHEN** the falling piece is entirely above the top row of the playfield
- **THEN** the bot keeps the current direction as long as it is safe

#### Scenario: Bot wanders with no piece on the board
- **WHEN** no piece is falling
- **THEN** the bot keeps the current direction as long as it is safe

### Requirement: Bot prefers directions that keep an exit
The system SHALL, among the safe directions, prefer a direction from which the snake still has at least one safe direction on the next step. The system SHALL fall back to any safe direction when no direction keeps an exit.

#### Scenario: Bot avoids a dead end
- **WHEN** one safe direction leads to a cell with no safe direction on the next step and another safe direction does not
- **THEN** the bot chooses the direction that keeps an exit

#### Scenario: Every safe direction is a dead end
- **WHEN** no safe direction leaves an exit on the next step
- **THEN** the bot still chooses a safe direction by its normal goal

### Requirement: Bot steers the falling piece by simulation
In Snake role the system SHALL choose the piece's shift and rotation by simulating the landing of every legal rotation in every reachable column, and SHALL pick the option with the highest score, where score is 10 points per row that would become full, minus 2 per hole created below the piece, minus 1 per cell of resulting stack height.

#### Scenario: Bot aims at a row it can complete
- **WHEN** a shift or rotation would complete a full row on landing
- **THEN** the bot chooses that option over one that does not

#### Scenario: Bot avoids leaving a hole
- **WHEN** two options complete the same number of rows and one leaves an empty cell below the piece
- **THEN** the bot chooses the option with no hole

#### Scenario: Bot cannot control the piece in Tetris role
- **WHEN** the player has chosen the Tetris role
- **THEN** the bot issues no shift or rotation for the piece

### Requirement: Bot behaviour is deterministic
The system SHALL derive every bot decision from the current game state alone, with no random input, so the same state and the same direction history produce the same decision.

#### Scenario: Same state gives the same direction
- **WHEN** the bot is asked for a direction twice from an identical game state
- **THEN** both answers are the same direction

#### Scenario: Same state gives the same piece move
- **WHEN** the bot is asked for a piece move twice from an identical game state
- **THEN** both answers are the same shift and rotation
