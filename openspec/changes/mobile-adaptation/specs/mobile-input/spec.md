# Spec Delta

## Purpose

Defines touch controls (swipe and tap-zone steering), touch-based start/restart, and responsive canvas sizing so the game is fully playable on mobile devices while preserving all existing keyboard input and game mechanics.

## ADDED Requirements

### Requirement: Swipe steering
The system SHALL set the snake's queued direction from the dominant axis of a swipe gesture performed on the board. A swipe is a touch gesture whose total finger displacement is non-negligible relative to the board size; a gesture with negligible displacement is treated as a tap (see tap-zone steering).

#### Scenario: Horizontal swipe steers left or right
- **WHEN** the player drags a finger across the board with a dominant horizontal displacement
- **THEN** the snake's queued direction is set to the horizontal direction the finger moved (left or right)

#### Scenario: Vertical swipe steers up or down
- **WHEN** the player drags a finger across the board with a dominant vertical displacement
- **THEN** the snake's queued direction is set to the vertical direction the finger moved (up or down)

#### Scenario: Swipe respects the no-reverse rule
- **WHEN** a swipe requests a direction that is the exact opposite of the snake's current direction
- **THEN** the direction is ignored and the snake continues in its current direction

### Requirement: Tap-zone steering
The system SHALL map a tap (a touch ending with negligible displacement) to a snake direction based on which region of the board the tap falls in: a tap in the left region steers left, in the right region steers right, in the top region steers up, and in the bottom region steers down. A tap in the board's central region does not change the direction.

#### Scenario: Tap in the left region steers left
- **WHEN** the player taps in the left region of the board
- **THEN** the snake's queued direction becomes left

#### Scenario: Tap in the top region steers up
- **WHEN** the player taps in the top region of the board
- **THEN** the snake's queued direction becomes up

#### Scenario: Tap in the central region does nothing
- **WHEN** the player taps in the board's central region
- **THEN** the snake's queued direction is unchanged

#### Scenario: Tap respects the no-reverse rule
- **WHEN** a tap requests a direction that is the exact opposite of the snake's current direction
- **THEN** the direction is ignored and the snake continues in its current direction

### Requirement: Touch start and restart
The system SHALL start the game from the idle state or restart it from the game-over state in response to a single tap on the board, matching the existing click behavior (score resets to 0 on restart).

#### Scenario: Tap starts the game from idle
- **WHEN** the game is in the idle state and the player taps the board
- **THEN** the game starts playing

#### Scenario: Tap restarts the game from game over
- **WHEN** the game is in the game-over state and the player taps the board
- **THEN** a new game starts from scratch with the score reset to 0

### Requirement: Responsive canvas sizing
The system SHALL scale the playfield canvas to fit the available viewport while preserving its aspect ratio, so the full board is visible without horizontal or vertical scrolling on small screens.

#### Scenario: Canvas fits a viewport smaller than its native size
- **WHEN** the viewport is narrower or shorter than the canvas's native size
- **THEN** the canvas is uniformly scaled down to fit within the viewport while preserving its aspect ratio, and the entire board remains visible

#### Scenario: Canvas is not enlarged on larger viewports
- **WHEN** the viewport is at least as large as the canvas's native size
- **THEN** the canvas is rendered at its native size and is not enlarged

### Requirement: Touch gesture handling
The system SHALL prevent the browser from scrolling or zooming in response to touch gestures on the board, and SHALL suppress text selection and long-press context menus on the board so gestures are handled entirely as game input.

#### Scenario: A swipe does not scroll the page
- **WHEN** the player performs a swipe gesture on the board
- **THEN** the page does not scroll and the gesture is handled entirely as game input

#### Scenario: No text selection or long-press menu on the board
- **WHEN** the player touches or holds the board
- **THEN** text selection and the long-press context menu are suppressed on the board
