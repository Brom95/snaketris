# Spec Delta

## ADDED Requirements

### Requirement: Countdown readout is a page element
The system SHALL show the remaining match time during play as a page element outside the play field, and SHALL keep it visible for the whole duration of a match.

#### Scenario: Countdown visible while playing
- **WHEN** a match is in progress
- **THEN** the remaining time is shown in a page element

#### Scenario: Countdown is not painted on the board
- **WHEN** a match is in progress
- **THEN** the countdown is page text, not pixels painted onto the play field

### Requirement: Countdown readout shows plain seconds remaining
The countdown readout SHALL show the number of whole seconds remaining in the match. It SHALL NOT show a minutes-and-seconds form and SHALL NOT show a unit suffix.

#### Scenario: Three minutes starts at 180
- **WHEN** a 3-minute match starts
- **THEN** the countdown readout shows 180

#### Scenario: Seconds tick down
- **WHEN** one second of match time has passed in a 3-minute match
- **THEN** the countdown readout shows 179

#### Scenario: The last second before the match ends
- **WHEN** one tick of match time remains
- **THEN** the countdown readout shows 0 and the match ends

### Requirement: Countdown readout placement follows the score readout
Where the interface shares a track beside the field, the countdown readout SHALL lie outside the play field. Where the interface stacks above the field, the countdown readout SHALL sit in the interface band above the field, beside the score readout, not over the field.

#### Scenario: Countdown never occludes the board
- **WHEN** the countdown readout is shown at a viewport size where the interface sits beside the field
- **THEN** it does not cover any part of the play field, and no falling piece or landed block is hidden behind it

#### Scenario: Countdown sits in the stacked interface band on mobile
- **WHEN** the interface stacks above the field on a narrow viewport while a match is in progress
- **THEN** the countdown readout is positioned within the stacked interface band above the field, not overlaying the top edge of the field

### Requirement: Countdown readout is hidden outside play
The system SHALL hide the countdown readout while the starting menu, the duration sub-menu, the role sub-menu, a control step, the records view or the help view is shown.

#### Scenario: Countdown hidden on the menu
- **WHEN** the starting menu is shown
- **THEN** the countdown readout is not shown

#### Scenario: Countdown hidden on the duration sub-menu
- **WHEN** the duration sub-menu is shown
- **THEN** the countdown readout is not shown

## MODIFIED Requirements

### Requirement: Game-over message names the winning side
The system SHALL show, as part of the game-over message, which side won, both final scores, and the reason the match ended. For a match that ended because the countdown reached zero, the reason SHALL read "time up".

#### Scenario: Winner shown at game over
- **WHEN** a match ends
- **THEN** the game-over message names the winning side, shows both final scores and names the reason the match ended

#### Scenario: Time-up reason shown at game over
- **WHEN** a match ends because the countdown reached zero
- **THEN** the game-over message names the reason as "time up"

#### Scenario: Draw shown at game over
- **WHEN** a match ends with equal scores
- **THEN** the game-over message reports a draw

#### Scenario: Winner message is page text
- **WHEN** the game-over message is shown
- **THEN** the winner text is page text the browser can select and scale

### Requirement: Interface text is real page text
The system SHALL render the interface text — the score readout, the countdown readout, the game-over message, and the menu, records and help views — as page text rather than as painted pixels, so the browser can select it, scale it on user request, and read it to assistive technology.

#### Scenario: Interface text is selectable
- **WHEN** the player selects interface text with the pointer or a keyboard shortcut
- **THEN** the browser selects that text as ordinary page text

#### Scenario: Interface text is reachable to assistive technology
- **WHEN** a screen reader inspects the page while any interface view is shown
- **THEN** the visible interface text is exposed as page content it can read
