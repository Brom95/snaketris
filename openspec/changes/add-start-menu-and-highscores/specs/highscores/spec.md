# Spec Delta

## Purpose

A persistent top-10 high-score leaderboard that records each finished game's final score with the date it was achieved, stores the top 10 in the browser's local storage, and displays them in the records view.

## ADDED Requirements

### Requirement: Record finished-game score
The system SHALL record the final score of a game when the game ends, together with the date the score was achieved.

#### Scenario: Score recorded on game over
- **WHEN** a game ends
- **THEN** the game's final score is recorded with the current date

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
The system SHALL display the board's scores in the records view in descending order, each entry showing its score and its date.

#### Scenario: List shows top 10 with dates
- **WHEN** the records view is opened and the board has entries
- **THEN** the scores are listed from highest to lowest, each entry showing the score and its date

#### Scenario: Fewer than ten entries
- **WHEN** the records view is opened and the board has fewer than ten entries
- **THEN** all existing entries are listed without padding or filler

### Requirement: Empty board state
The system SHALL show a clear indicator in the records view when no scores have been recorded yet.

#### Scenario: No scores recorded
- **WHEN** the records view is opened and no games have been recorded
- **THEN** the records view shows an empty-state message (for example, "No scores yet")
