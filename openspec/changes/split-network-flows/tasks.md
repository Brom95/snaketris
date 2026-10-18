# Tasks: split network play into a global flow and a local flow

Boxes may only be checked after their verification gate passes.

## 1. Split the network way into two flows

- [x] 1.1 Add a global and a local network item to the way sub-menu, so a
  player picks a flow before any page opens.
  - Verify: a harness reaches the way sub-menu and asserts both items are
  selectable and distinct.
- [x] 1.2 Carry the chosen flow in the pairing link, so the guest inherits the
  host's flow without typing, and a page's flow cannot change after it opens.
  - Verify: a unit test asserts the flow is read from the link and that a page
  opened without a flow marker takes the global flow.
- [x] 1.3 Keep the keyboard and pointer intents for both new items on the way
  screen.
  - Verify: a harness selects each item by key and by pointer.

## 2. The local flow states its own address

- [x] 2.1 Give a local-flow page one address field: a dotted-quad the player
  types, with the port read by the page rather than typed.
  - Verify: a unit test asserts a dotted-quad is accepted, a value naming a
  scheme is rejected, and no port is required from the player.
- [x] 2.2 Paint the page's address with the port it read, and keep the page
  waiting while no address was typed.
  - Verify: a harness asserts the address line shows the typed quad with a port
  and that a page whose player typed nothing publishes no secret.
- [x] 2.3 Carry the address and the port in the pairing link so the peer
  receives them without typing.
  - Verify: a unit test asserts the link names one address and one port and
  stays within the pairing fragment cap.

## 3. A page reads its own allocated port

- [x] 3.1 Read the page's own port from its own local description rather than
  assuming one.
  - Verify: a harness asserts two different pages of the same flow report
  different ports, and that each port appears in that page's own local
  description.
- [x] 3.2 Carry the port the page reads later onto the line it shows, so a peer
  opening that line joins on a port the line names rather than one it never
  names, and a page whose line already carries every value it holds keeps it.
  - Verify: `scripts/verify-network-local.mjs` asserts the line the page shows
  names the port the page read and differs from the line published without it;
  `tests/netplay.test.js` asserts a page that had read no port publishes a line
  naming none, and that refreshing it once the port lands names that port.
  - Measured (2026-10-18T02:36:27Z): the host page read its own port and its
  refreshed line carried it — the guest opened at that line and reports its peer
  as `100.107.90.10:40165`, the port the host read — so a player copying the
  line the page shows joins on a port the line names.

## 4. Each local-flow page offers the peer its own candidate

- [x] 4.1 Build the peer candidate from the peer's address and the peer's own
  port, bound to the remote description's media line.
  - Verify: a harness asserts a candidate built without the media line is not
  offered, and that the page reports no channel rather than a partial one.
- [x] 4.2 Never offer a candidate whose address the page was not given, and
  never read a public candidate list on a local-flow page.
  - Verify: a grep over the local-flow path names no public list and no shipped
  supply; a harness asserts a local-flow page contacts no list.
- [x] 4.3 Report a wrong address as still waiting, never as paired.
  - Verify: a harness asserts a page whose peer typed an address its device
  does not have reports no open channel.

## 5. The peer's address travels with the answer the channel carries

- [x] 5.1 Send the second page's own address beside the answer it posts, so the
  first page receives it over the channel the pairing already uses.
  - Verify: a unit test asserts the message the channel carries names the
  address that page's player typed.
- [x] 5.2 Complete the first page from the address the channel carries, and ask
  its player to type no address at all.
  - Verify: a harness asserts neither page shows a field for the peer's address.

## 6. The local flow pairs on one machine as a harness proof

- [ ] 6.1 Prove the transport in the harness with two pages on one machine
  naming `100.107.90.10` as each other's address and `3478` beside it.
  - Verify: a harness asserts both pages reach an open channel and a message
  crosses, which is a real transport proof and not a user-verified-later claim.
  - Measured: this proof is not reachable as the flow is built now. The page
  whose local description is an ANSWER exposes no port at all, so the copy that
  would point the host's candidate at the guest's socket has no source, and the
  harness asserts the measured shape instead (see design D3). The one
  arrangement not yet measured is a page naming a port of its own choice in the
  answer it sends.

## 7. Every copyable element carries a copy affordance

- [x] 7.1 Add a copy affordance — the 📑 mark — directly under the pairing link,
  under the pairing code and under the address line, whose click copies that value.
  - Verify: a harness clicks each affordance and asserts the value reaches the
  clipboard.
- [x] 7.2 Report a denied or unavailable copy and keep the value selectable.
  - Verify: a harness asserts the page says the copy did not happen and the
  value stays visible.
- [x] 7.3 Show no affordance beside an element a player cannot carry.
  - Verify: a harness asserts the waiting line and the title carry no copy
  affordance.

## 8. The global flow keeps its current meaning

- [x] 8.1 Leave the global flow's shipped floor and per-open public-list read
  byte-for-byte stable.
  - Verify: the in-flight `network-multiplayer-webrtc` harnesses still pass
  (`scripts/verify-ice-preload.mjs`, `scripts/verify-network-duel.mjs`).
  - Superseded for the supply itself by group 13: the user named the ICE servers
    the global flow ships, which replaces the floor and retires the list read.
- [x] 8.2 Keep the in-game steering branch byte-for-byte stable while the new
  way branches are added.
  - Verify: `js/input.js` `setDirection` in-game branch unchanged;
  `node --test tests/input.test.js` passes.

## 9. Docs, help copy and the stale config claim

- [x] 9.1 Name both flows and the one address each peer types in the help view
  and in `engine/README.md`.
  - Verify: `scripts/verify-views.mjs` pins the new help line in the same
  commit.
- [x] 9.2 Amend the stale `openspec/config.yaml` project-requirements comment
  that claims local-network play works without any candidate supply, since the
  measurement shows it works only with each peer naming its own address.
  - Verify: the comment states the address precondition, not a server-free
  local-only claim.

## 10. Gates

- [x] 10.1 `npm test` passes with the new unit tests and no regressions.
- [ ] 10.2 `npm run verify` passes with the new harnesses added.
- [x] 10.3 `quality_baseline` pinned before the work; `quality_delta` reports
  no new regression before declaring DONE.
- [x] 10.4 `doc_drift` reports no new false claim in the change's own docs.

## 12. The flow choice survives a narrow viewport

- [x] 12.1 Open the way sub-menu from the "Two Players" entry at every viewport
  width, so a phone picks which network flow runs rather than getting one
  unnamed flow.
  - Verify: `scripts/verify-two-player-gating.mjs` at 500px lands on the way
    sub-menu and picks each network item to its own flow.
- [x] 12.2 Keep the shared-page way the wide-only item, since it needs a second
  pad on this device.
  - Verify: the narrow layout lists the two network flows and no shared-page way.

## 13. The global flow names its candidate supply outright

- [x] 13.1 Ship the global flow's supply as the five ICE servers the user named:
  `stun1`–`stun4.l.google.com:19302` and `stun.stunprotocol.org:3478`.
  - Verify: `js/app.js` `ICE_SERVERS` names those five entries and an open with
    no supply in its address hands them to its peer connection.
- [x] 13.2 Retire the public-list read and its bounds: the read measured as
  yielding no candidates, and the shipped list is the supply now.
  - Verify: no page fetches a candidate list; `tests/app.test.js` and
    `scripts/verify-ice-preload.mjs` assert the shipped list and the `?ice=`
    override in place of the read. The named servers cost a headless page the
    whole attempt budget instead of resolving at once, so `scripts/verify-network-duel.mjs`
    now waits each page's attempt out before standing a channel in: standing in
    first left the attempt's own rebuild to replace the stand-in and swallow the
    answer the harness posts next.
- [x] 13.3 Keep the `?ice=` supply a page names for itself working, and the
  local flow naming no supply at all.
  - Verify: a link that names its supply hands only that supply; a local-flow
    page hands none.

## 14. The address a player types and the way re-pick

- [x] 14.1 Let the address field take every digit and dot the player types: on a
  page that names an address, a digit or dot is not spent spelling the code.
  - Verify: `tests/devices.test.js` with the flow recorded as the local one, a
    typed digit yields no intent; a typed letter still spells the code.
  - Verify: `scripts/verify-network-local.mjs` types a whole dotted address with
    the keyboard and the field holds it.
- [x] 14.2 Keep the address the player typed on the page as they type it.
  - Verify: `scripts/verify-way-switch.mjs` the field keeps its value while the page
    shows a malformed address, and nothing writes back into the field.
- [x] 14.3 Re-open the way choice until the page pairs: a page that picked a way
  and paired with nobody accepts the other way on the same page, and the switch
  takes back the offer the first way published.
  - Verify: `tests/netplay.test.js` a picked flow switches while unpaired, an
    unposted offer stays unpublished, a joined page keeps its flow.
  - Verify: `scripts/verify-way-switch.mjs` in a browser: a page that typed an address,
    walked back and picked the other way switches its flow, takes back its offer, link
    and address, hides the address it had asked for, runs its candidate attempt again
    under the new way, and publishes.
- [ ] 14.4 Re-check the claims the re-opened way weakens: the port constraint
  measured for one page holds for the other, and a page whose offer was taken
  back shows its waiting line plainly.
- [x] 14.5 Say why a typed address stays on the page while its digits go missing, and
  fix the cause where the page reads the field back and where a key stops a character:
  what is on the page is what the player typed, whole.
  - Verify: `scripts/verify-way-switch.mjs` in a browser: typing a whole dotted address
    leaves it whole in the field, no key is spent on the code, and the letters of a code
    still spell.
  - Verify: `scripts/verify-network-local.mjs` the same typing on both paired pages.
- [x] 14.6 State an address as four numbers of one byte each: a group over 255
  counts as no address, and the line names the shape the page wants.
  - Verify: `tests/netplay.test.js` an over-byte group is named; a quad of
    255s and one of zeros are addresses.
  - Verify: `scripts/verify-network-local.mjs` types without touching the field,
    so the address the player reaches is accepted whole.

## 15. What a page opened at a link shows

- [x] 15.1 A page that opens at a link its host published inherits the hosts code
  and holds no link of its own, so it paints no share line and no QR of an empty
  string. A scanner reading such a QR lands nowhere.
  - Verify: scripts/verify-opened-link.mjs
- [x] 15.2 The same-network way states what that way waits for; the candidate-server
  line belongs to the global way only.
  - Verify: scripts/verify-ice-preload.mjs, scripts/verify-opened-link.mjs
- [x] 15.3 A page that publishes a link of its own still shows that link and its QR.
  - Verify: scripts/verify-pairing-step.mjs, scripts/verify-network-links.mjs

## 16. The address a link carries is used, and the steps can be read

- [ ] 16.1 A page whose peer address and port came from a link its peer published
  points its own channel at that address and port, with nothing carried over the
  channel: the pointing belongs to the way, not to the browser's own message bus.
  - Verify: `tests/netplay.test.js` a page holding a peer address offers the
    candidate with no inbound report at all; a page holding none offers nothing.
  - Verify: `scripts/trace-pairing.mjs` the candidate lands on a page that never
    received a channel report.
- [ ] 16.2 The same-network way names no candidate line at any point of its
  pairing step; only the anywhere-network way names that route.
  - Verify: `scripts/verify-ice-preload.mjs` no candidate line on the local way,
    the route still named on the global way.
  - Verify: `scripts/verify-opened-link.mjs` the phone-sized page shows neither
    a candidate sentence nor a server name.
- [ ] 16.3 A durable harness prints every stage both pages pass through, in order
  and with the fields a stalled pair is recognised by, so reading the handshake is
  a printed table rather than a guess.
  - Verify: `scripts/trace-pairing.mjs` prints both pages' stage rows and names the
    stage each page reached last.
- [ ] 16.4 Re-check the gates on this tree: `npm test`, the full verify sweep,
    and `quality_delta`; then name what a two-device pair still lacks.

## 17. The link names the way it waits under

- [ ] 17.1 The link a page publishes names the way that page waits under, for
  either flow, and a page opened at such a link runs under the way the link names
  — today a global link names nothing and its page arrives with no way, so the
  line it shows asks about an address while its own way never wants one.
- [ ] 17.2 Checks: the link a global page publishes names the way it waits under,
  and the page opened at that link runs under the way it names; the same-network
  link keeps its address values unchanged beside the name.
  - Verify: scripts/verify-network-duel.mjs, scripts/verify-opened-link.mjs
- [ ] 17.3 Re-check every claim this weakens once the way is named: the way a page
  opens under is its host's choice, while a page still alone may re-choose until
  it pairs (14.3's re-open), and a page that paired keeps its way.

## 18. The field, the page and the key agree about one address

- [x] 18.1 Spend a digit and a dot on the address field while it is on the page,
  not on the code — Verify: tests/devices.test.js (a digit on a same-network page
  reaches no intent, a letter still spells the code), scripts/verify-network-local
  .mjs (typing the whole address one character at a time leaves the field holding
  it and the page's own code unspent).
- [x] 18.2 Keep the field's own value while the page asks, and paint the line from
  what is typed — Verify: scripts/verify-network-local.mjs (an over-one-byte group
  names the shape and keeps no address), scripts/verify-ice-preload.mjs (the
  anywhere-network page shows no address line).
- [x] 18.3 Re-open the way choice until the page pairs, take the published offer
  back on the switch, and run the open again under the new way — Verify: tests/
  netplay.test.js (the re-pick and its refusal once paired), scripts/verify-way-
  switch.mjs (the page publishes under the first way, the switch clears offer/link/
  code/address, a fresh connection runs the second way's attempt to its own publish
  ).
- [x] 18.4 Re-check the claims this weakens — Verify: scripts/verify-network-duel
  .mjs, scripts/verify-ice-preload.mjs, scripts/verify-all.mjs (whole sweep green,
  18 harnesses), npm test (302 pass).
- [ ] 18.5 The pair across two devices on one network stays unverified here: this
  browser refuses an answer whose media line it did not write (InvalidStateError,
  measured) and reads no port from its own description, so no harness here can
  stand the second socket in — the user verifies on their own network.

## 19. The port the host read reaches the link it shows

- [x] 19.1 Build the pairing link in one step both the publish and a later refresh share,
      so the line names the address and the port the page knows by then.
  - Verify: tests/netplay.test.js (a page whose port lands after its publish shows the link
    carrying it; a page that never reads a port keeps the link without one).
- [x] 19.2 Refresh the link on the pairing tick once the port arrives.
  - Verify: scripts/verify-network-local.mjs (the host's published link names its own port,
    not only its address; the page opened at that line reports the same port as its peer).
- [ ] 19.3 Re-check the claims this weakens.
  - Verify: npm test green, scripts/verify-all.mjs whole sweep green.

## 20. The lines the same-network way shows

- [ ] 20.1 Paint no short readable code, no candidate line, and no candidate wait on the
      same-network way: that way asks an address, never a server, and typed digits go to the
      address field, so a code painted there is a value no player could type. The other way
      keeps all three.
  - Verify: scripts/verify-network-local.mjs (the host page on that way names no code and no
    candidate line while it waits), scripts/verify-pairing-step.mjs (the other way still
    paints its code with the affordance under it), scripts/verify-ice-preload.mjs.
- [ ] 20.2 Re-check the claims this weakens.
  - Verify: npm test green, scripts/verify-all.mjs whole sweep green.

## 21. The way choice opens wherever its player is

- [x] 21.1 The two-player entry offers the way sub-menu at every viewport width
  - Verifies: 1.2, 3.1, 5.2
  - Why: a phone player had no way to name an address at all, so the wide-viewport shortcut
    picked the shared-page way for them and the LAN match could not be finished; the choice
    is offered everywhere and only the shared-page way - the one that needs two pads on one
    device - is hidden on a stacked viewport.
  - Counter: the way sub-menu is hidden again at the narrow width, or the shared-page way is
    offered there and a phone player picks it.
  - Verify: scripts/verify-two-player-gating.mjs (the narrow section opens the way sub-menu,
    lists both network ways and Back, and hides the shared-page item), scripts/verify-ice-preload.mjs.

- [x] 21.2 A page that picked one way and paired with nobody takes the other way and runs
  its open again under it
  - Verifies: 5.2
  - Why: the two-page LAN match was being tested on one screen, and the second variant a
    player opened kept the first variant's flow.
  - Counter: the page keeps its first way, keeps the first way's offer published, or keeps
    the channel that first way opened.
  - Verify: scripts/verify-way-switch.mjs (the global way publishes; after backing out the
    same-network way is taken, the offer is gone, a fresh connection appears, and the typed
    address reaches the published link and its painted code).

- [ ] 21.3 Re-check the claims this weakens.
  - Verify: npm test green, scripts/verify-all.mjs whole sweep green.

## 11. User-verified-later (not a code gate)

- [ ] 11.1 Two real devices on one network pair through the local flow in the
  user's browser, on a network that lets the two sockets reach each other.
- [ ] 11.2 The clipboard affordance works in the user's browser; a browser that
  denies it says so.
- [ ] 11.3 Safari/iOS behaviour of a hand-crafted candidate is unmeasured and
  must not be claimed until verified.
