# Spec Delta

## MODIFIED Requirements

### Requirement: Three menu items
The system SHALL present the starting menu items - "Play", "Two Players", "Records", and "How to Play" - with up to four selectable items, where "Two Players" appears only when the viewport is wide (desktop) and is hidden when narrow (mobile touch), with exactly one item highlighted as the current selection.

#### Scenario: All items listed
- **WHEN** the starting menu is shown
- **THEN** the items "Play", "Records", and "How to Play" are listed, "Two Players" appears only when the viewport is wide, and exactly one is highlighted

#### Scenario: Four items on a wide viewport
- **WHEN** the viewport is wide (desktop)
- **THEN** the menu also shows "Two Players" alongside the three existing items

#### Scenario: Three items on a narrow viewport
- **WHEN** the viewport is narrow (mobile touch)
- **THEN** the menu hides "Two Players" and shows "Play", "Records", and "How to Play"
