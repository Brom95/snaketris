# Spec Delta

## ADDED Requirements

### Requirement: Each record entry shows its role
The system SHALL show the role the score was recorded under on every entry in the records view, using the role's marker (Snake: 🐍, Tetris: 🏗️).

#### Scenario: Entry is labelled with its role
- **WHEN** the records view is opened and the board has entries
- **THEN** every listed entry shows the role it was recorded under

#### Scenario: Mixed roles in one board
- **WHEN** the records view is opened and entries exist for both roles
- **THEN** the entries are listed together in one descending score list, each showing its own role marker

### Requirement: Entries without a role are read as Snake role
The system SHALL treat a stored entry that has no role field as a Snake-role entry, so records made before role selection remain visible and correctly marked.

#### Scenario: Legacy entry appears as Snake
- **WHEN** the records view is opened and the stored board contains an entry with no role field
- **THEN** that entry is listed with the Snake role marker

## MODIFIED Requirements

### Requirement: Record finished-game score
The system SHALL record the player's final score when a game ends, together with the date the score was achieved and the role the player played.

#### Scenario: Score recorded on game over
- **WHEN** a game ends
- **THEN** the player's final score is recorded with the current date and the role the player chose

#### Scenario: Snake role records the snake score
- **WHEN** a Snake-role game ends
- **THEN** the recorded score is the snake's score and the entry is marked as Snake role

#### Scenario: Tetris role records the Tetris score
- **WHEN** a Tetris-role game ends
- **THEN** the recorded score is the Tetris side's score and the entry is marked as Tetris role

### Requirement: Display top 10 with dates
The system SHALL display the board's scores in the records view in descending order, each entry showing its score, its date, and its role.

#### Scenario: List shows top 10 with dates
- **WHEN** the records view is opened and the board has entries
- **THEN** the scores are listed from highest to lowest, each entry showing the score, its date, and its role

#### Scenario: Fewer than ten entries
- **WHEN** the records view is opened and the board has fewer than ten entries
- **THEN** all existing entries are listed without padding or filler
