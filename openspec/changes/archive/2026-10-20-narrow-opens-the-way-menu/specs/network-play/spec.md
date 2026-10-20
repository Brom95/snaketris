## MODIFIED Requirements

### Requirement: The network way is offered on a narrow viewport

The system SHALL offer the network way of the "Two Players" entry at every
viewport width, including the narrow stacked layout, because each peer plays on
its own device. On a narrow viewport the system SHALL open the way sub-menu with
the network way and the way back, and SHALL NOT offer the shared-page way there.
The wide-viewport rule that gates the same-computer way SHALL NOT gate the
network way.

#### Scenario: The way is offered on a phone

- **WHEN** the viewport is at or below the stacked-layout threshold and the player confirms the "Two Players" entry
- **THEN** the way sub-menu is shown, offers the network way, and picking it shows the pairing step with the network mode in play

#### Scenario: The same-computer way stays wide-only

- **WHEN** the viewport is at or below the stacked-layout threshold
- **THEN** the same-computer way is not offered and the network way is
