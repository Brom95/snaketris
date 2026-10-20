# Spec Delta

## ADDED Requirements

### Requirement: A falling piece is drawn travelling, not sunk

The system SHALL draw a falling piece between the row it left and the row it entered,
using the fractional position its own state already names, and SHALL NOT draw it in a
row below the lowest row its cells occupy.

#### Scenario: A piece is drawn mid-descent

- **WHEN** a falling piece's own progress puts it part-way between two rows
- **THEN** the piece is drawn spanning those rows, with no part of it shown in the row below the one its cells occupy

#### Scenario: The landing frame still reads as the landed cell

- **WHEN** a falling piece is stopped one row above a landed block
- **THEN** the piece is drawn level with the row it occupies, not overlapping the block below it
