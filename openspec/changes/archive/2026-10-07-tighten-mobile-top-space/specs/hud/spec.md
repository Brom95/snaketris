# hud Specification (delta)

## REMOVED Requirements

### Requirement: Score readout as a page element
**Reason**: the requirement stated that the readout overlays the top edge of the field when the interface stacks above it. The readout now sits inside the interface band, so the placement rule is restated under a new name.
**Migration**: see the added requirements "Score readout is a page element" and "Score readout placement follows the layout".

## ADDED Requirements

### Requirement: Score readout is a page element
The system SHALL show the running score as a page element, and SHALL keep it visible for the whole duration of a game.

#### Scenario: Score visible while playing
- **WHEN** a game is in progress
- **THEN** the current score is shown in a page element

#### Scenario: Readout stays in the interface while the field is hidden
- **WHEN** the starting menu, the records view or the help view is shown on a narrow viewport
- **THEN** the readout is not positioned over the hidden field

### Requirement: Score readout placement follows the layout
Where the interface shares a track beside the field, the readout SHALL lie outside the play field. Where the interface stacks above the field, the readout SHALL sit inside the interface band above the field, not over the field.

#### Scenario: Score never occludes the board
- **WHEN** the score readout is shown at a viewport size where the interface sits beside the field
- **THEN** it does not cover any part of the play field, and no falling piece or landed block is hidden behind it

#### Scenario: Score sits in the stacked interface band on mobile
- **WHEN** the interface stacks above the field on a narrow viewport while a game is in progress
- **THEN** the readout is positioned within the stacked interface band above the field, not overlaying the top edge of the field, and the full field height below that band is unobstructed
