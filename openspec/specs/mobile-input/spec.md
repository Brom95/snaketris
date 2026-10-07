# mobile-input Specification

## Purpose
Defines touch controls for the role the player chose — snake steering by swipe and tap zones, or piece shift and rotation in Tetris role — plus touch-based start/restart and responsive canvas sizing, so the game is fully playable on mobile devices while preserving all existing keyboard input and game mechanics.

## Requirements

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

### Requirement: Touch piece control in Tetris role
In Tetris role the system SHALL map a tap in the left or right region of the board to a sideways shift of the falling piece, a tap in the centre region to a rotation, and a swipe with a dominant vertical displacement to a rotation, and SHALL NOT interpret any touch gesture as snake steering.

#### Scenario: Tap in the left region shifts the piece left
- **WHEN** the player taps the left region of the board while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the left

#### Scenario: Tap in the right region shifts the piece right
- **WHEN** the player taps the right region of the board while a piece is falling in Tetris role
- **THEN** the piece shifts one cell to the right

#### Scenario: Tap in the centre region rotates the piece
- **WHEN** the player taps the centre region of the board while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn

#### Scenario: Vertical swipe rotates the piece
- **WHEN** the player performs a swipe with a dominant vertical displacement while a piece is falling in Tetris role
- **THEN** the piece rotates one quarter turn in the direction of the swipe

#### Scenario: Touch does not steer the snake in Tetris role
- **WHEN** the player performs any swipe or tap on the board while a game is in progress in Tetris role
- **THEN** the snake's direction is unchanged

### Requirement: Touch start and restart
The system SHALL start the game from the idle state or restart it from the game-over state in response to a single tap on the board, matching the existing click behavior (score resets to 0 on restart).

#### Scenario: Tap starts the game from idle
- **WHEN** the game is in the idle state and the player taps the board
- **THEN** the game starts playing

#### Scenario: Tap restarts the game from game over
- **WHEN** the game is in the game-over state and the player taps the board
- **THEN** a new game starts from scratch with the score reset to 0

### Requirement: Responsive canvas sizing
The system SHALL scale the playfield canvas to fit the available viewport while preserving its aspect ratio, inscribing it into the smaller side of the viewport — where the height available to the field is the viewport height less the band the stacked interface occupies on that axis, and that band is zero while the interface shares a track beside the field — (it may enlarge beyond its native size on larger screens), and SHALL inset the field from the top and bottom viewport edges by at least one board cell, so that the full board is always visible without horizontal or vertical scrolling and the board has clear breathing room at the top and bottom of the screen. The interface SHALL be sized and placed by its own rule and SHALL NOT scale with the field.

#### Scenario: Canvas fits a viewport smaller than its native size
- **WHEN** the viewport is narrower or shorter than the canvas's native size
- **THEN** the canvas is uniformly scaled down, inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without horizontal or vertical scrolling

#### Scenario: Canvas is not enlarged on larger viewports
- **WHEN** the viewport is at least as large as the canvas's native size
- **THEN** the canvas is enlarged to fill the smaller of the viewport width and the height remaining to the field after the stacked interface band (width or height) while preserving its aspect ratio, remains inset from the top and bottom viewport edges by at least one board cell, and the entire board remains visible without scrolling

#### Scenario: Interface keeps its own size while the field enlarges
- **WHEN** the viewport is large enough that the field is enlarged to fill the smaller dimension available to it
- **THEN** the interface is not scaled by the field's factor and remains fully visible without scrolling

### Requirement: Touch gesture handling
The system SHALL prevent the browser from scrolling or zooming in response to touch gestures performed on the board, and SHALL suppress text selection and long-press context menus on the board so gestures are handled entirely as game input. These rules SHALL apply to the board only; the interface elements are ordinary page content and keep their normal browser touch behaviour.

#### Scenario: A swipe does not scroll the page
- **WHEN** the player performs a swipe gesture on the board
- **THEN** the page does not scroll and the gesture is handled entirely as game input

#### Scenario: No text selection or long-press menu on the board
- **WHEN** the player touches or holds on the board
- **THEN** text selection and the long-press context menu are suppressed on the board

#### Scenario: Interface text is not gesture-suppressed
- **WHEN** the player touches an interface element such as a menu label
- **THEN** normal browser touch behaviour applies to that element and it is not treated as a steering gesture
