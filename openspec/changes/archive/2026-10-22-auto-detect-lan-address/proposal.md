# Proposal

## Why

The same-network (one Wi-Fi / one virtual network) pairing flow currently forces
each player to type their own LAN address (a 192.168.x.x / 10.x / 172.x line) by
hand before a match can start. On a phone this is error-prone in two ways: the
virtual keyboard covers the Pair control so it is hard to tap, and an every-frame
re-focus of the address field keeps re-opening the keyboard. A single typo in a
dotted-quad silently fails the pair. Auto-detecting the local address from the
browser's own ICE host candidates removes the typing and the mobile-UI problem
while leaving the manual path as a fallback.

## What Changes

- The network way auto-fills each page's own address line from the first
  private-range LAN host candidate its RTCPeerConnection gathers (192.168.x.x,
  10.x, 172.16-31.x), so the player does not have to type it. The port is read
  from the same gathering exactly as the current code already does.
- The pairing step stops re-focusing the address field on every paint frame, and
  its confirm control (Pair) stays reachable even when the address field has the
  focus, so the player can confirm pairing after the address is supplied.
- A manual fallback is kept: if no private-range host candidate can be found, the
  address field stays empty and the player can still type the address by hand
  (the existing validation and error reporting are unchanged).
- The global / anywhere-network path (STUN/TURN) is unchanged: auto-detection is
  a same-network feature only, so no behavior is added there.

## Capabilities

### Modified Capabilities

- network-play: the requirement "The same-network pair carries one line by hand"
  is relaxed so a page may carry its own address line by detection instead of by
  hand; the requirement "The pairing step takes the typed address on the one way"
  is broadened so the field accepts a detected value; and a requirement is added
  that the pairing step keeps its confirm control reachable while the address
  field is focused.

## Impact

- js/app.js: createTransport attaches a one-time listener on the new
  RTCPeerConnection to read ICE host candidates and report the first private-range
  one back to the pairing state.
- js/netplay.js: noteAddress accepts the auto-detected dotted-quad exactly as it
  accepts a typed one; no new network frames or game logic.
- js/ui.js: paintPairing stops the every-frame focus call and keeps the Pair
  control reachable.
- No new dependencies, no change to the game model or to network frames.
