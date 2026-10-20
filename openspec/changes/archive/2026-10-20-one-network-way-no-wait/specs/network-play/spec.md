## ADDED Requirements

### Requirement: The network section names one way

The network section SHALL offer one way to a player: the same-network pair, plus the way back. No page SHALL run under an anywhere-network way, SHALL run a candidate attempt, SHALL count one down, or SHALL warn about a candidate supply, since no way in this game reads a supply.

#### Scenario: the way menu

- **WHEN** a player opens the network section
- **THEN** the items name the same-network pair and Back, and no item names a way that asks a peer for its address

#### Scenario: a step that waits for nothing

- **WHEN** a page paints its pairing step on the network section
- **THEN** no line counts a candidate attempt down, warns about a supply, or asks a peer to send its address, and the lines the player can act on -- its link, its address field, the line it carries -- remain

### Requirement: The page's own work runs before the seat branches

Every page on the network section SHALL read the port it named in its own description, rebuild the line it hands over and aim at the peer its line named before its seat branch runs, so a page that opened a link does its own work as well as a page that published one.

#### Scenario: a page opened at a link

- **WHEN** a page on the network section opened a link naming its peer's address and port
- **THEN** it reads its own port out of its own description and aims at the peer it holds, and its step paints the line its player carries

### Requirement: The network way states its own network address

The network way SHALL state the address its player typed and the port this page read beside it, on every page that runs the way, and SHALL refuse a value that is not four number groups. A page that names no address is waiting: its step says so and its line names no address.

#### Scenario: a page types its own device's address

- **WHEN** a page on the network way holds an address its player typed
- **THEN** the step states that address, and the port this page read beside it once it is known

#### Scenario: a page that typed nothing waits

- **WHEN** a page on the network way holds no address
- **THEN** the step names no address in the line it hands over, and the field stays asking for one

### Requirement: The address field takes the typed address on the one way

The pairing step's address field SHALL be the field typing goes into on the network way, with no click needed to land on it first, and a denied value SHALL stay visible as text the player can still select.

#### Scenario: typing reaches the field

- **WHEN** a player types digits on the network way's pairing step
- **THEN** they reach the address field, and the step repaints the line it hands over with them

### Requirement: Every page offers its peer one hand-crafted candidate

Every page SHALL offer its peer a candidate naming the address the peer gave and the port that peer read, bound to the media line of the description this page already holds. No page SHALL offer a candidate taken from a public list.

#### Scenario: the candidate names the peer's own device

- **WHEN** a page holds the peer's address and a peer port
- **THEN** the candidate it offers names that address and port, not a list of public relays

#### Scenario: a page that only published still points

- **WHEN** a page never received an answer
- **THEN** it still points at the peer its line named, since its own description names the media line a candidate binds to

### Requirement: The pairing link names the page's own address and port

The pairing link a page hands over SHALL name that page's own address and the port it read, each exactly once, and SHALL carry the secret beside the query as the fragment. A page that opened a link SHALL take the values it opened with back before writing its own, so a refreshed link never stacks the values of the page it opened.

#### Scenario: a refreshed link names the page that refreshed it

- **WHEN** a page that opened a link reading one address and port reads its own port later and refreshes the line
- **THEN** the link names this page's address and port, not the ones it opened with, and neither value appears twice

#### Scenario: no port read yet

- **WHEN** a page on the network way has published but not yet read a port
- **THEN** its line names the address and names no port

### Requirement: The pairing step names no attempt and no supply

The pairing step on the network way SHALL name no candidate attempt, SHALL count no seconds down, and SHALL warn about no candidate supply, since no page in this game reads a supply.

#### Scenario: the step of the one way

- **WHEN** a page paints its pairing step on the network way
- **THEN** no line counts an attempt down and no line warns about a supply it cannot read

## REMOVED Requirements
### Requirement: The network section offers two distinct flows
**Reason**: the section offers one way now. The way that asked a peer for its address over a public candidate list is gone, so nothing splits into two flows and no page carries a flow name.
**Migration**: the added requirement "The network section names one way" states the section's shape; "The page's own work runs before the seat branches" states what every page on it does.


### Requirement: The global flow ships a named candidate supply
**Reason**: no page hands its peer connection a candidate supply. The same-network pair names each other's address and port beside the link, so there is no supply to ship, refresh, or prune.
**Migration**: the added requirement "The network section names one way" (no page runs a candidate attempt); js/app.js iceSupplyForOpen returns an empty supply and says so.


### Requirement: The public candidate list is refreshed and pruned per open
**Reason**: there is no public list to refresh or prune: the only candidate this way offers is the hand-crafted one naming the peer's own address and port.
**Migration**: the added requirement "Every page offers its peer one hand-crafted candidate".


### Requirement: The way choice re-opens until pairing starts
**Reason**: the re-open existed to settle a way pick against a candidate attempt that had started under the other way. With one way and no attempt, a page's open starts its pairing directly.
**Migration**: the added requirement "The page's own work runs before the seat branches"; js/screens.js still re-opens the pairing step until a pair joins.


### Requirement: The same-network way offers no short code
**Reason**: the short readable code is no longer a way's; it is the publish's own fallback for an offer too large to ride in a link, and that fallback is the same on the one way.
**Migration**: the shipped js/ui.js rule keyed to lobby.form === 'code', stated by the added requirement "The network way states its own network address".


### Requirement: The same-network way paints no short code
**Reason**: the code line and its copy affordance are painted when the publish chose the code form, not hidden by a way.
**Migration**: as above: the shipped js/ui.js rule keyed to lobby.form === 'code'.


### Requirement: The local way names no candidate line
**Reason**: the line counted a candidate attempt that no way runs, and warned about a supply no page reads.
**Migration**: the added requirement "The pairing step names no attempt and no supply".


### Requirement: The local flow states its own network address
**Reason**: the requirement named a flow, and the game has one network way now; the wording is restated without the flow name.
**Migration**: the added requirement "The network way states its own network address".


### Requirement: The address field takes the address the player types
**Reason**: restated without the flow vocabulary; the field itself is unchanged in what it accepts.
**Migration**: the added requirement "The address field takes the typed address on the one way".


### Requirement: Each local-flow page offers the peer its own candidate
**Reason**: restated without the flow vocabulary, since every page now offers the same hand-crafted candidate.
**Migration**: the added requirement "Every page offers its peer one hand-crafted candidate".


### Requirement: The pairing link carries the local flow's address
**Reason**: the link no longer carries a flow name at all, so the requirement is restated about the address and port alone.
**Migration**: the added requirement "The pairing link names the page's own address and port".
