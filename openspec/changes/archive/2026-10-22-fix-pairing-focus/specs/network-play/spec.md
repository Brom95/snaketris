# Spec Delta

## MODIFIED Requirements

### Requirement: The pairing step keeps its confirm control reachable while the address field is focused

The pairing step SHALL keep its confirm control reachable when the address field has focus, so the player can confirm pairing without first dismissing the address field. The address field SHALL NOT be held in focus after input, so an open virtual keyboard does not stay open and cover the confirm control. The address field SHALL be focused when the step is entered and SHALL NOT be re-focused on later frames of the same step.

#### Scenario: Pair is reachable after an address is supplied on a phone
- **WHEN** the player has supplied an address (typed or auto-detected) and the virtual keyboard is open on the pairing step
- **THEN** the player can still tap the confirm control without the keyboard covering it, and the address field is not re-focused, so the keyboard does not reopen and cover the confirm control again

#### Scenario: The address field is focused once per step entry
- **WHEN** the player enters the pairing step and the address field is not focused
- **THEN** the field is focused once, and later frames of the same step do not re-focus it

#### Scenario: The address field is not held in focus after input
- **WHEN** the player has supplied an address and the step keeps the field focused
- **THEN** the field is not re-focused, so the keyboard does not reopen and cover the confirm control again
