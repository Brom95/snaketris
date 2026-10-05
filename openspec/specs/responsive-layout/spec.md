# responsive-layout Specification

## Purpose
Keeps the play field and the page interface on separate scaling paths, so each stays legible and usable across viewports from a narrow phone to a wide desktop, and so the interface can use space the field cannot.

## Requirements

### Requirement: Field and interface scale independently
The system SHALL size the play field and the page interface by separate rules, so changing the size of one does not change the size of the other.

#### Scenario: Wide desktop gives the interface its own space
- **WHEN** the viewport is much wider than the play field's aspect ratio
- **THEN** the field scales to the viewport height while the interface is sized by the viewport width, and the interface is not confined to the field's width

#### Scenario: Interface size does not follow the field size
- **WHEN** the viewport changes size such that the field's displayed size changes
- **THEN** the interface keeps its own legible size rather than scaling by the same factor as the field

### Requirement: Interface never overlaps the play field
The system SHALL place the interface so it does not cover any part of the play field at any supported viewport size, with one exception: the score readout, which MAY overlay the top edge of the field where the interface stacks above it (see the `hud` capability). No other interface element — menu, records, help or game-over message — SHALL cover the field.

#### Scenario: No overlap on a wide viewport
- **WHEN** the game is shown on a wide desktop viewport
- **THEN** score, menu, records, help and game-over elements sit clear of the field

#### Scenario: No overlap on a narrow viewport
- **WHEN** the game is shown on a narrow phone viewport where the field already fills the available width
- **THEN** the menu, records, help and game-over elements are placed clear of the field, and the field keeps its contain-fit rule with the height the stacked interface occupies subtracted from the height it may use

### Requirement: Stacked interface yields its band to the field
Where the interface stacks above the field because the field already fills the viewport width, the system SHALL subtract the height the interface occupies on that axis from the height available to the field, so that field and interface together fit the viewport without scrolling. An interface element that overlays the field instead of occupying that axis SHALL NOT be subtracted.

#### Scenario: Phone viewport shares its height between field and interface
- **WHEN** the game is shown on a phone viewport whose width forces the interface to stack above the field
- **THEN** the field is scaled to the height left after the interface band and the two together occupy no more than the viewport height

#### Scenario: Beside layout reserves nothing
- **WHEN** the interface shares a track beside the field on a wide viewport
- **THEN** the field is scaled by the plain contain-fit rule with no height reserved for the interface

#### Scenario: Overlaid readout reserves no band
- **WHEN** the score readout overlays the top edge of the field on a stacked layout
- **THEN** the readout is not counted in the interface band and the field is taller than it was while the readout occupied the band

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

### Requirement: Hidden field reclaims the viewport
Where the play field is not on screen, the system SHALL remove it from the page layout entirely rather than leaving an empty box, so the interface that stacks on the same axis uses the height the field would otherwise have taken.

#### Scenario: Menu view uses the full phone height
- **WHEN** the starting menu, the records view or the help view is shown on a phone viewport
- **THEN** no empty field box occupies the page and the view is fully visible without scrolling

#### Scenario: Field box returns when play starts
- **WHEN** a game starts from the menu
- **THEN** the field is laid out again and scaled by the contain-fit rule against the height left by the interface band

### Requirement: Menu block occupies most of the viewport height at narrow viewports
The system SHALL size the starting menu so that, on a narrow viewport where the interface stacks above the field, the menu block extends to roughly two thirds of the viewport height rather than clustering in the centre. The menu SHALL remain fully visible without scrolling and SHALL not cover any part of the play field.

#### Scenario: Menu fills most of the phone height
- **WHEN** the starting menu is shown on a narrow phone viewport
- **THEN** the menu block extends to roughly two thirds of the viewport height, so it is not clustered in the centre of the interface area

#### Scenario: Menu stays clear of the field
- **WHEN** the starting menu is shown on a narrow phone viewport
- **THEN** the menu does not cover any part of the play field and remains fully visible without scrolling
