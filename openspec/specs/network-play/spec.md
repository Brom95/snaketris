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

The system SHALL offer the network way of the "Two Players" entry at every
viewport width, including the narrow stacked layout, because each peer plays on
its own device. On a narrow viewport the system SHALL open the way sub-menu with
the network way and the way back, and SHALL NOT offer the shared-page way there.
The wide-viewport rule that gates the same-computer way SHALL NOT gate the
network way.

#### Scenario: The way is offered on a phone

- **WHEN** the viewport is at or below the stacked-layout threshold and the player confirms the "Two Players" entry
- **THEN** the way sub-menu is shown, offers the network way, and picking it shows the pairing step with the network mode in play

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
The network way SHALL state the address its player provides and the port this page read beside it, on every page that runs the way, and SHALL refuse a value that is not four number groups. A page that names no address is waiting: its step says so and its line names no address. The address its player provides may be typed by the player or auto-detected from the page's own local network address candidate, so a player is not required to type it.

#### Scenario: a page types its own device's address
- **WHEN** a page on the network way holds an address its player typed
- **THEN** the step states that address, and the port this page read beside it once it is known

#### Scenario: a page that typed nothing waits
- **WHEN** a page on the network way holds no address
- **THEN** the step names no address in the line it hands over, and the field stays asking for one

#### Scenario: a page carries its own address without typing
- **WHEN** a page on the network way holds no typed address yet but can determine its own local network address from the candidates its transport gathers
- **THEN** the step states that detected address and the port this page read beside it, as if the player had typed it

#### Scenario: a page that provides no address still waits
- **WHEN** a page on the network way cannot determine its own local network address and the player has typed nothing
- **THEN** the step names no address in the line it hands over, and the field stays asking for one

### Requirement: The address field takes the typed address on the one way
The pairing step's address field SHALL be the field input goes into on the network way, with no click needed to land on it first, and a denied value SHALL stay visible as text the player can still select. The field SHALL accept an address the player types and an address the page auto-detects, and a value that is not a valid address stays reported as before.

#### Scenario: typing reaches the field
- **WHEN** a player types digits on the network way's pairing step
- **THEN** they reach the address field, and the step repaints the line it hands over with them

#### Scenario: a detected address lands in the field
- **WHEN** the page auto-detects its own local network address
- **THEN** the detected value fills the field and is reported to the pairing state without the player typing it

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

### Requirement: The pairing step reaches every line it paints

The pairing step SHALL show every line it paints, however tall the step has grown. A step taller than the pane it sits in SHALL scroll within that pane, and SHALL NOT hide its lower lines below the pane's edge. The step SHALL NOT be shrunk to fit, and the pane SHALL NOT grow past the space the layout gives it.

#### Scenario: a phone opens a pairing link and the step grows

- **WHEN** a 375px-wide phone opens a link its peer published, so the step grows past the height the layout gives it
- **THEN** every line of the step is reachable by scrolling it, and its lower edge is not cut at the bezel

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

### Requirement: The pairing step keeps its confirm control reachable while the address field is focused

The pairing step SHALL keep its confirm control reachable when the address field has focus, so the player can confirm pairing without first dismissing the address field. The address field SHALL NOT be held in focus after input, so an open virtual keyboard does not stay open and cover the confirm control. The address field SHALL be focused when the step is entered and SHALL NOT be re-focused on later frames of the same step.

#### Scenario: Pair is reachable after an address is supplied on a phone
- **WHEN** the player has supplied an address (typed or auto-detected) and the virtual keyboard is open on the pairing step
- **THEN** the player can still tap the confirm control without the keyboard covering it, and the address field is not re-focused, so the keyboard does not reopen and cover the confirm control again

#### Scenario: The address field is focused once per step entry
- **WHEN** the player enters the pairing step and the address field is not focused
- **THEN** the field is focused once, and later frames of the same step do not re-focus it

#### Scenario: The address field is not held in focus after input
- **WHEN** the player has supplied an address and the step keeps the field focused
- **THEN** the field is not re-focused, so the keyboard does not reopen and cover the confirm control again
