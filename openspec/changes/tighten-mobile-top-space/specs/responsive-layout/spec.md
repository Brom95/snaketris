# responsive-layout Specification (delta)

## Requirements

### Requirement: Stacked interface yields its band to the field
The system SHALL subtract the stacked interface band from the field's available height when the interface stacks above the field, so the board never extends past the viewport. On narrow viewports (≤ 760 px), the vertical gap between the viewport top and the field is reduced from `FIELD_V_GAP` to a smaller value (`FIELD_V_GAP_MOBILE`), so the board starts higher on screen and uses more of the available height.

#### Scenario: Stacked interface yields its band
- **WHEN** the interface stacks above the field on a narrow viewport
- **THEN** the field's available height is reduced by the interface band, and the field does not extend past the viewport bottom

#### Scenario: Tightened top gap on mobile
- **WHEN** the viewport width is ≤ 760 px
- **THEN** the vertical gap above the field is `FIELD_V_GAP_MOBILE` (≤ 24 px), not `FIELD_V_GAP` (48 px)
