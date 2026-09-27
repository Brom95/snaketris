# controller Specification

## Purpose
Defines native gamepad support so the game can be steered, navigated, and started with a standard controller (Xbox, PlayStation, or generic gamepad) via the dependency-free Web Gamepad API, coexisting with the existing keyboard and touch input.

## Requirements

### Requirement: Gamepad connection detection
The system SHALL detect when a gamepad is connected or disconnected and make controller input available only while a gamepad is connected; when no gamepad is connected, controller input contributes no input to the game.

#### Scenario: Gamepad connected enables controller input
- **WHEN** a gamepad is connected to the machine while the game is running
- **THEN** the game recognizes it and controller buttons and the left thumbstick can drive the game

#### Scenario: Gamepad disconnected stops controller input
- **WHEN** a connected gamepad is disconnected
- **THEN** subsequent controller input no longer affects the game, and no stale button or stick state from the disconnected gamepad drives the snake

### Requirement: Controller steering
The system SHALL set the snake's queued direction from the D-pad or the left thumbstick, using the same four directions (up, down, left, right) as keyboard and touch input, and SHALL route each direction through the shared direction path so that the in-game no-reverse rule applies. Specifically, the D-pad up/down/left/right buttons (standard gamepad buttons 11, 12, 13, 14) and the left thumbstick (standard axis 0 horizontal and axis 1 vertical; negative is up/left, positive is down/right) each produce the matching direction.

#### Scenario: D-pad up steers the snake up
- **WHEN** the player presses the D-pad up button while playing
- **THEN** the snake's queued direction becomes up

#### Scenario: D-pad down steers the snake down
- **WHEN** the player presses the D-pad down button while playing
- **THEN** the snake's queued direction becomes down

#### Scenario: D-pad left steers the snake left
- **WHEN** the player presses the D-pad left button while playing
- **THEN** the snake's queued direction becomes left

#### Scenario: D-pad right steers the snake right
- **WHEN** the player presses the D-pad right button while playing
- **THEN** the snake's queued direction becomes right

#### Scenario: Left-stick up steers the snake up
- **WHEN** the player pushes the left thumbstick up while playing
- **THEN** the snake's queued direction becomes up

#### Scenario: Left-stick right steers the snake right
- **WHEN** the player pushes the left thumbstick right while playing
- **THEN** the snake's queued direction becomes right

#### Scenario: Controller steering respects the no-reverse rule
- **WHEN** the player requests a direction (D-pad or left stick) that is the exact opposite of the snake's current direction
- **THEN** the direction is ignored and the snake continues in its current direction

### Requirement: Controller menu navigation and confirmation
The system SHALL let the player move the starting menu selection with the D-pad up/down or the left-stick up/down, and confirm the highlighted item with the A button (standard gamepad button 0), matching the existing keyboard menu behavior: confirming "Play" starts a new game, "Records" opens the records view, and "How to Play" opens the help view.

#### Scenario: D-pad up moves the menu selection up
- **WHEN** the starting menu is shown and the player presses the D-pad up button
- **THEN** the highlighted menu item moves up (wrapping to the top item if already at the top)

#### Scenario: D-pad down moves the menu selection down
- **WHEN** the starting menu is shown and the player presses the D-pad down button
- **THEN** the highlighted menu item moves down (wrapping to the bottom item if already at the bottom)

#### Scenario: A confirms the highlighted menu item
- **WHEN** the starting menu is shown and the player presses the A button
- **THEN** the highlighted item is confirmed: "Play" starts a new game, "Records" opens the records view, and "How to Play" opens the help view

### Requirement: Controller back and cancel
The system SHALL return to the starting menu from the Records or How-to-Play view in response to the B button (standard gamepad button 1), matching the existing keyboard return-to-menu behavior.

#### Scenario: B returns to the menu from Records
- **WHEN** the Records view is shown and the player presses the B button
- **THEN** the starting menu is shown again

#### Scenario: B returns to the menu from How to Play
- **WHEN** the How-to-Play view is shown and the player presses the B button
- **THEN** the starting menu is shown again

### Requirement: Controller start and menu return
The system SHALL start the game from the starting menu (A confirming "Play") and return to the starting menu from the game-over state in response to the A button — exactly matching the existing keyboard (R/Enter/Space) and touch (tap) behavior, so the player can then start a new game from the menu, which resets the score to 0.

#### Scenario: A starts the game from the menu
- **WHEN** the starting menu is shown with "Play" highlighted and the player presses the A button
- **THEN** the game starts playing

#### Scenario: A returns to the menu from game over
- **WHEN** the game-over screen is shown and the player presses the A button
- **THEN** the starting menu is shown again with "Play" highlighted, and a subsequent confirmation of "Play" starts a new game with the score reset to 0

### Requirement: Controller input coexists with keyboard and touch
The system SHALL allow controller, keyboard, and touch/pointer input to coexist: connecting or disconnecting a controller does not disable or change keyboard or touch behavior, and any one of the three input methods can drive the game at any time.

#### Scenario: Controller connected does not disable keyboard
- **WHEN** a gamepad is connected while the game is running
- **THEN** keyboard input continues to work exactly as before, and the player may switch between controller and keyboard without any setting

#### Scenario: Controller connected does not disable touch
- **WHEN** a gamepad is connected while the game is running
- **THEN** touch and pointer input continue to work exactly as before, and the player may switch between controller and touch without any setting
