# two-player-local-mode Specification

## Purpose
A local two-player mode in which two humans share the one 10x20 grid: P1 picks a role and P2 automatically gets the other, each player confirms a control model by pressing that model's key, and no bot drives either side.

## Requirements

### Requirement: Two players share one grid
The system SHALL run both sides as human in two-player mode on the single 10x20 grid, and SHALL NOT run the bot because both sides are human.

#### Scenario: Bot is not run in two-player mode
- **WHEN** a two-player game starts
- **THEN** no bot drives the snake or the falling piece

### Requirement: P1 picks a role and P2 auto-gets the other
The system SHALL let P1 choose a role on the role screen and SHALL automatically assign P2 the other role without a separate P2 role screen. The system SHALL name each player's assigned role on that player's own control step, so both roles stay visible through the whole preparation flow.

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
The system SHALL show a line "P1: X / P2: Y" naming each player's role on every control step, including the step where the first player picks their controls. The line SHALL stay empty while no role is assigned, so it never prints the text "null".

#### Scenario: Line names both roles on the first control step
- **WHEN** P1 is Snake and the P1 control step is shown
- **THEN** the line reads "P1: Snake / P2: Tetris"

#### Scenario: Line names both roles on the shared step
- **WHEN** both players confirmed and the shared step is shown
- **THEN** the line still names both roles

#### Scenario: No role assigned yet
- **WHEN** the role screen is open and P1 has not confirmed a role
- **THEN** the line is empty

### Requirement: Control model confirmed by pressed key
The system SHALL let each player select a control model (WASD, Arrows, or Gamepad) by pressing that model's key. Selection and confirmation are separate stages: pressing a layout key selects that layout for the player who has not yet chosen; an explicit confirm action (Space, Enter, click on Start, or A on gamepad) locks the selection. If a different layout is pressed before confirmation, it replaces the previous selection. The system SHALL show each player's current selection with a checkmark and layout name, indicate which player is choosing next, display an error message when P2 tries to pick the same keyboard layout as P1 without locking P2 out, and keep the Start button hidden until both players confirm without conflict.

#### Scenario: Select with any layout key
- **WHEN** a player presses WASD, arrows, or a gamepad button
- **THEN** that layout is selected for the player who has not yet chosen

#### Scenario: Confirmation locks the selection
- **WHEN** a player presses Space, Enter, clicks Start, or presses A on gamepad
- **THEN** the player's selection is locked and the flow moves to the next player

#### Scenario: Different layout replaces previous selection
- **WHEN** a player presses a key from a different layout before confirming
- **THEN** the new selection replaces the previous one

#### Scenario: Confirm with the model's key
- **WHEN** P1 selects WASD
- **THEN** pressing a WASD key confirms P1's model and the flow moves to P2's confirmation

#### Scenario: Player can change their choice
- **WHEN** a player presses the "Change" button for their item
- **THEN** the player's confirmation is cleared and they can press a key again to re-confirm

#### Scenario: Visual feedback shows selected layout
- **WHEN** a player selects or confirms their control model
- **THEN** the player's item shows a checkmark and the layout name (e.g. "P1: WASD ✓")

#### Scenario: Who is choosing next is indicated
- **WHEN** P1 has confirmed but P2 has not
- **THEN** the screen highlights or indicates that P2 is choosing next

#### Scenario: Error when P2 picks same layout as P1
- **WHEN** P2 selects a keyboard layout that matches P1's selected layout
- **THEN** an error message displays "P2: cannot use the same layout as P1" and P2 has not confirmed

#### Scenario: Start button hidden until both confirm
- **WHEN** only one player has confirmed
- **THEN** the Start button is not shown on the screen

### Requirement: Control models are exclusive per player
The system SHALL NOT let two players lock the same control model. A keyboard model is one player's layout, and a gamepad is one player's device: a pad a player already locked SHALL NOT be lockable by the other player.

#### Scenario: Second player cannot reuse a keyboard model
- **WHEN** P1 selects WASD
- **THEN** P2's selection offers only Arrows or a gamepad P1 does not own

#### Scenario: Second player cannot reuse a gamepad
- **WHEN** P1 locks a gamepad and P2 presses a pad P1 already locked
- **THEN** the lock is refused and the screen says P2 cannot use the same gamepad as P1

#### Scenario: Two players use two pads
- **WHEN** P1 locks pad 0 and P2 presses pad 1
- **THEN** both locks succeed and each player owns one pad

### Requirement: One item per display in SELECT_CONTROL
The system SHALL show exactly one selectable item at a time in SELECT_CONTROL. The item occupies the full width of the menu area with large, centered text. When the user acts on the current item, the next item appears; no more than one selectable choice is shown per screen display.

#### Scenario: Only one item visible
- **WHEN** any step in SELECT_CONTROL is shown
- **THEN** exactly one item is on screen and all other items are hidden

#### Scenario: Item replaces the full menu area
- **WHEN** a step is shown
- **THEN** the item text is large, centered, and occupies the full width of the menu area

### Requirement: Per-player screens
The system SHALL present the confirmation flow in separate per-player screens: P1 has their own screen, P2 has their own screen. Each player sees only their own prompt on their own screen.

#### Scenario: P1 screen shows only P1's prompt
- **WHEN** the P1 step is shown
- **THEN** only P1's selection/confirm prompt is on screen and P2's prompt is hidden

#### Scenario: P2 screen shows only P2's prompt
- **WHEN** the P2 step is shown
- **THEN** only P2's selection/confirm prompt is on screen and P1's prompt is hidden

### Requirement: One key press confirms
The system SHALL confirm a player's layout with a single key press (no two-step select→confirm). Pressing any of the layout keys immediately locks that player's choice.

#### Scenario: Single key press confirms P1
- **WHEN** P1 presses any layout key on their screen
- **THEN** P1's layout is confirmed immediately (no separate confirm step)

### Requirement: Reset control after confirm
The system SHALL show a small reset control (with an emoji marker) in the status row, visible only after a player has confirmed. Pressing it clears that player's selection so they can pick again.

#### Scenario: Reset appears after confirm
- **WHEN** a player has confirmed their layout
- **THEN** the small reset control is visible in the status row for that player

### Requirement: Back navigation
The system SHALL provide a Back control on every screen to return to the previous step (bidirectional navigation).

#### Scenario: Back returns to previous step
- **WHEN** the user presses Back on any confirmation screen
- **THEN** the flow returns to the previous step

### Requirement: Merged SHARED after P2
The system SHALL show a merged SHARED screen after P2 confirms. The SHARED screen shows BOTH assigned layouts together with a Start button.

#### Scenario: SHARED shows both assignments
- **WHEN** P2 has confirmed
- **THEN** the SHARED screen shows both assigned layouts and a Start button

### Requirement: Game-over returns to SHARED
The system SHALL return players to the SHARED control step (not the main menu) after a two-player game ends. The step SHALL be a screen the screen table resolves, so the control view paints and no part of the page is blank.

#### Scenario: Game-over goes to SHARED
- **WHEN** a two-player game ends
- **THEN** the flow returns to the SHARED control step, not the main menu

#### Scenario: The SHARED step paints
- **WHEN** a two-player game ends and the page renders
- **THEN** the control view is displayed and at least one element of the interface is on screen

### Requirement: Explicit key hints per step
The system SHALL display, below each item, a line of explicit key hints showing which keys unlock that step. The hints use keyboard glyph names (W, A, S, D, ↑ ↓ ← →, Enter, Space, Esc) and are shown in a smaller font than the item text.

#### Scenario: P1 select step shows WASD hint
- **WHEN** the P1 selection step is shown
- **THEN** the key hints show "W / A / S / D" as the keys to press for that step

#### Scenario: Confirm step shows Enter hint
- **WHEN** a confirmation step is shown
- **THEN** the key hints show "Enter / Space" as the keys to confirm

### Requirement: Emoji markers on items
The system SHALL prefix each SELECT_CONTROL item with an emoji identifying the player and layout type. P1 uses 🎮, P2 uses 🕹, keyboard-WASD uses ⌨️, keyboard-Arrows uses ⬆⬇⬅⬆, gamepad uses 🎯.

#### Scenario: P1 item shows emoji
- **WHEN** the P1 selection step is shown
- **THEN** the item text begins with the 🎮 marker

### Requirement: Sequential step order
The system SHALL present SELECT_CONTROL steps in this order: (1) P1 screen, (2) P2 screen, (3) SHARED. Each step appears only after the previous step's action is complete.

#### Scenario: Steps appear in order
- **WHEN** P1 has confirmed but P2 has not
- **THEN** the P2 screen is shown and the SHARED screen is hidden

### Requirement: Each preparation stage names itself and its expected action
Every preparation stage SHALL state its own name and the action it expects from the acting player. The stage title SHALL name the acting player and the stage position. The hint line SHALL list the keys that advance that stage.

#### Scenario: Role screen states who picks
- **WHEN** the role screen is open in two-player mode
- **THEN** its title names P1 as the picker and states that P2 receives the other role

#### Scenario: Control step states its position
- **WHEN** the P1 control step is shown
- **THEN** the title states that this is the first of the control steps and that P1 acts

#### Scenario: Shared step states the expected action
- **WHEN** both players confirmed and the shared step is shown
- **THEN** the title states that the game starts from this step and the hint line lists the keys that start it

### Requirement: Each player drives their own character
In two-player mode the system SHALL drive the character of each player's own role from that player's control model. The snake-role player SHALL steer the snake. The Tetris-role player SHALL shift and rotate the falling piece. A control action from one player SHALL NOT move the other player's character.

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
In two-player mode the system SHALL resolve a keyboard key to the player who locked that keyboard model, and SHALL apply that player's role to the resulting action. A key from a model no player locked SHALL produce no play action.

#### Scenario: Each keyboard model drives its own player
- **WHEN** P1 locked WASD and P2 locked Arrows, and P1 is Snake
- **THEN** a WASD key steers the snake and an Arrow key moves the piece

#### Scenario: An unclaimed model drives nothing
- **WHEN** no player locked the Arrows model
- **THEN** an Arrow key produces no play action

### Requirement: A gamepad drives the player who locked it
In two-player mode the system SHALL resolve a pad to the player who locked that pad, and SHALL apply that player's role to the resulting action. A pad no player locked SHALL produce no play action.

#### Scenario: Each pad drives its own player
- **WHEN** P1 locked pad 0 as Snake and P2 locked pad 1 as Tetris
- **THEN** a press on pad 0 steers the snake and a press on pad 1 moves the piece

#### Scenario: An unowned pad drives nothing
- **WHEN** no player locked pad 1
- **THEN** a press on pad 1 produces no play action

#### Scenario: Single player keeps one pad
- **WHEN** only one player is in the game
- **THEN** any connected pad drives that player

### Requirement: Two-player mode is offered only on a wide viewport
The system SHALL offer the two-player menu item only when the interface column does not stack above the field, that is when the viewport is wider than the stacked-layout threshold. At or below that threshold the item SHALL be neither shown nor reachable by keyboard navigation.

#### Scenario: Narrow viewport hides the item
- **WHEN** the viewport width is at or below the stacked-layout threshold
- **THEN** the two-player menu item is not displayed

#### Scenario: Keyboard skips the hidden item
- **WHEN** the viewport is narrow and the menu cursor moves past the hidden item
- **THEN** the cursor jumps over it and no two-player mode starts

#### Scenario: Wide viewport offers the item
- **WHEN** the viewport is wider than the threshold
- **THEN** the item is displayed and confirming it starts two-player mode
