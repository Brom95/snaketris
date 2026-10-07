# highscores Specification

## Purpose
A persistent top-10 high-score leaderboard that records each finished game's player-side score with the date and the role it was achieved under, stores the top 10 in the browser's local storage, and displays them in the records view.

## Requirements

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

### Requirement: Persist top 10 in local storage
The system SHALL persist the high-score board in the browser's local storage so it survives page reloads and sessions.

#### Scenario: Scores survive a reload
- **WHEN** the player records a score and then reloads the page
- **THEN** the recorded score is still present in the board

### Requirement: Retain only the top 10 highest scores
The system SHALL keep only the ten highest scores in the board, removing lower scores when the board is full and a new score ranks within the top 10.

#### Scenario: Board holds at most ten entries
- **WHEN** more than ten games have been recorded
- **THEN** the board contains only the ten highest scores

#### Scenario: New score ranks in top 10
- **WHEN** a finished game's score ranks among the top 10
- **THEN** it is added to the board and, if the board was already full, the lowest entry is removed

### Requirement: Display top 10 with dates
The system SHALL display the board's scores in the records view in descending order, each entry showing its score, its date, and its role.

#### Scenario: List shows top 10 with dates
- **WHEN** the records view is opened and the board has entries
- **THEN** the scores are listed from highest to lowest, each entry showing the score, its date, and its role

#### Scenario: Fewer than ten entries
- **WHEN** the records view is opened and the board has fewer than ten entries
- **THEN** all existing entries are listed without padding or filler

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

### Requirement: Empty board state
The system SHALL show a clear indicator in the records view when no scores have been recorded yet.

#### Scenario: No scores recorded
- **WHEN** the records view is opened and no games have been recorded
- **THEN** the records view shows an empty-state message (for example, "No scores yet")
