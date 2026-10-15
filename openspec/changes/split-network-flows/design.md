# Design: split network play into a global flow and a local flow

## The mechanism that makes a local flow possible at all

A WebRTC datachannel needs each side to open a DTLS session to the other side's
allocated socket. A browser never exposes its own socket address, and a page-minted
offer names only `127.0.0.1`. What a page *does* know is the port its own
connection allocated: its local description carries it.

Measured, one Chromium instance at `iceServers: []`:

```
a=candidate:1414608955 1 udp 2113937151 24f0be48-c327-435d-9540-633d0ea1d3b5.local 33500 typ host generation 0 network-cost 999
```

The address is a self-reference (`<uuid>.local` resolves only inside that browser
instance — measured: two instances never reached each other's candidates), but
`33500` is the real allocated port. Hand-crafting the *peer's* candidate from a
typed IP plus that port connects. Measured, two separate Chromium instances
(= two devices), each given the other's port:

```
candidate:9 1 udp 2113937151 127.0.0.1 <peer port> typ host   sdpMid "0"   sdpMLineIndex 7
A: {"conn":"connected","ice":"connected"}
B: {"conn":"connected","ice":"connected","got":["ping-from-A"]}
```

So the local flow's precondition is not a supply and not a relay: it is one
dotted-quad typed per peer. The port needs nothing from the player.

## Decisions

### D1 — the split lives in the way sub-menu

The network way item becomes two selectable items (global, local) on the
`SELECT_WAY` screen, so the choice is made before any page opens and a page's
flow is fixed by the link it was opened at. The flow choice travels in the
pairing link, not in a setting, so the guest inherits the host's flow without
typing.

**Alternative considered:** one flow that tries the candidate supply first and
falls back to addresses. Rejected: it mixes the flows, and a page cannot know
which peer it will meet, so a fallback would silently change what a player
thinks they are doing.

### D2 — the pairing link carries the address, the secret stays the offer

The offer blob stays the negotiation half: the DTLS handshake needs the `m=`
line, `ice-ufrag`, `ice-pwd` and fingerprint from it, and the fragment already
Carries it. What the local flow adds is not inside the secret but beside it on
the link — `?flow=local`, `&a=<address>`, `&p=<port>` — because the whole
fragment IS the secret (`openPairingLink` hands `location.hash` to `adopt`
whole) and a line tagged onto the blob would reach `setRemoteDescription`.

**Alternative considered:** carrying the address inside the secret. Rejected:
the code form would then have to encode an address a player cannot type, and the
flow marker could not ride in the fragment at all.

### D3 — the peer's address travels with the answer, over the channel

The pairing machinery already sends the guest's answer over the datachannel
before the channel is negotiated (`answerOffer` posts `A`, `acceptAnswer` reads
it), so each page's own address travels beside its answer in one extra channel
message (`a`, carrying `address:port`) rather than through
a second hop. The host page never asks its player to carry anything back, and
neither page shows a field for what the other one painted.

The port cannot ride the pairing link: a page holding only a local offer
description has no allocated port to read at publish time, so each page reads
its own port from its own gathered description (`noteOwnPort`) and announces it
over the channel. A candidate is offered only once this page already holds a
remote description, because the candidate has to bind to a media line.

**Alternative considered:** a return hop the host player types — the first page
painting the second page's address for them to carry. Rejected twice over: the
measured shape where both pages negotiate from one offer blob never connected
(ice went `checking` then `disconnected`, `connectionState` `failed`), and a
page's DTLS answer is only acceptable to a peer that negotiated from the same
offer, so the blob has to travel anyway. The channel carries messages before
negotiation, so the chicken-and-egg the earlier draft reasoned from does not
exist here.

### D4 — the copy affordance is one element per copyable value

Each copyable value (link, code, address, return line) gets a sibling copy-icon
element whose click calls `navigator.clipboard.writeText` on that value. The
affordance is a separate element, not a text mutation, so the painted value stays
the single source of truth and the existing pointer/keyboard intent paths keep
their ids.

**Alternative considered:** making the value element itself clickable. Rejected:
the value element is also the readable text the player checks; clicking it for
another reason makes "what am I copying" ambiguous.

### D5 — the flows are proven differently, and honestly

The local flow is provable in the harness: two headless pages on one machine
typed `127.0.0.1` as each other's address and reached `connected` with a message
crossing — that is a real transport proof, which the candidate-supply flow never
had. The global flow's handshake stays user-verified-later, since headless
Chromium reaches no ICE address.

## Risks and what they mean

- **A real LAN needs the devices to reach each other.** A typed address that is
  the device's actual network address, and a network that lets the two sockets
  talk, are the local flow's real precondition; a router that blocks the
  connection leaves both pages waiting, which the waiting line must say.
- **The port is random and high.** It is not configurable, so nothing may assume
  a fixed port; a page reads it per open.
- **Only Chromium is measured.** Safari/iOS behaviour for a hand-crafted
  candidate is unmeasured; the change must not claim it.
- **`clipboard.writeText` needs a gesture and a secure context.** On a denied
  write or a missing API the affordance reports it and leaves the value
  selectable; it never claims a copy that did not happen.

## Non-Goals

- Same-browser two-tab play stays a non-goal (the user rejected it as pointless).
- A TURN relay on the network is not built here: the address route measured above
  needs no extra software, and a relay is the fallback only if the address route
  fails on real devices.
- The global flow's candidate-supply rules are not re-decided here; they live in
  the in-flight `network-multiplayer-webrtc` change and keep their meaning.
