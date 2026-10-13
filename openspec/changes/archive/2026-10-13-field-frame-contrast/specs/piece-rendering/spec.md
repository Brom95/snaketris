# Spec Delta

## ADDED Requirements

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
