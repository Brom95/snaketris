## ADDED Requirements

### Requirement: The network section offers two distinct flows

The network section SHALL offer two flows a player chooses between: a global
flow whose channel depends on a candidate supply, and a local flow whose
channel depends on both peers naming their own network address on one network.
A page SHALL belong to exactly one flow at a time: a global-flow page
SHALL NOT hand an address to a peer connection, and a local-flow page SHALL NOT
read a public candidate list. The way a page runs under is its choice until the
page pairs with a peer.

#### Scenario: Both flows are selectable

- **GIVEN** a player reaches the way sub-menu
- **THEN** the network section offers a global flow and a local flow as
  separate selectable items

#### Scenario: A local-flow page names no supply

- **GIVEN** a page opened at the local flow
- **WHEN** it prepares its channel
- **THEN** it hands its peer connection no candidate supply at all

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

### Requirement: The address field takes the address the player types

While the address field is on the page, the browser SHALL be able to write an
address into it, and a character that starts an address SHALL NOT be spent on
the short readable code the page offers beside it. A page that shows no address
field keeps its whole alphabet for the code.

#### Scenario: A dotted address is typed with the browser

- **GIVEN** a same-network page showing the address field
- **WHEN** the player types a dotted address into the page with the browser
- **THEN** the field holds the address as typed
- **AND** the code on the page is the one the page chose for itself

#### Scenario: A player types without touching the field first

- **GIVEN** a same-network page whose player has only opened it
- **WHEN** the player starts typing the address right away
- **THEN** the field holds the address as typed

#### Scenario: A group over one byte is not an address

- **GIVEN** a same-network page whose player typed four numbers with dots
  between, one of them over 255
- **THEN** the page keeps no address and names the shape it wants

#### Scenario: A digit still spells a code on a page that names no address

- **GIVEN** an anywhere-network page offering its short readable code
- **WHEN** the player types a digit
- **THEN** the digit is one character of that code

### Requirement: Each local-flow page offers the peer its own candidate

Given the peer's network address, a page of the local flow SHALL offer the peer
a candidate naming that address together with the port the peer's own page read,
bound to the remote description's media line. A page SHALL NOT offer a candidate
whose address it was not given, and SHALL NOT offer a candidate whose media line
it cannot name.

#### Scenario: The address arrives only in the link

- **GIVEN** a page of the local flow whose peer address and port came from a
  link that peer published, with nothing carried over the channel yet
- **WHEN** that page prepares its channel
- **THEN** it offers its peer the candidate naming that address and port

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

### Requirement: The same-network pair carries one line by hand

The local flow SHALL carry one value by hand per pair: a page SHALL offer a field
that takes the peer's `address:port` line, SHALL paint it only while the page
holds nothing to point at, and SHALL hide it once a value lands so it never asks a
second time. A page SHALL NOT require a value to travel over a channel the pair
has not joined, since an unjoined channel carries nothing between devices. A page
SHALL accept the line in the same shape it copies beside its own address, SHALL
reject a value that does not spell an address and a port, and SHALL point at the
peer it read the moment the line lands. A page that opened a link already naming
its peer's address and port SHALL read that half without asking for it again.

#### Scenario: The page asks only while it has nothing to point at

- **GIVEN** a local-flow page that holds no peer address
- **THEN** it paints a field for one peer line and a line saying what to carry
- **AND** its own line is already copied by the affordance beside its own address

#### Scenario: The field hides itself once a value lands

- **GIVEN** that page receives a line that spells an address and a port
- **THEN** the field is no longer painted and the page points at the peer it read

#### Scenario: A line that does not spell a pair is refused

- **GIVEN** a page whose field holds a value that is not an address and a port
- **THEN** the page keeps waiting and never points at the value

#### Scenario: A page that opened a link carrying its peer names nothing to type

- **GIVEN** a local-flow page opened at a link that names its peer's address and port
- **THEN** the page reads that half without asking and paints no field for it

### Requirement: Every copyable element carries a copy affordance

Every element a player may copy — the pairing link, the pairing code, an
address line — SHALL carry a copy affordance whose click copies that element's
value into the clipboard. The affordance SHALL sit directly under the value it
copies, so a player can see which value a mark belongs to. A browser that denies
the copy SHALL report it and leave the value selectable, never silently lose it.

#### Scenario: A click copies the value

- **GIVEN** a player clicks the copy affordance under the pairing link
- **THEN** the link's value is in the clipboard

#### Scenario: A denied copy is reported

- **GIVEN** a browser denies clipboard access
- **WHEN** the player clicks a copy affordance
- **THEN** the page says the copy did not happen and the value stays visible and
  selectable

#### Scenario: An element that is not copyable carries no affordance

- **GIVEN** a pairing element whose value a player cannot carry
- **THEN** it shows no copy affordance

### Requirement: The way choice re-opens until pairing starts

A player who picked a network way and is still alone on its own page SHALL be
able to pick the other network way on the same page, and the switch SHALL take
back whatever the first way published. A page that came over a link keeps the
flow its host chose, and a page that has already paired keeps its flow.

#### Scenario: The other way opens on the same page

- **GIVEN** a page that picked one network way, published its offer, and paired
  with nobody
- **WHEN** the player picks the other network way on that page
- **THEN** the page runs under the way it just picked
- **AND** the offer it published under the first way is taken back

#### Scenario: The new way runs its own open

- **GIVEN** a page that picked one network way and ran its candidate attempt under it
- **WHEN** the player picks the other network way on that page
- **THEN** the page runs its candidate attempt again under the way it just picked, on a channel built for that way's supply
- **AND** the page shows nothing of the way it left: no offer, no code, no address asked of the player

#### Scenario: A page that paired keeps its flow

- **GIVEN** a page whose channel is open with a peer
- **WHEN** the player picks the other network way on that page
- **THEN** the page keeps the flow it is running under and its pairing stands

### Requirement: The flow choice is offered at every viewport width

The two-player entry SHALL open the way sub-menu at every viewport width, so a
player on one pad still chooses which network flow runs. The shared-page way is
the wide-only item, since it needs a second pad on this device.

#### Scenario: A narrow viewport picks a flow

- **GIVEN** a player opens the two-player entry on a narrow viewport
- **THEN** the way sub-menu opens and lists both network flows as selectable items

#### Scenario: The shared-page way stays wide-only

- **GIVEN** the way sub-menu on a narrow viewport
- **THEN** the shared-page way is not offered

### Requirement: The global flow ships a named candidate supply

The global flow SHALL hand its peer connection a shipped list of named ICE
servers — the four Google hosts on port 19302 and `stun.stunprotocol.org` on
3478 — rather than a list read from somewhere else at open time. A page SHALL
still name a supply of its own from its address, and that named supply SHALL
replace the shipped list for the channel that page builds.

#### Scenario: An open with no supply in its address uses the shipped list

- **GIVEN** a global-flow page whose address names no supply
- **WHEN** it prepares its channel
- **THEN** its peer connection is built with the shipped named servers

#### Scenario: No page reads a candidate list

- **GIVEN** any page of either flow
- **WHEN** it prepares its channel
- **THEN** it fetches no candidate list from a remote source

#### Scenario: A named supply replaces the shipped list

- **GIVEN** a pairing link whose address names a supply with `?ice=`
- **THEN** the page hands its peer connection only the supply it names

### Requirement: The pairing link carries the local flow's address

The local flow's pairing link SHALL carry the address the page was given, beside the flow
marker, so the peer learns it without typing. The link SHALL carry a port only once this
page has read one. The secret itself SHALL stay the offer the channel negotiates from, and
SHALL stay within the pairing fragment cap so the link opens on a typed address.

A value this page learns after it published SHALL still reach the link it shows: the port
a page reads out of its own description lands later than the first publish, and the link
another page opens SHALL name it by then.

#### Scenario: An address travels where a supply would not

- **GIVEN** a local-flow page publishes its link
- **THEN** the link names the address it was given and stays within the
  pairing fragment cap

#### Scenario: The port is read after the page published

- **GIVEN** a local-flow page published its link before it had read a port
- **WHEN** a later moment reads the port out of its own description
- **THEN** the link the page shows names that port beside the address, so a page
    opened at it connects where the address alone would not say

### Requirement: The same-network way offers no short code

The local flow's pairing step SHALL paint no short readable code, and no copy
affordance for one: that way brings the peer over a link the player opens, and
its own page spends typed digits on the address field, so a code painted there
would be a value no player could type. The anywhere-network way keeps its code
beside its link.

#### Scenario: A local page paints only lines a player can act on

- **GIVEN** a page of the local flow published its offer
- **THEN** it paints its link, its QR, and its address lines
- **AND** it paints no short readable code and no copy affordance for one

#### Scenario: The other way keeps its code

- **GIVEN** a page of the global flow published its offer
- **THEN** it paints its short readable code beside its link, with a copy
    affordance under it

### Requirement: The same-network way paints no short code

The local flow's pairing step SHALL paint no short readable code, and no copy
affordance for one: that way brings the peer over a link the player opens, and a
page on that way spends typed digits on the address field, so a code painted
there would be a value no player could type. The anywhere-network way keeps its
code beside its link.

#### Scenario: A local page paints only lines a player can act on

- **GIVEN** a page of the local flow whose offer is published
- **THEN** the page paints its link, its QR, and its address lines
- **AND** it paints no short readable code and no copy affordance for one

#### Scenario: The other way keeps its code

- **GIVEN** a page of the global flow whose offer is published
- **THEN** it paints its short readable code beside its link, with a copy
    affordance under it

### Requirement: The local way names no candidate line

The local flow SHALL paint no line about a candidate supply at any point in its
pairing step: that way asks the player for an address, never for a server, so a
line about candidates would name something this way cannot act on. Only the
anywhere-network way names the candidate route, and only when its own attempt
found no reachable address.

#### Scenario: A local page whose attempt found no address says nothing about servers

- **GIVEN** a page of the local flow whose candidate attempt found no reachable
  address
- **THEN** the page paints no line about a candidate supply
- **AND** it keeps the lines this way uses: its address and the link it hands over

#### Scenario: The global way still names its route

- **GIVEN** a page of the global flow whose candidate attempt found no reachable
  address
- **THEN** the page names the candidate-supply route it wants the player to name
