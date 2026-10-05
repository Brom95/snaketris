# Spec Delta

## ADDED Requirements

### Requirement: Menu items have distinct spacing and hit targets
The system SHALL space the three starting-menu items ("Play", "Records", "How to Play") apart from one another, so that each item is a distinct target rather than a dense block of labels. The spacing SHALL be large enough that tapping one item does not select a neighbour by accident.

#### Scenario: Items are spaced apart
- **WHEN** the starting menu is shown
- **THEN** the three items are separated from one another (not clustered together) and each has its own distinct hit area

#### Scenario: Tapping an item selects only that item
- **WHEN** the player taps one menu item while the menu is shown
- **THEN** only that item is selected, and no other item is selected by the same tap
