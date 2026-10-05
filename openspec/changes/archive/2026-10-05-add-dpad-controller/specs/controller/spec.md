# controller — Delta Spec

## MODIFIED Requirements

### Requirement: Controller steering

The system SHALL set the snake's queued direction from the D-pad or the left thumbstick, using the same four directions (up, down, left, right) as keyboard and touch input, and SHALL route each direction through the shared direction path so that the in-game no-reverse rule applies. Specifically, the D-pad up/down/left/right buttons (standard gamepad buttons **12, 13, 14, 15**) and the left thumbstick (standard axis 0 horizontal and axis 1 vertical; negative is up/left, positive is down/right) each produce the matching direction.

**Rationale:** Per the W3C Web Gamepad API specification, D-pad buttons are mapped to indices 12 (up), 13 (down), 14 (left), 15 (right). The previous text cited 11-14, which does not match any standard gamepad layout and causes all four D-pad directions to read from the wrong button array entries.

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
