# hud Specification (delta)

## Requirements

### Requirement: Score readout as a page element
The system SHALL show the running score as a page element, and SHALL keep it visible for the whole duration of a game. While the interface shares a track beside the field the readout SHALL lie outside the play field; where the interface stacks above the field because the field already fills the available width, the readout SHALL instead be positioned within the stacked interface band above the field rather than overlaying the top edge of the field, so the board's top band is unobstructed and the full field height is available for play. The readout SHALL NOT overlay a field that is not on screen.

#### Scenario: Score visible while playing
- **WHEN** a game is in progress
- **THEN** the current score is shown in a page element

#### Scenario: Score never occludes the board
- **WHEN** the score readout is shown at a viewport size where the interface sits beside the field
- **THEN** it does not cover any part of the play field, and no falling piece or landed block is hidden behind it

#### Scenario: Score sits in the stacked interface band on mobile
- **WHEN** the interface stacks above the field on a narrow viewport while a game is in progress
- **THEN** the readout is positioned within the stacked interface band above the field, not overlaying the top edge of the field, and the full field height below that band is unobstructed

#### Scenario: Readout stays in the interface while the field is hidden
- **WHEN** the starting menu, the records view or the help view is shown on a narrow viewport
- **THEN** the readout is not positioned over the hidden field
