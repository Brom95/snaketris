# piece-rendering Specification

## Purpose
Defines how falling Tetris pieces are rendered relative to the snake body, so the player can tell which layer is on top.

## Requirements

### Requirement: Falling pieces render over the snake body
The system SHALL draw falling Tetris pieces after the snake in the canvas render pass, so they appear on top of the snake body rather than under it.

#### Scenario: A piece passes over the snake
- **WHEN** a falling Tetris piece overlaps a cell of the snake body during rendering
- **THEN** the piece is drawn after the snake and appears on top of it

### Requirement: The play field frame is visible

The system SHALL stroke the outer frame of the play field in the colour of landed
Tetris blocks, at a stroke width greater than the inner grid lines, so the player can
see where the field ends. The inner grid lines SHALL keep their own faint colour and
SHALL NOT be drawn over the frame.

#### Scenario: Frame reads as a wall in the block colour

- **WHEN** the field is rendered
- **THEN** its four edges are stroked in the landed-block colour and are visibly
  stronger than the inner grid lines

#### Scenario: A block against an edge touches the frame

- **WHEN** a piece lands against the left or the right edge of the field
- **THEN** the block sits flush against a frame line of the same colour, so the
  board limit is readable

#### Scenario: Inner grid stays faint

- **WHEN** the field is rendered
- **THEN** every line strictly inside the frame keeps the faint grid colour and the
  frame is the only line in the block colour

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
