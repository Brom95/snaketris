# Spec Delta

## Purpose

Networked two-player play over a browser data channel: two humans on two devices pair by a shared secret, share one seed, and drive one grid, with no bot and no server of our own.

## ADDED Requirements

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
network, or one virtual network such as a tunnel service — and SHALL accept that
the host page's address is reachable from the guest page. The system SHALL NOT
require a public candidate list for that pairing.

#### Scenario: The guest names the host's address

- **WHEN** the guest page is given the address of the network the host page runs on
- **THEN** the attempt offers that address alone and pairs without consulting a public list

#### Scenario: Two devices on one local network pair

- **WHEN** two players open the two pages of one pairing secret on two devices that share one local network, and name that network
- **THEN** both pages reach the paired state and one match is scheduled

#### Scenario: Two devices on one virtual network pair

- **WHEN** two players open the two pages of one pairing secret on two devices that share one virtual network, and name that network
- **THEN** both pages reach the paired state and one match is scheduled

#### Scenario: One-network pairing contacts no public list

- **WHEN** a pairing completes with a named one-network address
- **THEN** no request went to a public candidate list, and no server owned by the project was contacted at any point

#### Scenario: An address that is not reachable is reported

- **WHEN** the guest page cannot reach the address it was given
- **THEN** the pairing step names that no channel was reached, and the pages are not left in the paired state

### Requirement: The public candidate list is refreshed and pruned per open

The system SHALL read the public candidate list from its configured source each
time the network section is opened, and SHALL keep only the entries that answer a
candidate request within the attempt's wait. The system SHALL NOT offer an entry
that did not answer.

#### Scenario: The list is read again on every open

- **WHEN** the network section is opened a second time in the same page session
- **THEN** the list is read again from the configured source, not reused from the earlier open

#### Scenario: A dead entry is dropped

- **WHEN** an entry of the public list names no candidate within the attempt's wait
- **THEN** that entry is not offered to the attempt

#### Scenario: Every entry dead leaves the one-network address selectable

- **WHEN** no entry of the public list answers
- **THEN** the pairing step says the public list gave nothing usable, and naming a one-network address remains available

#### Scenario: An unreadable list source does not close the section

- **WHEN** the configured list source cannot be read
- **THEN** the network section still opens, the public list shows nothing usable, and naming a one-network address remains available
