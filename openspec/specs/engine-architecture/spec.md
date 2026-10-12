# engine-architecture Specification

## Purpose
Defines how the engine composes its systems: which layer owns gameplay rules, which layer owns navigation and screens, which layer paints the page, and which layer keeps records.

## Requirements

### Requirement: The engine registry owns the interface
The engine SHALL run the screen navigation as a system in the ordered systems registry, alongside the gameplay systems. The registry SHALL hold the gameplay systems and the screen system; it SHALL NOT hold presentation work.

#### Scenario: Screen system is registered
- **WHEN** the engine registry is built
- **THEN** it lists the gameplay systems and the screen system in declared order
- **AND** each system exposes an update step that runs once per tick

#### Scenario: Presentation is not a system
- **WHEN** the registry is inspected
- **THEN** no canvas painting step and no page painting step appear in it

### Requirement: One screen table drives navigation
One declarative table SHALL state every screen, the items of each screen in page order, the key hints of each item, and the screen each item opens. Every input path SHALL read that table rather than its own index branches.

#### Scenario: Same item on every input path
- **WHEN** the player selects the third menu item by keyboard, by pointer, or by gamepad
- **THEN** the same screen opens on all three paths
- **AND** that screen comes from the table entry for that item

#### Scenario: A new screen needs only data
- **WHEN** a screen is added to the table
- **THEN** keyboard, pointer and gamepad navigation reach it with no change to any input module

### Requirement: Navigation advances from intents only
The screen system SHALL advance navigation state from a normalized intent and the current screen state. It SHALL NOT read page elements, pointer coordinates, key codes, or device state.

#### Scenario: Navigation without a page
- **WHEN** a headless test sends the intents for "down", "down", "confirm" from the main menu
- **THEN** navigation reaches the records screen with no page element present
- **AND** no DOM lookup happens on that path

#### Scenario: An intent the screen rejects
- **WHEN** the current screen has no item for the intent's action
- **THEN** navigation state does not change

### Requirement: Gameplay state and screen state are separate
The state SHALL split into a gameplay half and a screen half. Each half SHALL be reset and read on its own. A write to one half SHALL NOT change fields of the other half.

#### Scenario: A navigation write leaves gameplay intact
- **WHEN** the screen system opens a screen
- **THEN** no gameplay field changes

#### Scenario: A gameplay tick leaves navigation intact
- **WHEN** the gameplay systems advance one tick
- **THEN** the current screen and the current selection do not change

### Requirement: The gameplay core is page-free
The gameplay systems SHALL read gameplay state, the grid, and the constants only. They SHALL NOT read page elements, the viewport, or browser storage.

#### Scenario: Core runs with no page
- **WHEN** the gameplay systems run with no page object and no storage object available
- **THEN** they finish the tick without error

### Requirement: Records persist outside the core
The core SHALL report the finished game's result. The records layer SHALL be the only layer that writes the records board.

#### Scenario: A finished game reaches the records layer
- **WHEN** a game ends
- **THEN** the result is reported to the records layer
- **AND** the records layer writes one board entry

#### Scenario: A failed storage write does not stop the game
- **WHEN** the records write fails
- **THEN** navigation continues to the next screen
- **AND** gameplay state is unchanged

### Requirement: Presentation runs once per rendered frame
Painting SHALL run once per rendered frame, apart from the per-tick systems. A frame that advances several ticks SHALL paint once.

#### Scenario: Several ticks, one paint
- **WHEN** one frame advances three ticks
- **THEN** the canvas paints once and the page paints once

### Requirement: Page element identity stays stable
The refactor SHALL keep the page element ids and the visibility classes unchanged, so existing page checks still address the same elements.

#### Scenario: Existing page checks still resolve
- **WHEN** a page check queries the menu item elements and toggles the visibility class
- **THEN** it resolves the same elements and the same classes as before the refactor
