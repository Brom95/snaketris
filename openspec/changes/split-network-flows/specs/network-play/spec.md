## ADDED Requirements

### Requirement: The network section offers two distinct flows

The network section SHALL offer two flows a player chooses between: a global
flow whose channel depends on a candidate supply, and a local flow whose
channel depends on both peers naming their own network address on one network.
A page SHALL belong to exactly one flow for its whole life: a global-flow page
SHALL NOT hand an address to a peer connection, and a local-flow page SHALL NOT
read a public candidate list.

#### Scenario: Both flows are selectable

- **GIVEN** a player reaches the way sub-menu
- **THEN** the network section offers a global flow and a local flow as
  separate selectable items

#### Scenario: A local-flow page never reads the public list

- **GIVEN** a page opened at the local flow
- **WHEN** it prepares its channel
- **THEN** it contacts no public candidate list and ships no candidate supply

#### Scenario: A global-flow page never hand-crafts a candidate

- **GIVEN** a page opened at the global flow
- **WHEN** it prepares its channel
- **THEN** it offers no candidate it built itself and its offer carries no
  network address

### Requirement: The local flow states its own network address

Every page of the local flow SHALL state its own network address to the player
as a dotted-quad the player types plus a port the page reads itself, and SHALL
carry that address in its pairing link so the peer receives it without typing.
A page SHALL NOT ask the player for a port, and SHALL reject an address that
names a scheme.

#### Scenario: A page reads its own port

- **GIVEN** a page of the local flow has prepared its offer
- **THEN** the page knows the port its own connection allocated, read from its
  own local description, without the player typing a number

#### Scenario: The player types only an address

- **GIVEN** a page of the local flow waits for the player's address
- **WHEN** the player enters a dotted-quad
- **THEN** the page accepts it and paints the address with the port it read

#### Scenario: A value naming a scheme is not an address

- **GIVEN** a page of the local flow waits for the player's address
- **WHEN** the player enters a value that names a candidate supply
- **THEN** the page rejects it and keeps waiting

#### Scenario: An address that never arrives leaves the page waiting

- **GIVEN** a page of the local flow whose player types no address
- **THEN** the page publishes no link, waits, and offers no channel

### Requirement: Each local-flow page offers the peer its own candidate

Given the peer's network address, a page of the local flow SHALL offer the peer
a candidate naming that address together with the port the peer's own page read,
bound to the remote description's media line. A page SHALL NOT offer a candidate
whose address it was not given, and SHALL NOT offer a candidate whose media line
it cannot name.

#### Scenario: Two pages on one network pair with no supply

- **GIVEN** two pages of the local flow that each named its own address and
  received the peer's
- **WHEN** each offers the peer the candidate it built
- **THEN** both pages report an open channel and neither used a candidate supply

#### Scenario: A candidate missing its media line is not offered

- **GIVEN** a page of the local flow cannot name the remote description's media
  line
- **THEN** it offers no candidate and reports no channel rather than a partial
  one

#### Scenario: A wrong address pairs nobody

- **GIVEN** two pages of the local flow where one typed an address its device
  does not have
- **THEN** neither page reports an open channel and both keep waiting

### Requirement: The peer's address travels with the answer the channel carries

The local flow SHALL carry the second page's address and port over the channel
the pairing already uses, together with the answer that page produced, rather
than through a second hop the player has to carry. The first page SHALL complete
once that address arrives, and SHALL NOT ask its player to type an address the
second page painted.

#### Scenario: The second page sends its address with its answer

- **GIVEN** the second page opened the first page's link
- **THEN** it sends its own address and port beside the answer over the channel

#### Scenario: The first page completes on what the channel carries

- **GIVEN** the first page waits for the peer's address
- **WHEN** the channel carries the peer's address
- **THEN** the first page offers its candidate and pairs

### Requirement: Every copyable element carries a copy affordance

Every element a player may copy — the pairing link, the pairing code, an
address line and a return line — SHALL carry a copy affordance whose click
copies that element's value into the clipboard. A browser that denies the copy
SHALL report it and leave the value selectable, never silently lose it.

#### Scenario: A click copies the value

- **GIVEN** a player clicks the copy affordance beside the pairing link
- **THEN** the link's value is in the clipboard

#### Scenario: A denied copy is reported

- **GIVEN** a browser denies clipboard access
- **WHEN** the player clicks a copy affordance
- **THEN** the page says the copy did not happen and the value stays visible and
  selectable

#### Scenario: An element that is not copyable carries no affordance

- **GIVEN** a pairing element whose value a player cannot carry
- **THEN** it shows no copy affordance

### Requirement: The pairing link carries the local flow's address

The local flow's pairing link SHALL carry the page's address and the port its
own page read, beside the flow marker, so the peer learns both without typing
them. The secret itself SHALL stay the offer the channel negotiates from, and
SHALL stay within the pairing fragment cap so the link opens on a typed address.

#### Scenario: An address travels where a supply would not

- **GIVEN** a local-flow page publishes its link
- **THEN** the link names one address and one port and stays within the
  pairing fragment cap
