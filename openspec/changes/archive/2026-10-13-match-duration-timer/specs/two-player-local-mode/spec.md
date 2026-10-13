# Spec Delta

## ADDED Requirements

### Requirement: Duration is chosen once before the first match
In two-player mode the system SHALL open the duration sub-menu once, before P1 picks a role. The confirmed duration SHALL apply to the first match and to every rematch in the same preparation flow.

#### Scenario: Duration screen opens after Two Players is selected
- **WHEN** the player selects "Two Players" on a wide viewport
- **THEN** the duration sub-menu is shown before any role screen and the play field is not shown

#### Scenario: The duration is not asked again on a rematch
- **WHEN** a two-player match ends and the flow returns to the shared control step
- **THEN** the duration sub-menu is not shown again and the rematch uses the duration chosen before the first match

## MODIFIED Requirements

### Requirement: Game-over returns to SHARED
The system SHALL return players to the SHARED control step (not the main menu) after a two-player game ends. The step SHALL be a screen the screen table resolves, so the control view paints and no part of the page is blank. The rematch SHALL keep the duration chosen before the first match.

#### Scenario: Game-over goes to SHARED
- **WHEN** a two-player game ends
- **THEN** the flow returns to the SHARED control step, not the main menu

#### Scenario: The SHARED step paints
- **WHEN** a two-player game ends and the page renders
- **THEN** the control view is displayed and at least one element of the interface is on screen

#### Scenario: The rematch keeps the duration
- **WHEN** a two-player match ends and the players start a rematch from the SHARED step
- **THEN** the rematch counts down from the duration chosen before the first match

### Requirement: Back navigation
The system SHALL provide a Back control on every screen to return to the previous step (bidirectional navigation). The role screen's previous step is the duration sub-menu.

#### Scenario: Back returns to previous step
- **WHEN** the user presses Back on any confirmation screen
- **THEN** the flow returns to the previous step

#### Scenario: Back from the role screen returns to the duration sub-menu
- **WHEN** the user presses Back on the role screen in two-player mode
- **THEN** the duration sub-menu is shown again and no match has started
