# Spec Delta

## Purpose

Extends the engine's documented public surface with the netcode mechanism, so a consumer can build networked play from the contract alone.

## ADDED Requirements

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

