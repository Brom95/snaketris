# Spec Delta

## Purpose

Defines the text that accompanies live play — the running score readout and the game-over status message — as page elements outside the play field, so both stay legible and positioned without depending on the board's scale.

## ADDED Requirements

### Requirement: Score readout as a page element
The system SHALL show the running score as a page element, and SHALL keep it visible for the whole duration of a game. While the interface shares a track beside the field the readout SHALL lie outside the play field; where the interface stacks above the field because the field already fills the available width, the readout SHALL instead overlay the top edge of the field, so the board can use the height the readout would otherwise take from it. The readout SHALL NOT overlay a field that is not on screen.

#### Scenario: Score visible while playing
- **WHEN** a game is in progress
- **THEN** the current score is shown in a page element

#### Scenario: Score never occludes the board
- **WHEN** the score readout is shown at a viewport size where the interface sits beside the field
- **THEN** it does not cover any part of the play field, and no falling piece or landed block is hidden behind it

#### Scenario: Score overlays the field top on a stacked layout
- **WHEN** the interface stacks above the field on a narrow viewport while a game is in progress
- **THEN** the readout sits over the top edge of the field, confined to that top band, and the rest of the board is unobstructed

#### Scenario: Readout stays in the interface while the field is hidden
- **WHEN** the starting menu, the records view or the help view is shown on a narrow viewport
- **THEN** the readout is not positioned over the hidden field

### Requirement: Score readout tracks the running score
The system SHALL update the score readout as the score changes, one increment per cell consumed.

#### Scenario: Readout follows each cell eaten
- **WHEN** the snake consumes one cell of an edible piece
- **THEN** the score readout shows the new total, exactly one higher than before

#### Scenario: Readout shows zero at the start of a game
- **WHEN** a new game starts
- **THEN** the score readout shows 0

### Requirement: Game-over status message as a page element
The system SHALL show the game-over status message, including how to return to the starting menu, as a page element outside the play field rather than as text painted over the board.

#### Scenario: Game-over message shown when a game ends
- **WHEN** a game ends
- **THEN** the game-over message is shown as a page element and the final board remains visible in the play field

#### Scenario: Game-over message stays legible on a small viewport
- **WHEN** the game-over message is shown on a narrow phone viewport
- **THEN** the message is fully visible without horizontal scrolling

### Requirement: Interface text is real page text
The system SHALL render the interface text — the score readout, the game-over message, and the menu, records and help views — as page text rather than as painted pixels, so the browser can select it, scale it on user request, and read it to assistive technology.

#### Scenario: Interface text is selectable
- **WHEN** the player selects interface text with the pointer or a keyboard shortcut
- **THEN** the browser selects that text as ordinary page text

#### Scenario: Interface text is reachable to assistive technology
- **WHEN** a screen reader inspects the page while any interface view is shown
- **THEN** the visible interface text is exposed as page content it can read
