# Spec Delta

## ADDED Requirements

### Requirement: GitHub link displayed below menu items
The system SHALL display a GitHub link/icon below the three standard menu items ("Play", "Records", "How to Play") in the starting menu. The link shall be visually distinct from the selectable menu items and shall not participate in keyboard or gamepad navigation.

#### Scenario: GitHub link visible on menu
- **WHEN** the starting menu is shown
- **THEN** a GitHub link/icon is rendered below the "How to Play" item, separated from the selectable menu items

### Requirement: GitHub opens the repository page
The system SHALL open the GitHub repository page `https://github.com/Brom95/snaketris` in a new browser tab when the GitHub link/icon is clicked or tapped.

#### Scenario: Click opens repo
- **WHEN** the player clicks or taps the GitHub link/icon on the menu
- **THEN** the browser navigates to `https://github.com/Brom95/snaketris` in a new tab

## MODIFIED Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over board overlays. The menu shows the title, the three selectable items, and the GitHub icon, and no longer shows a navigation hint line (the icon takes the space where it used to be).

#### Scenario: Menu shown on first launch
- **WHEN** the page loads the game for the first time
- **THEN** the starting menu is shown instead of the game board

#### Scenario: Menu shown after game over
- **WHEN** a game ends (game over)
- **THEN** control returns to the starting menu

#### Scenario: No navigation hint line on the menu
- **WHEN** the starting menu is shown
- **THEN** no navigation hint line is rendered below the menu items; the space below the items holds the GitHub icon instead

### Requirement: Menu labels are left-aligned with the block centered
The system SHALL render the starting menu's labels — the "snaketris" title and the three menu items ("Play", "Records", "How to Play") — left-aligned so that every label line begins at the same horizontal position. That shared left edge SHALL be positioned so the menu block remains horizontally centered on the screen: the widest menu label's horizontal center shall coincide with the board's horizontal center, and every menu label line SHALL be fully visible (not clipped) at the board edge on every screen size.

#### Scenario: All menu labels share a common left edge
- **WHEN** the starting menu is shown
- **THEN** the title and each menu item start at the same horizontal x position (left-aligned) rather than each line being centered individually

#### Scenario: Menu block stays centered and unclipped
- **WHEN** the starting menu is shown at any screen size and any item is highlighted
- **THEN** the leftmost label edge and the widest label's right edge are symmetric about the board's horizontal center, so the menu block remains centered on the screen and no menu label is clipped at the board edge
