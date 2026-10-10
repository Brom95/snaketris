# Spec Delta

## ADDED Requirements

### Requirement: Two connected gamepads routed by connection order
The system SHALL route two connected gamepads to their players by connection order - the first connected pad is P1 and the second is P2 - and SHALL keep a separate edge-detection state for each pad.

#### Scenario: First pad is P1
- **WHEN** the first gamepad is connected
- **THEN** it is routed to P1 with its own edge-detection state

#### Scenario: Second pad is P2
- **WHEN** the second gamepad is connected
- **THEN** it is routed to P2 and keeps a separate edge-detection state from P1's pad
