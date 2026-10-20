# Spec Delta

## MODIFIED Requirements

### Requirement: Movers travel between their cells

The system SHALL draw a mover between the cells it moved between, across the interval that
mover's own progress covers, rather than drawing it at the cells it entered from the moment
they are reached. This applies to a falling piece, a snake step, a requested piece shift, and
a rotation of a falling piece.

#### Scenario: A falling piece travels

- **WHEN** a falling piece is part-way between two rows
- **THEN** the piece is drawn straddling those two rows rather than held in the upper row and
  snapped into the lower one

#### Scenario: A snake segment travels

- **WHEN** a snake segment is part-way from the cell it left to the cell it entered
- **THEN** that segment is drawn spanning the two cells, and the whole body reads as one
  continuous line

#### Scenario: A requested shift travels

- **WHEN** the Tetris player shifts a falling piece one column
- **THEN** the piece slides across the gap between the two columns instead of jumping

#### Scenario: Speeds stay the rules' own

- **WHEN** a mover travels
- **THEN** it covers exactly one cell per interval the rules set, so a slower or faster mover
  is one the rules made slower or faster, not one the drawing sped up

#### Scenario: A rotating piece travels

- **WHEN** a falling piece rotates
- **THEN** its cells are drawn moving from the cells they occupied to the cells they occupy
  now, over a few rendered frames, instead of appearing in their new cells at once

### Requirement: A drawn position never implies a position the rules forbid

The system SHALL keep the drawn position of a mover inside the travel the rules allow: it
SHALL NOT draw a mover in a cell it does not occupy on either side of that travel. A mover
that changes direction is drawn along the path its body drew, so the change of direction is
drawn where the rules change it; a rotation sweeps only inside the box its cells fill before
and after the turn.

#### Scenario: A falling piece does not sink

- **WHEN** a falling piece is one row above a landed block or the floor
- **THEN** the piece is never drawn occupying that block's or floor-adjacent row before the
  rules have landed it there

#### Scenario: A snake does not pass a wall

- **WHEN** a snake head is drawn travelling toward a wall or a landed block
- **THEN** it stops at the edge of the cell it legally entered and is never drawn inside the
  obstruction

#### Scenario: A snake turns at the cell it turns at

- **WHEN** a snake turned at one cell and its segments are drawn part-way around that turn
- **THEN** a drawn square stays at the cell the rules turned at, the body keeps its one-cell
  spacing around the turn, and no drawn square sits in a cell the body's turn did not pass
  through

## REMOVED Requirements

### Requirement: Events with no interval stay instant

**Reason**: a rotation is no longer an instant change of cells — it is drawn travelling over a
few frames, so it no longer belongs in this case; the requirement's remaining cases are restated,
with their scenarios, by the requirement that replaces it.

**Replacement**: `A change that neither travels nor sweeps stays instant`


## ADDED Requirements

### Requirement: A change that neither travels nor sweeps stays instant

For a change that has no interval to travel across and no shape to sweep — an eaten piece
cell, a line clear dropping the stack — the system SHALL keep its current instant change of
cells.

#### Scenario: A cleared row drops at once

- **WHEN** a line clears
- **THEN** the blocks above it move down in one step of the rules, with no animated drop

#### Scenario: An eaten cell stays cut

- **WHEN** the snake eats part of a falling piece
- **THEN** the piece loses that cell at once, with no animated bite

#### Scenario: A refused rotation stays put

- **WHEN** the rules refuse a rotation because the turned shape fits nowhere
- **THEN** the piece is drawn in the cells it occupies and no sweep is shown

### Requirement: A rotation is drawn walking around its pivot

The system SHALL draw a rotation as the piece's cells walking a quarter turn around the pivot
the rules turn about, over a fixed few frames named in the render layer, and SHALL end the
walk at the cells the rules hold. The drawing SHALL NOT keep an angle of its own: the sweep is
derived from the same progress every other mover uses.

#### Scenario: A turn caught mid-sweep

- **WHEN** a falling piece rotated and the frames since have not run out
- **THEN** each of its cells is drawn between where it started and where the turn leaves it,
  and the piece reads mid-turn rather than snapped to its new shape

#### Scenario: A turn that also kicked the piece

- **WHEN** the rules rotate a piece and move it to make the turned shape fit
- **THEN** the drawn cells carry that move as well as the sweep

#### Scenario: The turn lands where the rules say

- **WHEN** the rotation's frames have run out
- **THEN** the piece is drawn exactly at the cells the rules hold

#### Scenario: A page that only receives states turns alike

- **WHEN** a page applying whole states of the match sees a piece's shape change
- **THEN** that piece is drawn walking through the same turn as the page that ran the rules
