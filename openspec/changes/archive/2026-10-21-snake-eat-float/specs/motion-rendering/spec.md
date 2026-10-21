# Spec Delta

## ADDED Requirements

### Requirement: A growth segment shows the eaten block travelling to the tail
When the snake grows by eating a piece cell, the system SHALL draw a separate floating segment that stands for the eaten block, starting at the eat point, travelling along the snake body to the tail, and merging there so the tail reads as one longer segment. The segment SHALL travel only as a paint overlay on the body cells the rules already occupy and SHALL NOT change which cells the rules hold or add anything to the exchanged match state. The eaten cell is still cut from the piece at once.

#### Scenario: A growth segment flies to the tail
- **WHEN** the snake grows by eating a piece cell
- **THEN** a floating segment is drawn at the eat point and moves along the body to the tail, where it merges and the tail becomes one longer

#### Scenario: The eaten cell is still cut at once
- **WHEN** the snake eats part of a falling piece
- **THEN** the piece loses that cell at once, and the growth segment travels as a separate element rather than animating the eaten cell on the piece

#### Scenario: Several segments fly at the same time
- **WHEN** the snake grows more than once within one segment's travel
- **THEN** each grown block is drawn as its own segment flying to the tail at the same time

#### Scenario: A segment at the length cap does not grow the tail
- **WHEN** the snake is at its maximum length (10 segments) and eats a cell
- **THEN** no growth segment flies; the cell is recorded as overflow and the tail stays the same length
