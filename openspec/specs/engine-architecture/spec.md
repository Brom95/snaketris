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

One declarative table SHALL state every screen, the items of each screen in page order, the key hints of each item, and the screen or transition each item opens. The game SHALL supply that table as data registered into the engine, and the engine SHALL own the table shape, the cursor and the navigation switch. Every input path SHALL read that table rather than its own index branches. Game-specific item work SHALL resolve through a handler map the game supplies, keyed by action id.

#### Scenario: Same item on every input path

- **WHEN** the player selects the third menu item by keyboard, by pointer, or by gamepad
- **THEN** the same screen opens on all three paths
- **AND** that screen comes from the table entry for that item

#### Scenario: A new screen needs only data

- **WHEN** a screen is added to the table
- **THEN** keyboard, pointer and gamepad navigation reach it with no change to any input module

#### Scenario: The engine names no game action

- **WHEN** an item's action needs game-specific work
- **THEN** the engine calls the handler the game registered for that action id
- **AND** the engine names no role, layout, or screen id

#### Scenario: The table is game data

- **WHEN** the engine package is searched for a screen id, a label, or a marker
- **THEN** no occurrence appears in it

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

The engine SHALL declare the state skeleton: a gameplay half and a screen half, each reset and read on its own. The game SHALL register its field names and initial values into each half. The engine SHALL read only the state slot of the screen half and the tick slot of the gameplay half; it SHALL NOT name any other field. A write to one half SHALL NOT change fields of the other half.

#### Scenario: A navigation write leaves gameplay intact

- **WHEN** the screen system opens a screen
- **THEN** no gameplay field changes

#### Scenario: A gameplay tick leaves navigation intact

- **WHEN** the gameplay systems advance one tick
- **THEN** the current screen and the current selection do not change

#### Scenario: The game registers its own field names

- **WHEN** the game supplies its play and screen field tables
- **THEN** the engine rebuilds both halves from those tables on reset
- **AND** the engine source names no field other than the state slot and the tick slot

#### Scenario: A game field never reaches the engine

- **WHEN** the engine package is searched for a game field name
- **THEN** no occurrence appears in it

### Requirement: The gameplay core is page-free
The gameplay systems SHALL read gameplay state, the grid, and the constants only. They SHALL NOT read page elements, the viewport, or browser storage.

#### Scenario: Core runs with no page
- **WHEN** the gameplay systems run with no page object and no storage object available
- **THEN** they finish the tick without error

### Requirement: Records persist outside the core

The core SHALL report the finished game's result. The engine SHALL own the write policy: persist a reported result once, then clear it. The game SHALL supply the board key and the entry shape, and the engine SHALL name neither. The records layer SHALL be the only layer that writes the records board.

#### Scenario: A finished game reaches the records layer

- **WHEN** a game ends
- **THEN** the result is reported to the records layer
- **AND** the records layer writes one board entry

#### Scenario: A failed storage write does not stop the game

- **WHEN** the records write fails
- **THEN** navigation continues to the next screen
- **AND** gameplay state is unchanged

#### Scenario: The board shape stays game-side

- **WHEN** the engine package is searched for a board key or an entry field
- **THEN** no occurrence appears in it

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

### Requirement: The engine names no game noun

Every symbol in the engine package SHALL be decidable as engine-side by one rule: it names no identifier whose meaning exists only in the game. A screen-state string, a role name, a tetromino, a score field, a label, a marker, and a leaderboard key are game nouns. The game side SHALL own every symbol that names one.

#### Scenario: A generic mechanism with a noun stays game-side

- **WHEN** a mechanism reads a game noun, such as a two-player branch that names a screen state
- **THEN** that symbol lives on the game side
- **AND** the game reports its result into the engine

#### Scenario: The boundary gate rejects a crossing

- **WHEN** an engine file imports a file outside the engine package
- **THEN** the boundary check reports it and the change is not done

### Requirement: The engine is self-contained

The engine package SHALL import nothing from outside itself. It SHALL receive the board size, the cell size and the tick step as parameters the game passes at construction. The game SHALL import the engine across the package boundary with relative module paths.

#### Scenario: The engine builds without the game

- **WHEN** the engine package is loaded on its own
- **THEN** every import resolves inside the engine package

#### Scenario: No constant crosses the boundary

- **WHEN** the engine needs a board dimension
- **THEN** it receives it as a parameter
- **AND** it imports no value from the game's constants

### Requirement: The engine owns the clock, the tick counter and the end-of-tick phase

The engine SHALL own the fixed-timestep clock and the tick counter. The registry SHALL let a system declare work for an explicit end-of-tick phase that runs after every other system in that tick. No entry point SHALL call a system directly.

#### Scenario: The entry does not own the counter

- **WHEN** one tick runs
- **THEN** the engine advances the tick counter
- **AND** no entry point increments it

#### Scenario: A system claims the closing edge

- **WHEN** a system must act after the tick's other systems, so a match that ends on the final tick keeps its score
- **THEN** it declares the end-of-tick phase
- **AND** the entry point calls no system a second time

### Requirement: The engine owns the grid and the viewport fit

The engine SHALL own the sized cell grid, the canvas buffer, the cell primitive, the viewport layout rule, the field fit, the page-element owner and the view-visibility mechanism. The game SHALL supply the dimensions, the painters and the element ids.

#### Scenario: The grid is engine state

- **WHEN** the game asks for a cell
- **THEN** the engine's grid answers from instance state created from the game's dimensions

#### Scenario: A painter is registered in, not imported

- **WHEN** the game needs to paint a piece
- **THEN** it registers its painter into the engine's frame pass
- **AND** the engine imports no piece rule

### Requirement: The engine is provable without the game

The engine SHALL carry its own test suite inside its package. That suite SHALL drive the clock, the registry, the state skeleton, the grid, the navigation and the presentation plumbing with no game module present.

#### Scenario: Navigation runs headless

- **WHEN** the engine suite sends the intents for "down", "down", "confirm" from the main menu
- **THEN** navigation reaches the registered target with no page element present

#### Scenario: The core runs with no browser objects

- **WHEN** the engine suite runs with `document`, `window` and `localStorage` absent
- **THEN** it finishes the tick without error
