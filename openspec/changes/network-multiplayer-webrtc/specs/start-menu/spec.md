# Spec Delta

## Purpose

Adds the network-play entry to the starting menu and the pairing step it opens.

## MODIFIED Requirements

### Requirement: Three menu items

The system SHALL present the starting menu items - "Play", "Two Players", "Records", and "How to Play" - with up to four selectable items at every viewport width, with exactly one item highlighted as the current selection. The "Two Players" entry SHALL be offered at every viewport width, because each peer of a network match plays on its own device. The viewport width SHALL NOT gate the entry; it gates one of the two ways the entry offers.

#### Scenario: All items listed

- **WHEN** the starting menu is shown
- **THEN** "Play", "Two Players", "Records" and "How to Play" are listed and exactly one is highlighted

#### Scenario: Four items on a wide viewport

- **WHEN** the viewport is wide (desktop)
- **THEN** the menu shows "Two Players" alongside the other items and its entry offers both two-player ways

#### Scenario: Three items on a narrow viewport

- **WHEN** the viewport is narrow (mobile touch)
- **THEN** the menu lists the same four items as on a wide viewport and confirming "Two Players" opens the pairing step directly

### Requirement: Play starts a new game

The system SHALL open the duration sub-menu when "Play" is selected from the menu, and SHALL open the role sub-menu only after the player confirms a duration. The system SHALL start a new game only after the player chooses a role. Selecting the network way under "Two Players" SHALL open the pairing step instead, and no match shall start before a peer is paired.

#### Scenario: Play opens the duration sub-menu first

- **WHEN** "Play" is selected
- **THEN** the duration sub-menu is shown and the game board is not shown

#### Scenario: Play opens the role sub-menu first

- **WHEN** "Play" is selected and the player confirms a duration
- **THEN** the role sub-menu is shown and the game board is not shown

#### Scenario: The network way opens the pairing step

- **WHEN** the network way is confirmed
- **THEN** the pairing step is shown, the game board is not shown and no match has started

#### Scenario: No match starts before pairing

- **WHEN** the network way is confirmed and no peer is paired
- **THEN** no match is in progress and the play field is not shown

#### Scenario: Play launches gameplay

- **WHEN** "Play" is selected, a duration is confirmed and the player then chooses a role
- **THEN** a new game begins with a fresh board, a snake, the first piece queued and the chosen countdown

#### Scenario: A chosen role starts the game

- **WHEN** the player chooses a role in the role sub-menu
- **THEN** a new game starts with that role, the chosen duration and the game board shown

## ADDED Requirements

### Requirement: The Two Players entry splits into two ways

The "Two Players" entry SHALL state the two ways a two-player match can run: "Same computer", where both players share this page, and "Network", where each player plays on their own device. The system SHALL show the way sub-menu only on a wide viewport. On a narrow viewport the system SHALL select the "Network" way automatically and open the pairing step, because each peer plays on its own device.

#### Scenario: Both ways offered on a wide viewport

- **WHEN** the viewport is wide and the "Two Players" entry is confirmed
- **THEN** the way sub-menu lists "Same computer" and "Network" and exactly one is highlighted

#### Scenario: The narrow viewport picks the network way automatically

- **WHEN** the viewport is at or below the stacked-layout threshold and the player confirms the "Two Players" entry
- **THEN** the pairing step is shown directly, no way sub-menu is shown and no match has started

#### Scenario: The same-computer way keeps the local flow

- **WHEN** the "Same computer" way is confirmed
- **THEN** the duration sub-menu is shown and the match runs both players on this page

#### Scenario: The network way opens the pairing step

- **WHEN** the "Network" way is confirmed
- **THEN** the pairing step is shown, the game board is not shown and no match has started

#### Scenario: The way sub-menu can be left

- **WHEN** the player confirms the Back control on the way sub-menu
- **THEN** the starting menu is shown again and no match has started

### Requirement: The pairing step states its own name and expected action

The pairing step SHALL state its own name and the action it expects, and SHALL show the secret in two forms: a link the second player opens on their own device, and a short readable code the second player can enter on their own device. The step SHALL show a Back control and SHALL NOT show the play field.

#### Scenario: The pairing step names the action

- **WHEN** the pairing step is shown
- **THEN** its title names the step and its hint line lists the keys that advance it

#### Scenario: The secret is readable

- **WHEN** the pairing step is shown after the first player opened it
- **THEN** the secret is displayed as page text the second player can enter

#### Scenario: The step paints a scannable link

- **WHEN** the pairing step is shown on the first player's page
- **THEN** the step paints a code image of the share link and the link itself as page text

#### Scenario: Back leaves the pairing step

- **WHEN** the player confirms the Back control on the pairing step
- **THEN** the starting menu is shown again and no match has started

### Requirement: The guest page mirrors the host's preparation

The guest page SHALL paint a read-only copy of the duration sub-menu and the role sub-menu while the host page drives them. The guest SHALL NOT offer a selectable item for either copy, and its waiting line SHALL stay visible next to the copies.

#### Scenario: The guest paints the mirror lists

- **WHEN** the host page shows the duration sub-menu or the role sub-menu
- **THEN** the guest page paints the same item list and its waiting line

#### Scenario: The guest mirror marker follows before the host confirms

- **WHEN** the host moves its marker onto an item and has not confirmed
- **THEN** the guest mirror marker is on the same item

#### Scenario: The guest cannot act on the mirror

- **WHEN** the guest page confirms any key while a mirror is painted
- **THEN** the host's selection does not change and the guest shows no selection of its own
