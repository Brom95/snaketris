# Spec Delta

## MODIFIED Requirements

### Requirement: P1 picks a role and P2 auto-gets the other

The system SHALL let P1 choose a role on the role screen and SHALL automatically assign P2 the other
role without a separate P2 role screen. The system SHALL name each player's assigned role on that
player's own control step, so both roles stay visible through the whole preparation flow.

#### Scenario: P2 gets the remaining role

- **WHEN** P1 selects Snake
- **THEN** P2 is assigned Tetris

#### Scenario: The assignment is visible on the control steps

- **WHEN** P1 selects Snake and the flow reaches the P1 control step
- **THEN** the screen names P1 as Snake and P2 as Tetris

#### Scenario: No role is shown before one is chosen

- **WHEN** the role screen is open and no role item is confirmed yet
- **THEN** no role line prints and no player is labelled with a role

### Requirement: Role line shown above model selection

The system SHALL show a line "P1: X / P2: Y" naming each player's role on every control step,
including the step where the first player picks their controls. The line SHALL stay empty while no
role is assigned, so it never prints the text "null".

#### Scenario: Line names both roles on the first control step

- **WHEN** P1 is Snake and the P1 control step is shown
- **THEN** the line reads "P1: Snake / P2: Tetris"

#### Scenario: Line names both roles on the shared step

- **WHEN** both players confirmed and the shared step is shown
- **THEN** the line still names both roles

#### Scenario: No role assigned yet

- **WHEN** the role screen is open and P1 has not confirmed a role
- **THEN** the line is empty

### Requirement: Game-over returns to SHARED

The system SHALL return players to the SHARED control step after a two-player game ends. The step
SHALL be a screen the screen table resolves, so the control view paints and no part of the page is
blank.

#### Scenario: Game-over goes to SHARED

- **WHEN** a two-player game ends
- **THEN** the flow returns to the SHARED control step, not the main menu

#### Scenario: The SHARED step paints

- **WHEN** a two-player game ends and the page renders
- **THEN** the control view is displayed and at least one element of the interface is on screen

## ADDED Requirements

### Requirement: Each preparation stage names itself and its expected action

Every preparation stage SHALL state its own name and the action it expects from the acting player.
The stage title SHALL name the acting player and the stage position. The hint line SHALL list the
keys that advance that stage.

#### Scenario: Role screen states who picks

- **WHEN** the role screen is open in two-player mode
- **THEN** its title names P1 as the picker and states that P2 receives the other role

#### Scenario: Control step states its position

- **WHEN** the P1 control step is shown
- **THEN** the title states that this is the first of the control steps and that P1 acts

#### Scenario: Shared step states the expected action

- **WHEN** both players confirmed and the shared step is shown
- **THEN** the title states that the game starts from this step and the hint line lists the keys
      that start it

### Requirement: Each player drives their own character

In two-player mode the system SHALL drive the character of each player's own role from that
player's control model. The snake-role player SHALL steer the snake. The Tetris-role player SHALL
shift and rotate the falling piece. A control action from one player SHALL NOT move the other
player's character.

#### Scenario: Snake-role player steers the snake

- **WHEN** P1 is Snake and P1 presses a direction on their own model
- **THEN** the snake turns and the falling piece does not move

#### Scenario: Tetris-role player steers the piece

- **WHEN** P2 is Tetris and P2 presses a shift on their own model
- **THEN** the falling piece shifts and the snake keeps its direction

#### Scenario: Swapped roles swap the drivers

- **WHEN** P1 is Tetris and P2 is Snake
- **THEN** P1 drives the piece and P2 drives the snake

### Requirement: A keyboard key drives the player who locked that model

In two-player mode the system SHALL resolve a keyboard key to the player who locked that keyboard
model, and SHALL apply that player's role to the resulting action. A key from a model no player
locked SHALL produce no play action.

#### Scenario: Each keyboard model drives its own player

- **WHEN** P1 locked WASD and P2 locked Arrows, and P1 is Snake
- **THEN** a WASD key steers the snake and an Arrow key moves the piece

#### Scenario: An unclaimed model drives nothing

- **WHEN** no player locked the Arrows model
- **THEN** an Arrow key produces no play action
