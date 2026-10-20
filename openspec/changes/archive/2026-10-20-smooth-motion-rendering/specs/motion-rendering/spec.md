# Spec Delta

## Purpose

Defines how the canvas draws movers that travel between the cells the rules allow, so
the game reads as movement rather than a snap and a freeze, while the rules keep their
own discrete cell positions.

## ADDED Requirements

### Requirement: Movers travel between their cells

The system SHALL draw a mover between the cell it left and the cell it entered, across
the interval the mover's own progress covers, rather than drawing it at the cell it
entered from the moment that cell is reached. This applies to a falling piece, a snake
step, and a requested piece shift.

#### Scenario: A falling piece travels

- **WHEN** a falling piece is part-way between two rows
- **THEN** the piece is drawn straddling those two rows rather than held in the upper row and snapped into the lower one

#### Scenario: A snake segment travels

- **WHEN** a snake segment is part-way from the cell it left to the cell it entered
- **THEN** that segment is drawn spanning the two cells, and the whole body reads as one continuous line

#### Scenario: A requested shift travels

- **WHEN** the Tetris player shifts a falling piece one column
- **THEN** the piece slides across the gap between the two columns instead of jumping

#### Scenario: Speeds stay the rules' own

- **WHEN** a mover travels
- **THEN** it covers exactly one cell per interval the rules set, so a slower or faster mover is one the rules made slower or faster, not one the drawing sped up

### Requirement: A drawn position never implies a position the rules forbid

The system SHALL keep the drawn position of a mover inside the travel the rules allow:
it SHALL NOT draw a mover in a cell it does not occupy on either side of that travel.

#### Scenario: A falling piece does not sink

- **WHEN** a falling piece is one row above a landed block or the floor
- **THEN** the piece is never drawn occupying that block's or floor-adjacent row before the rules have landed it there

#### Scenario: A snake does not pass a wall

- **WHEN** a snake head is drawn travelling toward a wall or a landed block
- **THEN** it stops at the edge of the cell it legally entered and is never drawn inside the obstruction

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

### Requirement: Events with no interval stay instant

For a change that has no interval to travel across — a rotation, an eaten piece cell, a
line clear dropping the stack — the system SHALL keep its current instant change of
cells.

#### Scenario: A rotation stays a swap

- **WHEN** a falling piece rotates
- **THEN** its cells change at once, as they do today

#### Scenario: A cleared row drops at once

- **WHEN** a line clears
- **THEN** the blocks above it move down in one step of the rules, with no animated drop
