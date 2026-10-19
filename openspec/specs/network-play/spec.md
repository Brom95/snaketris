# network-play Specification

## Purpose
Networked two-player play over a browser data channel: two humans on two devices pair by a shared secret, share one seed, and drive one grid, with no bot and no server of our own.

## Requirements

### Requirement: Two peers on two devices play one match

The system SHALL let two players on two separate browser pages play one match against each other, each on their own device, and SHALL run both sides as human on the single 10x20 grid.

#### Scenario: Each peer runs on its own page

- **WHEN** two browser pages are paired and the match starts
- **THEN** each page shows the same board state and each page accepts only its own player's input

#### Scenario: No bot drives either side

- **WHEN** a network match starts
- **THEN** no bot drives the snake or the falling piece

### Requirement: Pairing uses a shared secret and no server

The system SHALL pair two peers through a link that carries a secret both peers already hold, and SHALL NOT contact a server of the project's own. The pairing step SHALL state the secret in two forms: a link the second player opens on their own device, and a short readable code the second player can enter on their own device.

#### Scenario: The second peer joins by opening the link

- **WHEN** the first player opens a pairing screen and the second player opens the link the step painted
- **THEN** both pages reach the paired state and one match is scheduled

#### Scenario: The second peer joins by entering the code

- **WHEN** the first player opens a pairing screen and the second player enters the short code the step painted on their own page
- **THEN** both pages reach the paired state and one match is scheduled

#### Scenario: Pairing without a host

- **WHEN** a network match is started
- **THEN** no request is sent to a server owned by the project

#### Scenario: A wrong secret pairs nobody

- **WHEN** the two pages hold different secrets
- **THEN** neither page reaches the paired state and no match starts

### Requirement: The host fixes the duration and the roles

The system SHALL open the duration sub-menu and the role sub-menu on the host page only, and the guest SHALL NOT act on either. The guest page SHALL paint a read-only mirror of each sub-menu and SHALL move its mirror marker to the item the host selects, before the host confirms. The guest SHALL receive the same duration and the role the host did not choose.

#### Scenario: The guest sees the host selection before the host confirms

- **WHEN** the host moves its marker onto a duration item and has not confirmed
- **THEN** the guest page shows its mirror marker on the same duration item

#### Scenario: The guest sees the host role selection before the host confirms

- **WHEN** the host moves its marker onto a role item and has not confirmed
- **THEN** the guest page shows its mirror marker on the same role item

#### Scenario: The guest cannot act on a preparation sub-menu

- **WHEN** the host page shows a preparation sub-menu and the guest page confirms any key
- **THEN** the host's selection does not change and the guest page shows no selection of its own

#### Scenario: The guest keeps its waiting line

- **WHEN** the host page shows a preparation sub-menu
- **THEN** the guest page names the wait next to its mirrors

#### Scenario: The guest gets the mirror role

- **WHEN** the host chooses the Snake role
- **THEN** the guest drives the Tetris role and the host drives the Snake role

#### Scenario: Both peers share one countdown

- **WHEN** the host confirms a duration
- **THEN** both pages count down from the same duration

### Requirement: The seed travels at pairing

The system SHALL fix one seed for a network match at pairing time, and SHALL give both peers the same seed before the first tick runs. The seed SHALL select the piece sequence and the spawn column exactly as the single-player draw does.

#### Scenario: Both peers draw the same sequence

- **WHEN** both peers hold the same seed and run the same number of ticks
- **THEN** each peer's piece sequence is identical in type and column

#### Scenario: A different seed gives a different sequence

- **WHEN** two matches run with different seeds
- **THEN** their piece sequences differ

### Requirement: One grid is simulated once and mirrored

The system SHALL simulate the network match in one authoritative simulation and SHALL present that same state on both peers, so a control action from one peer moves only that peer's own character on both pages.

#### Scenario: A shift shows on both pages

- **WHEN** the Tetris-role player shifts the falling piece
- **THEN** the piece is shifted by the same amount on both pages

#### Scenario: A steer moves only the snake

- **WHEN** the Snake-role player steers
- **THEN** the snake turns and the falling piece does not move, on both pages

#### Scenario: The guest names no acting peer

- **WHEN** one peer performs a control action during a match
- **THEN** the guest page shows the resulting board state and shows no line naming which peer acted

### Requirement: Each peer confirms a control model on its own device

The system SHALL let each peer confirm one control model on their own device, and SHALL resolve a later input to the player who confirmed the model that produced it. A network peer SHALL NOT need a second control model on the same device.

#### Scenario: A phone peer confirms touch

- **WHEN** a peer on a phone confirms the touch model
- **THEN** that peer is locked to touch and a swipe on that page drives that peer's character

#### Scenario: An unconfirmed model drives nothing

- **WHEN** neither peer confirmed the keyboard model
- **THEN** a keyboard key produces no play action

### Requirement: The network way is offered on a narrow viewport

The system SHALL offer the network way of the "Two Players" entry at every viewport width, including the narrow stacked layout, because each peer plays on its own device. On a narrow viewport the system SHALL select that way automatically and SHALL NOT show the way sub-menu. The wide-viewport rule that gates the same-computer way SHALL NOT gate the network way.

#### Scenario: The way is offered on a phone

- **WHEN** the viewport is at or below the stacked-layout threshold and the player confirms the "Two Players" entry
- **THEN** the pairing step is shown directly, no way sub-menu is shown and the network way is the way in play

#### Scenario: The same-computer way stays wide-only

- **WHEN** the viewport is at or below the stacked-layout threshold
- **THEN** the same-computer way is not offered and the network way is

### Requirement: A finished match keeps the lobby

The system SHALL keep the peer link open when a network match ends with both peers still paired, and SHALL return the host page to its preparation stage without re-pairing. The host SHALL be able to change the duration and the role for the next match. The guest SHALL keep its waiting line and its read-only mirrors, and SHALL NOT act on them. The next match SHALL run with a seed that differs from the finished match's seed.

#### Scenario: The host re-prepares after a match

- **WHEN** a network match ends and both peers are still paired
- **THEN** the host page shows the duration sub-menu and the peer link stays open

#### Scenario: A new match starts without re-pairing

- **WHEN** the host confirms a duration and a role after a finished match
- **THEN** a new match starts on both pages and neither page re-pairs

#### Scenario: The host changes the settings between matches

- **WHEN** the host confirms a duration different from the finished match's duration
- **THEN** the next match counts down from the new duration on both pages

#### Scenario: The guest waits while the host re-prepares

- **WHEN** the host page shows the preparation stage between matches
- **THEN** the guest page names the wait, shows its read-only mirrors and moves each mirror marker to the item the host selects

#### Scenario: The lobby closes only when a peer leaves

- **WHEN** both peers are paired and no peer closes its channel
- **THEN** the lobby stays open across matches

### Requirement: A dropped peer ends the match cleanly

The system SHALL end a network match when its peer link closes, SHALL record the end reason as the peer leaving, and SHALL return both pages to the pairing step without a leaderboard write for the abandoned match.

#### Scenario: The peer closes the channel

- **WHEN** the second page closes its channel during a match
- **THEN** both pages stop simulating and show the peer-left result

#### Scenario: An abandoned match is not recorded

- **WHEN** a network match ends because a peer left
- **THEN** no leaderboard entry is written for that match

### Requirement: A pairing completes between two devices on one network

The system SHALL pair two pages on two devices that share one network — one local
network, or one virtual network such as a tunnel service — and SHALL treat the
host page as reachable from the guest page on that network. The system SHALL use
a candidate supply that belongs to that network, SHALL carry it in the pairing
secret so the guest receives it without typing it, and SHALL NOT require the
player to run a supply of its own or a public candidate list.

#### Scenario: The host names its network's supply

- **WHEN** the host page names a candidate supply reachable on its network and paints the pairing link
- **THEN** the guest page opened from that link uses that supply, and the guest typed nothing

#### Scenario: Two devices on one network pair

- **WHEN** two players open the two pages of one pairing secret on two devices that share one network, and the secret carries a supply both can reach
- **THEN** both pages reach the paired state and one match is scheduled

#### Scenario: One-network pairing contacts no public list

- **WHEN** a pairing completes with a supply that belongs to the players' network
- **THEN** no request went to a public candidate list, and no server owned by the project was contacted at any point

#### Scenario: A supply that answers nothing is reported

- **WHEN** the supply the guest received answers no candidate request
- **THEN** the pairing step names that no channel was reached, and the guest can name another supply

### Requirement: The public candidate list is refreshed and pruned per open

The system SHALL read the public candidate list from its configured source each
time the network section is opened, and SHALL keep only the entries it can name
as a candidate: a line that names no accepted scheme is dropped, and a bare
`host:port` line is given one. The system SHALL offer the shipped floor on every
open, and SHALL add at most its cap of entries read from the public list, so an
open never hands an unbounded supply.

#### Scenario: The list is read again on every open

- **WHEN** the network section is opened a second time in the same page session
- **THEN** the list is read again from the configured source, not reused from the earlier open

#### Scenario: An entry the page cannot name is dropped

- **WHEN** a line of the public list names no accepted candidate scheme
- **THEN** that line is not offered to the attempt, and a bare `host:port` line is offered with a scheme

#### Scenario: The supply an open hands stays bounded

- **WHEN** the public list names more entries than the open's cap
- **THEN** the open hands the shipped floor plus at most its cap of the listed entries

#### Scenario: Every entry dead leaves the one-network address selectable

- **WHEN** no entry of the public list answers
- **THEN** the pairing step says the public list gave nothing usable, and naming a one-network address remains available

#### Scenario: An unreadable list source does not close the section

- **WHEN** the configured list source cannot be read
- **THEN** the network section still opens, the public list shows nothing usable, and naming a one-network address remains available

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
