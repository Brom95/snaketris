# Design

## Context

Same-network pairing currently requires each page to carry its own LAN address by
hand. The address is written to the pairing state by `noteAddress` (js/netplay.js)
from text the player types, and the port is read from the page's own SDP by
`noteOwnPort` from the `a=candidate:` lines. The pairing step re-focuses the
address field on every paint frame (js/ui.js `paintPairing`), which on a phone
keeps the virtual keyboard open and covers the Pair control.

## Goals / Non-Goals

**Goals:**
- Fill the page's own address from the first private-range LAN host candidate its
  RTCPeerConnection gathers, so the player is not required to type it.
- Keep the Pair control reachable on a phone by stopping the every-frame
  re-focus of the address field.
- Keep the manual path: if no host candidate can be found, the field stays empty
  and the player can still type.

**Non-Goals:**
- Any change to the global (STUN/TURN) path, game logic, or network frames.
- Removing the manual address field or the peer-address fallback.

## Decisions

### Detect the address from ICE host candidates, not STUN
The page's own RTCPeerConnection enumerates host candidates during ICE gathering.
The first host candidate whose address is in a private range (192.168.x.x,
10.0.0.0/8, 172.16.0.0/12) and is not link-local (169.254.x.x) is taken as the
page's own LAN address. This is the same data the browser already needs to
connect, so no extra network request is made.

Alternatives considered: (a) STUN server lookup — rejected, it returns only the
public (often CGNAT) address, which is not a reachable LAN address; (b) parsing
the page's interfaces via a native API — rejected, browsers expose no such API.

Implementation: after `createTransport` builds the RTCPeerConnection in
js/app.js, attach a one-time listener on its `icecandidate` events. On the first
matching host candidate, call `noteAddress(detected)` to write it to the pairing
state. The port continues to be read from the SDP by `noteOwnPort` exactly as
before, so no change is made to port handling.

### Accept a detected value where a typed value was accepted
`noteAddress` validates a dotted-quad and writes it to the pairing state. A
detected address is the same shape, so `noteAddress` is used unchanged for both.
No new validation path is added, and the existing error reporting is preserved.

### Focus the address field once, not every frame
The every-frame `focus()` in `paintPairing` is removed. The field is focused once
when the pairing step is first shown (so a player can start typing immediately),
and is left alone thereafter so an open virtual keyboard does not stay open and
cover the Pair control. If the field is later cleared, it may be re-focused once;
it is never re-focused on a steady paint frame.

## Risks / Trade-offs

- [A candidate may not be gathered before the player confirms] → the manual
  fallback keeps the field usable; the page still works if the player types.
- [A device with several LAN interfaces (Wi-Fi + wired + VPN) reports more than
  one host candidate] → the first private-range host candidate is taken; on the
  common phone (one interface) there is only one, and the manual fallback covers
  the rest.
- [Auto-detection is a same-network feature] → it is intentionally out of scope
  for the global path, so the change does not touch STUN/TURN handling.

## Open Questions

None.
