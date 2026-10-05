# Spec Delta

## ADDED Requirements

### Requirement: Menu block occupies most of the viewport height at narrow viewports
The system SHALL size the starting menu so that, on a narrow viewport where the interface stacks above the field, the menu block extends to roughly two thirds of the viewport height rather than clustering in the centre. The menu SHALL remain fully visible without scrolling and SHALL not cover any part of the play field.

#### Scenario: Menu fills most of the phone height
- **WHEN** the starting menu is shown on a narrow phone viewport
- **THEN** the menu block extends to roughly two thirds of the viewport height, so it is not clustered in the centre of the interface area

#### Scenario: Menu stays clear of the field
- **WHEN** the starting menu is shown on a narrow phone viewport
- **THEN** the menu does not cover any part of the play field and remains fully visible without scrolling
