# responsive-layout Specification (delta)

## MODIFIED Requirements

### Requirement: Interface never overlaps the play field
The system SHALL place the interface so it does not cover any part of the play field at any supported viewport size. No interface element — score readout, menu, records, help or game-over message — SHALL cover the field.

#### Scenario: No overlap on a wide viewport
- **WHEN** the game is shown on a wide desktop viewport
- **THEN** score, menu, records, help and game-over elements sit clear of the field

#### Scenario: No overlap on a narrow viewport
- **WHEN** the game is shown on a narrow phone viewport where the field already fills the available width
- **THEN** the menu, records, help and game-over elements are placed clear of the field, and the field keeps its contain-fit rule with the height the stacked interface occupies subtracted from the height it may use

## REMOVED Requirements

### Requirement: Stacked interface yields its band to the field
**Reason**: the requirement counted an overlaid score readout as a band element that reserves no height. The readout now occupies the band, so the rule is restated under a new name without that scenario.
**Migration**: see the added requirement "Stacked interface band and mobile gap".

## ADDED Requirements

### Requirement: Stacked interface band and mobile gap
The system SHALL subtract the stacked interface band from the field's available height when the interface stacks above the field, so the board never extends past the viewport. On narrow viewports (≤ 760 px), the vertical gap between the viewport top and the field is reduced from `FIELD_V_GAP` to a smaller value (`FIELD_V_GAP_MOBILE`), so the board starts higher on screen and uses more of the available height.

#### Scenario: Stacked interface yields its band
- **WHEN** the interface stacks above the field on a narrow viewport
- **THEN** the field's available height is reduced by the interface band, and the field does not extend past the viewport bottom

#### Scenario: Tightened top gap on mobile
- **WHEN** the viewport width is ≤ 760 px
- **THEN** the vertical gap above the field is `FIELD_V_GAP_MOBILE` (≤ 24 px), not `FIELD_V_GAP` (48 px)

#### Scenario: Phone viewport shares its height between field and interface
- **WHEN** the game is shown on a phone viewport whose width forces the interface to stack above the field
- **THEN** the field is scaled to the height left after the interface band and the two together occupy no more than the viewport height

#### Scenario: Beside layout reserves nothing
- **WHEN** the interface shares a track beside the field on a wide viewport
- **THEN** the field is scaled by the plain contain-fit rule with no height reserved for the interface
