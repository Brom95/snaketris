## ADDED Requirements

### Requirement: A pair joins on the network its pages share

Two pages on two devices that share one network -- one LAN, or one virtual
network such as a tunnel service -- SHALL be pairable with the address each
page read and the line each page carries. No page SHALL take a candidate supply
from the secret it opens, SHALL read a public candidate list, or SHALL contact
a server owned by the project.

#### Scenario: Two devices on one network pair

- **WHEN** two players open the two pages of one pairing secret on two devices that share one network
- **THEN** each page reads its own port, points at the peer it holds, and the pair joins on the address and ports they named

#### Scenario: Pairing contacts no public list

- **WHEN** a pairing completes on the network way
- **THEN** no request went to a public candidate list, no supply travelled in the secret, and no server owned by the project was contacted at any point

#### Scenario: Headless Chromium stops short of a join

- **WHEN** the same-network pair runs on two separate headless Chromium instances
- **THEN** each page reports its own address, port and aim, and neither claims a joined channel; the joining that needs a real network is left to a player report rather than asserted

### Requirement: The network way is selectable at every viewport width

The two-player entry SHALL open the way sub-menu at every viewport width, so a
player on one pad still chooses. The shared-page way is the wide-only item,
since it needs a second pad on this device; the network way and the way back are
offered at every width.

#### Scenario: A narrow viewport picks the network way

- **GIVEN** a player opens the two-player entry on a narrow viewport
- **THEN** the way sub-menu opens, offers the same-network pair and Back, and picking the pair opens the pairing step

#### Scenario: The shared-page way stays wide-only

- **GIVEN** the way sub-menu on a narrow viewport
- **THEN** the shared-page way is not offered

## MODIFIED Requirements

### Requirement: The same-network pair carries one line by hand

The network way SHALL carry one value by hand per pair: a page SHALL offer a
field that takes the peer's `address:port` line, SHALL paint it only while the
page holds nothing to point at, and SHALL hide it once a value lands so it never
asks a second time. A page SHALL NOT require a value to travel over a channel the
pair has not joined, since an unjoined channel carries nothing between devices. A
page SHALL accept the line in the same shape it copies beside its own address,
SHALL reject a value that does not spell an address and a port, and SHALL point
at the peer it read the moment the line lands. A page that opened a link already
naming its peer's address and port SHALL read that half without asking for it
again.

#### Scenario: The page asks only while it has nothing to point at

- **GIVEN** a page on the network way that holds no peer address
- **THEN** it paints a field for one peer line and a line saying what to carry
- **AND** its own line is already copied by the affordance beside its own address

#### Scenario: The field hides itself once a value lands

- **GIVEN** that page receives a line that spells an address and a port
- **THEN** the field is no longer painted and the page points at the peer it read

#### Scenario: A line that does not spell a pair is refused

- **GIVEN** a page whose field holds a value that is not an address and a port
- **THEN** the page keeps waiting and never points at the value

#### Scenario: A page that opened a link carrying its peer names nothing to type

- **GIVEN** a page on the network way opened at a link that names its peer's address and port
- **THEN** the page reads that half without asking and paints no field for it

## REMOVED Requirements

### Requirement: A pairing completes between two devices on one network
**Reason**: the rule required a candidate supply carried in the pairing secret, and the shipped game carries no supply anywhere: each page names the peer's own address and port and offers one hand-crafted candidate.
**Migration**: the added requirement "A pair joins on the network its pages share" states the same pairing without a supply, and names the headless stop as an honest unasserted state.

### Requirement: The flow choice is offered at every viewport width
**Reason**: the entry no longer offers a choice of network flows; it offers the one network way, the shared-page way and Back.
**Migration**: the added requirement "The network way is selectable at every viewport width", which keeps the shared-page wide-only rule and states what the narrow menu offers.
