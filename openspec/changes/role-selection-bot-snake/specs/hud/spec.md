# Spec Delta

## ADDED Requirements

### Requirement: Game-over message names the winning side
The system SHALL show, as part of the game-over message, which side won and both final scores.

#### Scenario: Winner shown at game over
- **WHEN** a game ends
- **THEN** the game-over message names the winning side and shows both final scores

#### Scenario: Draw shown at game over
- **WHEN** a game ends with equal scores
- **THEN** the game-over message reports a draw

#### Scenario: Winner message is page text
- **WHEN** the game-over message is shown
- **THEN** the winner text is page text the browser can select and scale

## MODIFIED Requirements

### Requirement: Score readout tracks the running score
The system SHALL update the score readout as the scores change, showing the snake score and the Tetris score, each labelled with its side. The readout SHALL NOT show the chosen role name.

#### Scenario: Readout follows each cell eaten
- **WHEN** the snake consumes one cell of an edible piece
- **THEN** the snake score in the readout shows the new total, exactly one higher than before

#### Scenario: Readout shows both side scores
- **WHEN** a game is in progress in either role
- **THEN** the readout shows the snake score and the Tetris score, each labelled with its side

#### Scenario: Readout does not name the role
- **WHEN** a game is in progress
- **THEN** the readout contains no role label

#### Scenario: Readout shows zero at the start of a game
- **WHEN** a new game starts
- **THEN** every score shown in the readout is 0
