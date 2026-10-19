# start-menu Specification

## Purpose
The starting menu shown on launch and after game over, offering "Play", "Records", and "How to Play" items selectable by keyboard or pointer, and the flow that launches the game, opens the records view, opens the help view, and returns to the menu. "Play" opens a role sub-menu where the player chooses to play as the Snake or as Tetris before the game begins.

## Requirements

### Requirement: Starting menu on launch and after game over
The system SHALL display the starting menu when the page first loads and again whenever a game ends, replacing the previous idle and game-over views. The menu shows the title, the three selectable items, and the GitHub icon, and no longer shows a navigation hint line (the icon takes the space where it used to be). The menu SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: Menu shown on first launch
- **WHEN** the page loads the game for the first time
- **THEN** the starting menu is shown instead of the game board

#### Scenario: Menu shown after game over
- **WHEN** a game ends (game over)
- **THEN** control returns to the starting menu

#### Scenario: No navigation hint line on the menu
- **WHEN** the starting menu is shown
- **THEN** no navigation hint line is rendered below the menu items; the space below the items holds the GitHub icon instead

### Requirement: Menu labels are left-aligned with the block centered
The system SHALL render the starting menu's labels — the "snaketris" title and the three menu items ("Play", "Records", "How to Play") — left-aligned so that every label line begins at the same horizontal position. That shared left edge SHALL be positioned so the menu block remains horizontally centered within the interface area the menu occupies, and every menu label line SHALL be fully visible (not clipped) at every supported viewport size.

#### Scenario: All menu labels share a common left edge
- **WHEN** the starting menu is shown
- **THEN** the title and each menu item start at the same horizontal position (left-aligned) rather than each line being centered individually

#### Scenario: Menu block stays centered and unclipped
- **WHEN** the starting menu is shown at any viewport size and any item is highlighted
- **THEN** the leftmost label edge and the widest label's right edge are symmetric about the center of the menu's own area, so the block stays centered and no menu label is clipped

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

### Requirement: Keyboard navigation and confirmation
The system SHALL let the player move the selection with the arrow keys (and W/S) and confirm the highlighted item with Enter or Space, whether or not the menu items are focusable page elements. A single confirmation SHALL perform exactly one menu action.

#### Scenario: Arrows move selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the menu is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle ("Play" → "Records" → "How to Play" → "Play")

#### Scenario: Enter or Space confirms
- **WHEN** the player presses Enter or Space while the menu is shown
- **THEN** the highlighted item's action is performed

#### Scenario: Confirmation fires once
- **WHEN** the player confirms the highlighted item with Enter or Space while the menu is shown
- **THEN** exactly one menu action runs, and no second action is triggered by the same key press

### Requirement: Pointer and touch selection
The system SHALL let the player select a menu item by clicking or tapping it, whether the item is a page element or a painted label.

#### Scenario: Clicking or tapping selects an item
- **WHEN** the player clicks or taps a menu item while the menu is shown
- **THEN** that item is selected and its action is performed (Play starts the game; Records opens the records view; How to Play opens the help view)

#### Scenario: Tapping the interface does not steer the snake
- **WHEN** the player taps a menu item while the menu is shown
- **THEN** the tap selects the item and is not interpreted as a steering gesture

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

### Requirement: Role sub-menu lists two roles
The system SHALL show a role sub-menu with exactly two selectable items, "Snake" and "Tetris", each shown with its role marker (Snake: 🐍, Tetris: 🏗️), with exactly one highlighted as the current selection. The sub-menu SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: Both roles listed
- **WHEN** the role sub-menu is shown
- **THEN** "Snake" and "Tetris" are listed and exactly one is highlighted

#### Scenario: Each role item shows its marker
- **WHEN** the role sub-menu is shown
- **THEN** the Snake item shows the 🐍 marker and the Tetris item shows the 🏗️ marker

#### Scenario: Role items are spaced apart
- **WHEN** the role sub-menu is shown
- **THEN** the two items are separated from one another and each has its own distinct hit area

### Requirement: Role screen replaces the starting menu
The system SHALL show the role screen as its own view in `SELECT_ROLE`: the starting-menu items, the menu title and the GitHub link SHALL be hidden while the role screen is shown, and the role screen SHALL show only its own title, the two role items and a Back control. The role screen SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: Menu content is hidden on the role screen
- **WHEN** the role screen is shown
- **THEN** the "Play", "Records" and "How to Play" items, the "snaketris" title and the GitHub link are not shown

#### Scenario: Role screen shows its own content
- **WHEN** the role screen is shown
- **THEN** the role title, the two role items and the Back control are the only menu-area content on screen

### Requirement: Keyboard role selection
The system SHALL let the player move the role-screen selection with the arrow keys (and W/S) through "Snake", "Tetris" and "Back", and SHALL confirm the highlighted item with Enter or Space. Confirming a role item starts the game. Confirming "Back" returns to the starting menu. A single confirmation SHALL perform exactly one action.

#### Scenario: Arrows move the role selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the role screen is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle "Snake" → "Tetris" → "Back" → "Snake"

#### Scenario: Enter confirms the role
- **WHEN** the player presses Enter or Space while a role item is highlighted
- **THEN** the highlighted role is chosen and the game starts

#### Scenario: Enter on Back returns to the menu
- **WHEN** the player presses Enter or Space while "Back" is highlighted
- **THEN** the starting menu is shown again and no game has started

### Requirement: Pointer role selection
The system SHALL let the player choose a role by clicking or tapping its item.

#### Scenario: Clicking a role chooses it
- **WHEN** the player clicks or taps the "Tetris" item in the role sub-menu
- **THEN** the game starts in Tetris role

### Requirement: Role sub-menu can be cancelled
The system SHALL return from the role screen to the duration sub-menu in response to Escape (keyboard), the gamepad B button, a click or tap on the Back item, or a confirmation while the Back item is highlighted, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the role screen is shown and the player presses Escape
- **THEN** the duration sub-menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back item on the role screen
- **THEN** the duration sub-menu is shown again and no game has started

#### Scenario: Confirming the Back item returns to the menu
- **WHEN** the player highlights "Back" and presses Enter or Space
- **THEN** the duration sub-menu is shown again and no game has started

### Requirement: Records opens the records view
The system SHALL open the records view when "Records" is selected from the menu. The records view SHALL present its duration selector and one board list (see the `highscores` capability).

#### Scenario: Records opens leaderboard
- **WHEN** "Records" is selected
- **THEN** the records view is shown with its duration selector and one board list (see the `highscores` capability)

### Requirement: How to Play opens the help view
The system SHALL open the help view when "How to Play" is selected from the menu.

#### Scenario: How to Play opens help screen
- **WHEN** "How to Play" is selected
- **THEN** the help view is shown

### Requirement: Help view shows controls and rules
The system SHALL display the game's controls and rules in the help view, and SHALL offer a control to return to the starting menu. The controls list SHALL cover every input device for the role the player chose: keyboard, touch/pointer, and gamepad. All help-view text lines SHALL fit within the viewport width at every supported viewport size (not clipped).

#### Scenario: Controls are listed
- **WHEN** the help view is shown
- **THEN** the steering controls for both roles are listed for the keyboard (arrow keys / WASD), for touch (swipe or tap), and for the gamepad (D-pad and left thumbstick), together with the start control (R or click/tap) and the gamepad confirm/back buttons (A and B)

#### Scenario: Rules are listed
- **WHEN** the help view is shown
- **THEN** the core rules are listed (the bot plays the side the player did not choose, snake points for eaten cells and whole pieces, Tetris points for landed blocks and cleared rows, a blocked rotation is ignored, a piece shifts sideways once per snake step, edges wrap around)

#### Scenario: Help text fits the board width
- **WHEN** the help view is shown at any supported viewport size
- **THEN** every control and rule line is fully visible within the visible page width and the page does not scroll horizontally

#### Scenario: Return to menu from help
- **WHEN** the player confirms or clicks/taps the return control in the help view
- **THEN** the starting menu is shown

### Requirement: GitHub link displayed below menu items
The system SHALL display a GitHub link below the three standard menu items ("Play", "Records", "How to Play") in the starting menu, as a page-level link element visually distinct from the selectable menu items. The link SHALL NOT participate in keyboard or gamepad navigation.

#### Scenario: GitHub link visible on menu
- **WHEN** the starting menu is shown
- **THEN** a GitHub link/icon is rendered below the "How to Play" item, separated from the selectable menu items

### Requirement: GitHub opens the repository page
The system SHALL navigate to the GitHub repository page `https://github.com/Brom95/snaketris` in a new browser tab when the GitHub link/icon is clicked or tapped. The navigation SHALL NOT depend on script-opened windows, so a popup blocker cannot suppress it.

#### Scenario: Click opens repo
- **WHEN** the player clicks or taps the GitHub link/icon on the menu
- **THEN** the browser navigates to `https://github.com/Brom95/snaketris` in a new tab

### Requirement: Menu, records and help views are page elements
The system SHALL render the starting menu, the records view and the help view as page elements, so their text is selectable, browser-scalable, and readable by assistive technology, and so their hit areas follow their rendered boxes rather than a separately maintained layout.

#### Scenario: Records list is page text
- **WHEN** the records view is shown
- **THEN** each leaderboard line is page text the browser can select and scale

#### Scenario: Hit area follows the rendered label
- **WHEN** the player clicks just outside a rendered menu label
- **THEN** the item is not selected, and clicking on the rendered label selects it

### Requirement: One view authority
The system SHALL derive which of the menu, records, help and game-over views is shown from a single game-state authority, so the visible page elements and the accepted input never disagree.

#### Scenario: Input matches the shown view
- **WHEN** any view is shown
- **THEN** the input that acts is the input defined for that shown view, and no input belonging to another view is accepted

### Requirement: Field is hidden while the menu, records or help view is shown
The system SHALL show the play field only while a game is in progress or has just ended: the field SHALL be absent from the page while the starting menu, the duration sub-menu, the role sub-menu, the records view or the help view is shown, and SHALL be on screen in `PLAYING` and `GAME_OVER`. The field's visibility SHALL be derived from the same game-state authority that selects the view.

#### Scenario: No field behind the starting menu
- **WHEN** the starting menu is shown
- **THEN** the play field is not shown at all and the menu occupies the page on its own

#### Scenario: No field behind the duration or role sub-menu
- **WHEN** the duration sub-menu or the role sub-menu is shown
- **THEN** the play field is not shown

#### Scenario: No field behind the records or help view
- **WHEN** the records view or the help view is shown
- **THEN** the play field is not shown

#### Scenario: Final board stays visible at game over
- **WHEN** a game ends and the game-over message is shown
- **THEN** the final board remains visible in the play field until control returns to the starting menu

### Requirement: Menu items have distinct spacing and hit targets
The system SHALL space the three starting-menu items ("Play", "Records", "How to Play") apart from one another, so that each item is a distinct target rather than a dense block of labels. The spacing SHALL be large enough that tapping one item does not select a neighbour by accident.

#### Scenario: Items are spaced apart
- **WHEN** the starting menu is shown
- **THEN** the three items are separated from one another (not clustered together) and each has its own distinct hit area

#### Scenario: Tapping an item selects only that item
- **WHEN** the player taps one menu item while the menu is shown
- **THEN** only that item is selected, and no other item is selected by the same tap

### Requirement: Menu items keep their geometry when the selection moves
The system SHALL keep every menu item and every role-screen item at the same width, font size and position when the selection marker moves from one item to another. The marker SHALL be present on every item and SHALL change only its visibility. A selected item SHALL differ from an unselected item by colour only.

#### Scenario: The marker moves to the longest item
- **WHEN** the selection marker moves onto "How to Play" in the starting menu
- **THEN** the width of the item list and the left edge of every item are unchanged

#### Scenario: The marker moves on the role screen
- **WHEN** the selection marker moves between the role items and the Back item
- **THEN** the width of the role item list and the left edge of every item are unchanged

#### Scenario: No item changes its font size
- **WHEN** an item becomes selected or unselected
- **THEN** its font size is the same as before

### Requirement: Menu and role items use one font size
The system SHALL render the three starting-menu items and the role-screen items at the same font size.

#### Scenario: Both screens use the same size
- **WHEN** the starting menu and the role screen are shown
- **THEN** every selectable item on both screens uses the same font size

### Requirement: Back is a selectable item on the role screen
The system SHALL place the Back control in the same item list as the two role items on the role screen, and SHALL include it in the selection cycle.

#### Scenario: Back is listed with the role items
- **WHEN** the role screen is shown
- **THEN** the item list contains "Snake", "Tetris" and "Back" in that order

#### Scenario: The marker reaches Back
- **WHEN** the player moves the selection down from "Tetris" on the role screen
- **THEN** "Back" is highlighted

### Requirement: Duration sub-menu lists three durations
The system SHALL show a duration sub-menu with exactly three selectable items — "1 minute", "3 minutes" and "5 minutes" — with exactly one highlighted as the current selection. The sub-menu SHALL be composed of page elements rather than text painted onto the play field.

#### Scenario: All durations listed
- **WHEN** the duration sub-menu is shown
- **THEN** "1 minute", "3 minutes" and "5 minutes" are listed and exactly one is highlighted

#### Scenario: Duration items are spaced apart
- **WHEN** the duration sub-menu is shown
- **THEN** the three items are separated from one another and each has its own distinct hit area

### Requirement: Duration sub-menu keyboard navigation
The system SHALL let the player move the duration selection with the arrow keys (and W/S) through the three duration items and a Back item, and SHALL confirm the highlighted item with Enter or Space. A single confirmation SHALL perform exactly one action.

#### Scenario: Arrows move duration selection
- **WHEN** the player presses an up or down arrow key (or W/S) while the duration sub-menu is shown
- **THEN** the highlighted item moves to the next or previous item in the cycle "1 minute" → "3 minutes" → "5 minutes" → "Back" → "1 minute"

#### Scenario: Enter confirms a duration
- **WHEN** the player presses Enter or Space while a duration item is highlighted
- **THEN** that duration is chosen and the role sub-menu is shown

#### Scenario: Confirmation fires once
- **WHEN** the player confirms the highlighted duration with Enter or Space
- **THEN** exactly one action runs, and no second action is triggered by the same key press

### Requirement: Duration sub-menu pointer selection
The system SHALL let the player choose a duration by clicking or tapping its item.

#### Scenario: Clicking a duration chooses it
- **WHEN** the player clicks or taps the "5 minutes" item in the duration sub-menu
- **THEN** the match is set to 5 minutes and the role sub-menu is shown

### Requirement: Duration sub-menu can be cancelled
The system SHALL return from the duration sub-menu to the starting menu in response to Escape (keyboard), the gamepad B button, a click or tap on the Back item, or a confirmation while the Back item is highlighted, and SHALL NOT start a game.

#### Scenario: Escape returns to the menu
- **WHEN** the duration sub-menu is shown and the player presses Escape
- **THEN** the starting menu is shown again and no game has started

#### Scenario: The Back control returns to the menu
- **WHEN** the player clicks or taps the Back item on the duration sub-menu
- **THEN** the starting menu is shown again and no game has started

### Requirement: Duration screen replaces the starting menu
The system SHALL show the duration screen as its own view: the starting-menu items, the menu title and the GitHub link SHALL be hidden while the duration screen is shown, and the duration screen SHALL show only its own title, the three duration items and a Back control.

#### Scenario: Menu content is hidden on the duration screen
- **WHEN** the duration screen is shown
- **THEN** the "Play", "Records" and "How to Play" items, the "snaketris" title and the GitHub link are not shown

#### Scenario: Duration screen shows its own content
- **WHEN** the duration screen is shown
- **THEN** the duration title, the three duration items and the Back control are the only menu-area content on screen

### Requirement: Records view selects a board by duration
The records view SHALL show a duration selector with three items — "1 minute", "3 minutes" and "5 minutes" — above one leaderboard list, with exactly one selector item highlighted. The list SHALL show the board of the highlighted duration only.

#### Scenario: The highlighted selector item picks the board
- **WHEN** the records view is shown with "3 minutes" highlighted
- **THEN** the list shows the 3-minute board and no other board

#### Scenario: Switching the selection switches the list
- **WHEN** the player moves the records selector from "1 minute" to "5 minutes"
- **THEN** the list repaints with the 5-minute board and the selector highlights "5 minutes"

### Requirement: Records duration cursor starts at the 1-minute board
The system SHALL start the records duration cursor at the 1-minute board when the records view is opened.

#### Scenario: First board shown
- **WHEN** the player opens the records view
- **THEN** "1 minute" is the highlighted selector item and the list shows the 1-minute board

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
