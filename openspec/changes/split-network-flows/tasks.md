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
- [ ] 1.3 Keep the keyboard and pointer intents for both new items on the way
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
  naming `127.0.0.1` as each other's address.
  - Verify: a harness asserts both pages reach an open channel and a message
  crosses, which is a real transport proof and not a user-verified-later claim.
  - Measured: this proof is not reachable as the flow is built now. The page
  whose local description is an ANSWER exposes no port at all, so the copy that
  would point the host's candidate at the guest's socket has no source, and the
  harness asserts the measured shape instead (see design D3). The one
  arrangement not yet measured is a page naming a port of its own choice in the
  answer it sends.

## 7. Every copyable element carries a copy affordance

- [x] 7.1 Add a copy affordance beside the pairing link, the pairing code, the
  address line and the return line, whose click copies that value.
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

## 11. User-verified-later (not a code gate)

- [ ] 11.1 Two real devices on one network pair through the local flow in the
  user's browser, on a network that lets the two sockets reach each other.
- [ ] 11.2 The clipboard affordance works in the user's browser; a browser that
  denies it says so.
- [ ] 11.3 Safari/iOS behaviour of a hand-crafted candidate is unmeasured and
  must not be claimed until verified.
