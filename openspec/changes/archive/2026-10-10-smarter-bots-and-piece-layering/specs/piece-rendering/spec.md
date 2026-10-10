# Spec Delta

## Purpose
Defines how falling Tetris pieces are rendered relative to the snake body, so the player can tell which layer is on top.

## ADDED Requirements

### Requirement: Falling pieces render over the snake body
The system SHALL draw falling Tetris pieces after the snake in the canvas render pass, so they appear on top of the snake body rather than under it.

#### Scenario: A piece passes over the snake
- **WHEN** a falling Tetris piece overlaps a cell of the snake body during rendering
- **THEN** the piece is drawn after the snake and appears on top of it
