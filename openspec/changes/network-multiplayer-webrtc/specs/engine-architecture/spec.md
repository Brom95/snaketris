# Spec Delta

## Purpose

Defines how the engine composes its systems. This delta adds the netcode mechanism the engine owns, so a consumer can build networked play on top of it without moving game nouns into the engine.

## ADDED Requirements

### Requirement: The engine owns the deterministic source

The engine SHALL own a deterministic source that answers the next value from a seed and a call count alone. The consumer SHALL supply the seed; the engine SHALL NOT supply a default seed and SHALL NOT read any browser entropy source. Two runs with the same seed and the same call count SHALL return the same values in the same order.

#### Scenario: The source is reproducible

- **WHEN** the engine suite builds the source twice with one seed and draws five values from each
- **THEN** both lists are equal

#### Scenario: No entropy source is read

- **WHEN** the engine package is searched for a browser entropy call
- **THEN** no occurrence appears in it

### Requirement: The engine owns the tick-aligned command stream

The engine SHALL own a command stream that pairs each intent with the tick it applies on, and SHALL apply a received intent only on that tick. An intent that arrives after its tick passed SHALL be dropped, and the engine SHALL report the drop count.

#### Scenario: A late intent is dropped

- **WHEN** an intent tagged with tick 40 arrives while the engine is at tick 45
- **THEN** the intent is not applied and the drop count increases

#### Scenario: The stream applies on its own tick

- **WHEN** an intent tagged with tick 40 is buffered while the engine is at tick 38
- **THEN** it is applied on tick 40 and on no other tick

### Requirement: The engine owns the peer link and receives the transport

The engine SHALL own the peer link: the state a peer connection has, the close event, and the resync policy. The consumer SHALL supply the transport object that moves bytes between peers; the engine SHALL NOT import or construct one. The engine SHALL run with no transport present and report that no peer is connected.

#### Scenario: The engine runs without a transport

- **WHEN** the engine suite runs with no transport supplied and no browser channel object present
- **THEN** the link reports no peer and the tick loop finishes without error

#### Scenario: The transport is supplied, not imported

- **WHEN** the engine package is searched for a browser channel constructor
- **THEN** no occurrence appears in it

### Requirement: The netcode layer stays page-free and provable

The netcode layer SHALL be drivable with no page object, no browser storage, and no browser channel object. The engine suite SHALL drive a two-peer match by feeding two intent streams into one simulation, with `document`, `window`, `localStorage` and any channel object absent.

#### Scenario: Two peers run headless

- **WHEN** the engine suite feeds two intent streams into one simulation with no browser objects present
- **THEN** the simulation finishes and both streams report their applied and dropped intents

### Requirement: Tailscale subnet support

The consumer can supply a Tailscale subnet for the pairing instead of public STUN servers. The ICE servers are configured with Tailscale IP addresses, and the pairing works over the Tailscale subnet. The `ICE_SERVERS` in `js/app.js` is parameterized by the chosen subnet, and the `iceAttempt()` in `js/netplay.js` uses the configured candidates. The design doc's `ICE_SERVERS` list is replaced by the subnet's peer addresses, and the pairing step paints the Tailscale IP as the offer URL.

### Requirement: The netcode mechanism keeps the boundary gate green

The netcode modules SHALL live inside the engine package, SHALL import nothing outside it, and SHALL name no game noun. The boundary check SHALL reject a netcode module that imports a game file or names a role, a screen state, a score field, or a piece.

#### Scenario: A crossing is rejected

- **WHEN** a netcode module imports a file outside the engine package
- **THEN** the boundary check reports it and the change is not done

#### Scenario: A netcode symbol names no noun

- **WHEN** the engine package is searched for a game noun in a netcode module
- **THEN** no occurrence appears in it
