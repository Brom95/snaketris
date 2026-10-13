# Spec Delta

## ADDED Requirements

### Requirement: One board per duration
The system SHALL keep three separate high-score boards, one per selectable match duration (1 minute, 3 minutes and 5 minutes). Each board SHALL persist its own top 10 in its own local-storage key. A score SHALL be recorded only into the board of the duration that match used.

#### Scenario: A 3-minute score lands on the 3-minute board
- **WHEN** a 3-minute match ends and its score is recorded
- **THEN** the entry is stored in the 3-minute board and the 1-minute and 5-minute boards are unchanged

#### Scenario: Boards do not mix
- **WHEN** the 1-minute board holds ten entries and a 5-minute match records a higher score
- **THEN** the 5-minute board gains that entry and the 1-minute board keeps its own ten entries

## MODIFIED Requirements

### Requirement: Record finished-game score
The system SHALL record the player's final score into the board of the match duration when a game ends, together with the date the score was achieved and the role the player played.

#### Scenario: Score recorded on game over
- **WHEN** a game ends
- **THEN** the player's final score is recorded with the current date and the role the player chose into the board of that match's duration

#### Scenario: Snake role records the snake score
- **WHEN** a Snake-role game ends
- **THEN** the recorded score is the snake's score and the entry is marked as Snake role

#### Scenario: Tetris role records the Tetris score
- **WHEN** a Tetris-role game ends
- **THEN** the recorded score is the Tetris side's score and the entry is marked as Tetris role

### Requirement: Persist top 10 in local storage
The system SHALL persist each duration board in the browser's local storage, one key per duration, so each board survives page reloads and sessions. The system SHALL NOT read the board stored before this split, so entries recorded before the split are not shown.

#### Scenario: Scores survive a reload
- **WHEN** the player records a score and then reloads the page
- **THEN** the recorded score is still present in the board of its duration

#### Scenario: Boards stay separate across reloads
- **WHEN** scores are recorded for two different durations and the page reloads
- **THEN** each board still holds its own entries

#### Scenario: Pre-split entries are not shown
- **WHEN** the records view is opened on a browser that holds only pre-split entries
- **THEN** every board shows its empty state and no pre-split entry is listed

### Requirement: Retain only the top 10 highest scores
The system SHALL keep only the ten highest scores in each duration board, removing lower scores when that board is full and a new score ranks within its top 10.

#### Scenario: Board holds at most ten entries
- **WHEN** more than ten games have been recorded for one duration
- **THEN** that board contains only the ten highest scores for that duration

#### Scenario: New score ranks in top 10
- **WHEN** a finished game's score ranks among the top 10 of its duration board
- **THEN** it is added to that board and, if the board was already full, its lowest entry is removed

### Requirement: Display top 10 with dates
The system SHALL display the selected duration board's scores in the records view in descending order, each entry showing its score, its date, and its role.

#### Scenario: List shows top 10 with dates
- **WHEN** the records view is opened with a duration selected and that board has entries
- **THEN** that board's scores are listed from highest to lowest, each entry showing the score, its date, and its role

#### Scenario: Fewer than ten entries
- **WHEN** the records view is opened with a duration selected and that board has fewer than ten entries
- **THEN** all existing entries are listed without padding or filler

### Requirement: Empty board state
The system SHALL show a clear indicator in the records view when the selected duration board has no scores recorded yet.

#### Scenario: No scores recorded
- **WHEN** the records view is opened with a duration selected and no games have been recorded for that duration
- **THEN** the records view shows an empty-state message (for example, "No scores yet")

#### Scenario: One board empty, another filled
- **WHEN** the 5-minute board has no entries and the 1-minute board has entries
- **THEN** selecting 5 minutes shows the empty-state message and selecting 1 minute lists its scores

### Requirement: Record both sides in two-player mode
The system SHALL, in two-player mode, record both sides' scores as two entries for a finished game in the board of that match's duration, each with the date and its role.

#### Scenario: Two-player game records two entries
- **WHEN** a two-player game ends
- **THEN** two entries are recorded in the board of that match's duration, one per side
