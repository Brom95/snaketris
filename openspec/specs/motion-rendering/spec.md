# motion-rendering Specification

## Purpose

Defines how the canvas draws movers that travel between the cells the rules allow, so
the game reads as movement rather than a snap and a freeze, while the rules keep their
own discrete cell positions.

## Requirements

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

### Requirement: A wrapped hop is drawn at both edges

Where the board wraps an edge, the system SHALL draw a wrapped hop as the cell leaving
one edge and the same cell entering the opposite edge, and SHALL NOT slide the cell
across the whole field.

#### Scenario: A wrapped snake head exits and enters

- **WHEN** a snake head steps from the right edge to the left edge
- **THEN** the drawn head is partly out at the right edge and partly in at the left edge at the same moment

#### Scenario: No smear across the field

- **WHEN** any mover crosses a wrapped edge
- **THEN** no cell is drawn travelling through the middle of the field

### Requirement: Travel phase comes from the page's own observation

The renderer SHALL derive a mover's travel from what the page paints and from the
mover's own progress, and SHALL NOT restate a rule's legality, speed or timing. The
same travel SHALL appear on a page that simulates the match and on a page that only
receives whole states of it.

#### Scenario: The guest shows the same travel

- **WHEN** one peer simulates the match and the other only receives its states
- **THEN** both pages show the same travel of the same mover over the same cells

#### Scenario: The rules are not restated

- **WHEN** the drawing is asked whether a mover may enter a cell
- **THEN** it is not asked: the travel only runs between cells the mover already occupies

### Requirement: Travel freezes when a mover stops

When a mover stops for a reason the game declares — a death, a blocked step, a paused
or menu state — the system SHALL end its travel and draw it at the cell the rules hold,
rather than continuing or reversing an in-flight hop.

#### Scenario: A dying snake freezes rather than bouncing

- **WHEN** a snake head is drawn moving toward the cell that would kill it and the game declares the death
- **THEN** the drawn snake stops at the cell it occupies and does not oscillate toward the wall

#### Scenario: A shift blocked by the stack stays put

- **WHEN** a requested shift is refused by the rules
- **THEN** the piece stays at the column it occupies and no partial slide is shown

### Requirement: The grid the player is shown stays the coarse grid

The system SHALL keep the grid lines, the canvas buffer size and the cell size the
layout declares, so movers travel finer than the grid the player is shown rather than
the board being re-cut into smaller cells.

#### Scenario: A mover straddles a shown line

- **WHEN** a mover is drawn part-way across a cell
- **THEN** the grid lines keep their declared spacing and the mover crosses one of them

#### Scenario: No cell crosses a grid line twice

- **WHEN** a mover travels one cell
- **THEN** it crosses exactly the one grid line between its two cells

### Requirement: Travel carries no information the rules carry

The system SHALL keep travel in the painting only: a still frame taken after any number
of ticks SHALL show the same cells as the same frame drawn without travel, and the
states exchanged between peers SHALL NOT gain anything the travel needs.

#### Scenario: A still frame is unchanged

- **WHEN** a frame is captured at the same tick with travel drawing and with cell-aligned drawing
- **THEN** the occupied cells are identical

#### Scenario: No new state travels between peers

- **WHEN** peers exchange states of the match
- **THEN** the exchanged state names the same fields as before and no phase for the drawing

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
