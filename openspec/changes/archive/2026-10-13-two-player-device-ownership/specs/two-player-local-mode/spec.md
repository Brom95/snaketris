# Spec Delta

## REMOVED Requirements

### Requirement: Keyboard models exclusive and gamepad shareable

Reason: gamepad is no longer shareable. Each player owns one physical pad, so the
rule that let both players pick `gamepad` is replaced by the exclusive-model rule
below.

## ADDED Requirements

### Requirement: Control models are exclusive per player

The system SHALL NOT let two players lock the same control model. A keyboard model
is one player's layout, and a gamepad is one player's device: a pad a player already
locked SHALL NOT be lockable by the other player.

#### Scenario: Second player cannot reuse a keyboard model

- **WHEN** P1 selects WASD
- **THEN** P2's selection offers only Arrows or a gamepad P1 does not own

#### Scenario: Second player cannot reuse a gamepad

- **WHEN** P1 locks a gamepad and P2 presses a pad P1 already locked
- **THEN** the lock is refused and the screen says P2 cannot use the same gamepad as P1

#### Scenario: Two players use two pads

- **WHEN** P1 locks pad 0 and P2 presses pad 1
- **THEN** both locks succeed and each player owns one pad

### Requirement: A gamepad drives the player who locked it

In two-player mode the system SHALL resolve a pad to the player who locked that pad,
and SHALL apply that player's role to the resulting action. A pad no player locked
SHALL produce no play action.

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

The system SHALL offer the two-player menu item only when the interface column does
not stack above the field, that is when the viewport is wider than the stacked-layout
threshold. At or below that threshold the item SHALL be neither shown nor reachable
by keyboard navigation.

#### Scenario: Narrow viewport hides the item

- **WHEN** the viewport width is at or below the stacked-layout threshold
- **THEN** the two-player menu item is not displayed

#### Scenario: Keyboard skips the hidden item

- **WHEN** the viewport is narrow and the menu cursor moves past the hidden item
- **THEN** the cursor jumps over it and no two-player mode starts

#### Scenario: Wide viewport offers the item

- **WHEN** the viewport is wider than the threshold
- **THEN** the item is displayed and confirming it starts two-player mode
