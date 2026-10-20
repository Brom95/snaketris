## ADDED Requirements

### Requirement: The pairing step reaches every line it paints

The pairing step SHALL show every line it paints, however tall the step has grown. A step taller than the pane it sits in SHALL scroll within that pane, and SHALL NOT hide its lower lines below the pane's edge. The step SHALL NOT be shrunk to fit, and the pane SHALL NOT grow past the space the layout gives it.

#### Scenario: a phone opens a pairing link and the step grows

- **WHEN** a 375px-wide phone opens a link its peer published, so the step grows past the height the layout gives it
- **THEN** every line of the step is reachable by scrolling it, and its lower edge is not cut at the bezel
