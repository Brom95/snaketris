# engine-api Specification

## Purpose
Defines the engine's documented public surface: what a consumer must supply, what the engine guarantees, and where a consumer may extend the engine without editing its internals.

## Requirements

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

### Requirement: The contract lists the netcode supplies

The consumer contract SHALL state that a consumer supplies a deterministic seed and a transport object for each peer link, and SHALL state what the engine does with each: the seed feeds the deterministic source, and the transport moves command bytes between peers. The engine SHALL state that it supplies neither.

#### Scenario: The supply list covers the netcode

- **WHEN** a consumer reads the contract and supplies the seed and the transport
- **THEN** the engine runs a two-peer loop with no engine-side game noun and no engine-side channel constructor

#### Scenario: A missing netcode supply is named

- **WHEN** a consumer omits the transport from its supplies
- **THEN** the documentation names the contract line the consumer must satisfy and the engine reports no peer connected

### Requirement: Every netcode export is documented and imported

Each netcode export SHALL state its signature, the contract it enforces, and one worked call from the reference consumer. The engine's own suite SHALL import every netcode export, so a renamed or missing netcode export fails a test.

#### Scenario: A netcode export resolves

- **WHEN** the documentation names a netcode export
- **THEN** the engine suite imports it and the test resolves it

#### Scenario: A renamed netcode export breaks the documentation

- **WHEN** a netcode export is renamed and the documentation is not updated
- **THEN** the engine suite fails

### Requirement: The recipes gain a transport and a peer link

The documentation SHALL state how a consumer adds a transport and a peer link without editing engine internals. Each recipe SHALL name only engine symbols and the contract line the consumer must satisfy, and SHALL show the reference consumer's call.

#### Scenario: A new transport needs no engine edit

- **WHEN** a consumer follows the "add a transport" recipe with a different channel object
- **THEN** the peer link works with that transport and no engine file changes

#### Scenario: A new link declares its phase

- **WHEN** a consumer follows the "add a peer link" recipe
- **THEN** it declares the tick phase or the end-of-tick phase
- **AND** the entry point calls no system directly

### Requirement: The engine states the determinism invariant

The documentation SHALL state the invariants a consumer must not break, and SHALL add that a match's seed is fixed before its first tick and is identical on every peer of that match. It SHALL state that a consumer must not replace the deterministic source with a browser entropy source.

#### Scenario: A consumer breaks the seed invariant

- **WHEN** a consumer draws a piece value from a browser entropy source instead of the engine's source
- **THEN** the documentation names the invariant the consumer broke

#### Scenario: The invariant is checkable without the game

- **WHEN** the invariant is read from the engine documentation
- **THEN** it is stated in engine symbols only and needs no game file to understand
