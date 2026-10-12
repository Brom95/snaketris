# Select-Control Steps — Spec Delta

## ADDED Requirements

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
The system SHALL return players to the SHARED screen (not the main menu) after a game ends.

#### Scenario: Game-over goes to SHARED
- **WHEN** a game ends
- **THEN** the flow returns to the SHARED screen, not the main menu

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
