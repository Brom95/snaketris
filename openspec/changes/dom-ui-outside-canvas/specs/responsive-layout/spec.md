# Spec Delta

## Purpose

Keeps the play field and the page interface on separate scaling paths, so each stays legible and usable across viewports from a narrow phone to a wide desktop, and so the interface can use space the field cannot.

## ADDED Requirements

### Requirement: Field and interface scale independently
The system SHALL size the play field and the page interface by separate rules, so changing the size of one does not change the size of the other.

#### Scenario: Wide desktop gives the interface its own space
- **WHEN** the viewport is much wider than the play field's aspect ratio
- **THEN** the field scales to the viewport height while the interface is sized by the viewport width, and the interface is not confined to the field's width

#### Scenario: Interface size does not follow the field size
- **WHEN** the viewport changes size such that the field's displayed size changes
- **THEN** the interface keeps its own legible size rather than scaling by the same factor as the field

### Requirement: Interface never overlaps the play field
The system SHALL place the interface so it does not cover any part of the play field at any supported viewport size.

#### Scenario: No overlap on a wide viewport
- **WHEN** the game is shown on a wide desktop viewport
- **THEN** score, menu, records, help and game-over elements sit clear of the field

#### Scenario: No overlap on a narrow viewport
- **WHEN** the game is shown on a narrow phone viewport where the field already fills the available width
- **THEN** the interface is placed clear of the field, and the field keeps its contain-fit rule with the height the stacked interface occupies subtracted from the height it may use

### Requirement: Stacked interface yields its band to the field
Where the interface stacks above the field because the field already fills the viewport width, the system SHALL subtract the height the interface occupies from the height available to the field, so that field and interface together fit the viewport without scrolling.

#### Scenario: Phone viewport shares its height between field and interface
- **WHEN** the game is shown on a phone viewport whose width forces the interface to stack above the field
- **THEN** the field is scaled to the height left after the interface band and the two together occupy no more than the viewport height

#### Scenario: Beside layout reserves nothing
- **WHEN** the interface shares a track beside the field on a wide viewport
- **THEN** the field is scaled by the plain contain-fit rule with no height reserved for the interface

### Requirement: Interface stays reachable without scrolling
The system SHALL keep every interface element fully visible without horizontal or vertical scrolling at any supported viewport size.

#### Scenario: Longest interface line fits
- **WHEN** the records view or the help view is shown at the narrowest supported viewport
- **THEN** no line is clipped and the page does not scroll horizontally

### Requirement: Interface stays legible at small viewports
The system SHALL size interface text so it remains readable on the smallest supported viewport.

#### Scenario: Menu readable on a phone
- **WHEN** the starting menu is shown on a narrow phone viewport
- **THEN** every menu label is readable at the browser's own default text scale
