# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: The pairing step keeps its confirm control reachable while the address field is focused
The pairing step SHALL keep its confirm control reachable when the address field has focus, so the player can confirm pairing without first dismissing the address field. The address field SHALL NOT be held in focus after input, so an open virtual keyboard does not stay open and cover the confirm control.

#### Scenario: Pair is reachable after an address is supplied on a phone
- **WHEN** the player has supplied an address (typed or auto-detected) and the virtual keyboard is open on the pairing step
- **THEN** the player can still tap the confirm control without the keyboard covering it, and the address field is not re-focused, so the keyboard does not reopen and cover the confirm control again
