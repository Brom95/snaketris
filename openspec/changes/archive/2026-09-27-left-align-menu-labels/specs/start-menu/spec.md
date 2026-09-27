# Spec Delta

## ADDED Requirements

### Requirement: Menu labels are left-aligned with the block centered
The system SHALL render the starting menu's labels — the "snaketris" title, the three menu items ("Play", "Records", "How to Play"), and the navigation hint line — left-aligned so that every label line begins at the same horizontal position. That shared left edge SHALL be positioned so the menu block remains horizontally centered on the screen: the widest menu label's horizontal center shall coincide with the board's horizontal center, and every menu label line SHALL be fully visible (not clipped) at the board edge on every screen size.

#### Scenario: All menu labels share a common left edge
- **WHEN** the starting menu is shown
- **THEN** the title, each menu item, and the hint line all start at the same horizontal x position (left-aligned) rather than each line being centered individually

#### Scenario: Menu block stays centered and unclipped
- **WHEN** the starting menu is shown at any screen size
- **THEN** the leftmost label edge and the widest label's right edge are symmetric about the board's horizontal center, so the menu block remains centered on the screen and no menu label is clipped at the board edge
