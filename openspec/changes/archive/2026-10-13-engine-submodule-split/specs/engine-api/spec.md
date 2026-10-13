# Spec Delta

## Purpose

Defines the engine's documented public surface: what a consumer must supply, what the engine guarantees, and where a consumer may extend the engine without editing its internals.

## ADDED Requirements

### Requirement: The engine documents its public surface

The engine package SHALL carry its own documentation. It SHALL state three things: what the engine guarantees, what a consumer must supply, and which invariants a consumer must not break. The documentation SHALL live inside the engine package, so a consumer without the game repo can read it.

#### Scenario: A consumer reads the contract before writing a game

- **WHEN** a consumer opens the engine package
- **THEN** it reads the guarantees, the consumer contract, and the invariants before writing any game code

#### Scenario: The game repo is not required to read the contract

- **WHEN** the engine documentation is read
- **THEN** it names only engine symbols
- **AND** it does not require a file from the game side to be understood

### Requirement: Every engine export is documented with its contract

Each documented export SHALL state its signature, the contract it enforces, and one worked call from the reference consumer. The engine's own suite SHALL import every documented export, so a renamed or missing export fails a test.

#### Scenario: A documented export exists

- **WHEN** the documentation names an export
- **THEN** the engine suite imports it and the test resolves it

#### Scenario: A renamed export breaks the documentation

- **WHEN** an engine export is renamed and the documentation is not updated
- **THEN** the engine suite fails

### Requirement: A consumer supplies its state, screens, handlers, painters and mappings

The contract SHALL state that a consumer supplies: the field tables for both state halves, the screen table rows, the handler map keyed by action id, the device-to-intent mapping tables, the painters registered into the frame pass, and the rules systems registered into the registry. The engine SHALL state what it does with each supply.

#### Scenario: The supply list is complete

- **WHEN** a consumer supplies every item in the contract list
- **THEN** the engine runs a full loop with no engine-side game noun present

#### Scenario: A missing supply is named

- **WHEN** a consumer omits one supply from the contract list
- **THEN** the documentation names the contract line that the consumer must satisfy

### Requirement: The extension points are documented as recipes

The documentation SHALL state how a consumer extends the engine without editing its internals: add a system to the registry, add a screen row, add a handler, add a painter, add a device mapping. Each recipe SHALL name only engine symbols and the contract line the consumer must satisfy.

#### Scenario: A new screen needs data only

- **WHEN** a consumer follows the "add a screen row" recipe
- **THEN** navigation reaches the new screen with no change to any engine file

#### Scenario: A new system declares its phase

- **WHEN** a consumer follows the "add a system" recipe
- **THEN** it declares the tick phase or the end-of-tick phase
- **AND** the entry point calls no system directly

### Requirement: The engine states its packaging contract

The documentation SHALL state the delivery mechanics: the mount path, the relative import form a consumer uses across the boundary, and the commit pin the deployed page uses.

#### Scenario: A consumer imports across the boundary

- **WHEN** a consumer imports an engine module
- **THEN** the documentation shows the relative path form and the mount path

#### Scenario: A deployed page names its pin

- **WHEN** a deployed page is built from the engine package
- **THEN** the deploy note names the pinned commit
