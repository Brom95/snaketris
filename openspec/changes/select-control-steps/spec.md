# Select-Control Steps — Spec Delta

## Purpose (new)
The SELECT_CONTROL screen SHALL present the control-confirmation flow as a sequential step-by-step sequence. At any moment exactly one item is shown, replacing the entire menu area. Each item carries explicit key hints showing which keys unlock that step. Emoji markers identify the player and layout type.

## Requirements (delta)

### Requirement: One item per display in SELECT_CONTROL
The system SHALL show exactly one selectable item at a time in SELECT_CONTROL. The item occupies the full width of the menu area with large, centered text. When the user acts on the current item, the next item appears; no more than one selectable choice is shown per screen display.

#### Scenario: Only one item visible
- **WHEN** any step in SELECT_CONTROL is shown
- **THEN** exactly one item is on screen and all other items are hidden

#### Scenario: Item replaces the full menu area
- **WHEN** a step is shown
- **THEN** the item text is large, centered, and occupies the full width of the menu area

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
The system SHALL present SELECT_CONTROL steps in this order: (1) P1 select, (2) P1 confirm, (3) P2 select, (4) P2 confirm, (5) Start. Each step appears only after the previous step's action is complete.

#### Scenario: Steps appear in order
- **WHEN** P1 has selected but not confirmed
- **THEN** the P1 confirm step is shown and the P2 select step is hidden
