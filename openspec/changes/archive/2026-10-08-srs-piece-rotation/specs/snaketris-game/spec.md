# snaketris-game Delta

## ADDED Requirements

### Requirement: Pieces rotate through SRS rotation states
The system SHALL store four rotation states for each of the seven tetrominoes, following the Super Rotation System, and SHALL rotate a piece by moving it to the next state in the cycle. Rotating the O piece SHALL have no effect.

#### Scenario: A quarter turn moves to the next state
- **WHEN** the controlling side requests a clockwise rotation of a piece in state 0
- **THEN** the piece occupies the cells of that piece's state 1

#### Scenario: Four clockwise rotations return to the first state
- **WHEN** the controlling side requests four clockwise rotations in a row and none is blocked
- **THEN** the piece is back in state 0

#### Scenario: The O piece does not move
- **WHEN** the controlling side requests a rotation of the O piece
- **THEN** the cells occupied by the piece are unchanged

### Requirement: Blocked rotations try the SRS wall kicks
The system SHALL try the wall-kick offsets of the rotation transition in their standard order and SHALL apply the first offset that keeps the piece inside the playfield and clear of solid blocks.

#### Scenario: A kick moves the piece away from a wall
- **WHEN** a rotation would place a cell past the left or right edge, and a later kick offset of the same transition fits
- **THEN** the rotation is applied with that kick offset

#### Scenario: Every kick is blocked
- **WHEN** no kick offset of the transition fits
- **THEN** the rotation is not applied and the piece is unchanged

### Requirement: Rotation does not interrupt the fall
The system SHALL keep a falling piece moving downward at the current fall speed after a rotation. A rotation SHALL NOT change the fall speed, the spawn interval, or the interval between piece steps.

#### Scenario: The fall continues through a rotation
- **WHEN** the controlling side rotates a falling piece and the rotation is applied
- **THEN** the piece moves downward on the next tick at the same speed as before the rotation

## MODIFIED Requirements

### Requirement: Rotation is rejected when blocked
The system SHALL reject a rotation when no wall-kick offset of the transition keeps the rotated piece inside the playfield and clear of solid blocks, and SHALL leave the piece unchanged in that case.

#### Scenario: Rotation against a wall
- **WHEN** the player requests a rotation and every kick offset of the transition would extend the piece past the left or right edge
- **THEN** the rotation is not applied and the piece keeps its previous orientation

#### Scenario: Rotation into a solid block
- **WHEN** the player requests a rotation and every kick offset of the transition would overlap a solid block
- **THEN** the rotation is not applied and the piece keeps its previous orientation
