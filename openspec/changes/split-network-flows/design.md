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

**Measured limit on the port.** The port a page's own socket listens on is
readable only for a page that keeps an OFFER locally, and only once a remote
ANSWER is set: that page's description grows from 458 to 587 bytes and carries
its own `a=candidate:` line (`52055`, `41680`, `57184` measured across runs). A
page whose local description is an ANSWER exposes no port at all — its
description stays 457 bytes, `iceGatheringState` stays `new`, and offering a
candidate starts gathering but yields no candidate line. Setting a remote
OFFER while an offer is held locally nulls the local description, and
`createAnswer` is refused outside `have-remote-offer` or
`have-local-pranswer`, so no arrangement leaves both pages holding an offer
locally. The host page therefore announces its own port and the guest page
announces nothing: the copy that would point the host's candidate at the
guest's socket has no source. The same-network flow's handshake is unproven,
and on libwebrtc with no ICE supply it is not reachable by this mechanism; the
harness asserts the measured shape, never a connect.

**The address the checks test with.** The player tests this flow with the
address their own device answers with, so the harnesses type that address on
both pages and assert against it: the address is `100.107.90.10` and the port
they name beside it is `3478`. Neither page reaches it headlessly, so the value
only has to be a well-formed address — the checks assert the address travels
unchanged and that an address neither device answers with stays waiting.

**Open for the next chunk:** the port the guest needs is not only unreadable —
it is also *unchosen*. The guest's answer is generated by libwebrtc, so the
port it names is libwebrtc's. If the guest rewrote the ICE section of the
answer it posted, naming its own typed address and a port it picked, then the
host's `setRemoteDescription` of that answer would make libwebrtc create the
guest's DTLS server at that port, and the host would have no port to read
either. Neither page has tried naming a port of its own choice in the
answer it sends; that is the one arrangement left unmeasured, and it is where
the next chunk should start before changing any more code.

**Alternative considered:** a return hop the host player types — the first page
painting the second page's address for them to carry. Rejected twice over: the
measured shape where both pages negotiate from one offer blob never connected
(ice went `checking` then `disconnected`, `connectionState` `failed`), and a
page's DTLS answer is only acceptable to a peer that negotiated from the same
offer, so the blob has to travel anyway. The channel carries messages before
negotiation, so the chicken-and-egg the earlier draft reasoned from does not
exist here.

### D4 — the copy affordance is one element per copyable value

Each copyable value (link, code, address) gets a sibling element whose click
writes that value to the clipboard. The affordance is a separate element, not a
text mutation, so the painted value stays the single source of truth and the
existing pointer/keyboard intent paths keep their ids. The code gets one too,
which is what makes the copy affordance worth having on the global flow's short
form as well as on the link.

The mark is the 📑 glyph, and it sits in the markup directly after the value it
copies, so the pairing view stacks it under that value rather than grouping the
marks in a block of their own further down the page. The glyph carries padding
around itself, which keeps the tap target wider than the glyph and leaves room
for a finger on a phone.

**Alternative considered:** making the value element itself clickable. Rejected:
the value element is also the readable text the player checks; clicking it for
another reason makes "what am I copying" ambiguous.

### D5 — the flows are proven differently, and honestly

What the harness can prove about the local flow, and what it cannot. A probe
page that creates a channel, accepts the other page's offer and adds a crafted
candidate can be driven headlessly, and the harness asserts the address reaches
the candidate and that each page announces its own port — the address half of
requirement 6. The connect itself is not asserted: every probe attempt in this
session left the pair at `checking`/`failed` rather than `connected`, so the
handshake is in the user-verified-later group exactly like the global flow's.
Say so in the report; do not let the green harness imply a connect was seen.

### D6 — the flow choice opens at every viewport width

The narrow viewport once jumped the two-player entry straight to the pairing
step, because the wide rule that hid the whole entry was written when the only
other way needed a second pad on the same device. With the network section split
in two, that shortcut silently picks one flow for a phone player and leaves the
other unreachable — which is what the user reported as "no separation". The
entry now opens the way sub-menu at every width; the wide rule stays on the
shared-page item alone, the only way that genuinely needs two pads here.

### D7 — the global flow ships the named supply instead of reading a list

The shipped floor becomes the five ICE servers the user named: `stun1`–`stun4
.l.google.com:19302` and `stun.stunprotocol.org:3478`. The per-open read of a
public list is dropped rather than kept beside them: the measurement in this
session showed its first entries yielding no candidates at all, so a page that
depends on it pairs nothing, and a supply that answers nothing is indistinguishable
from a page with no channel. Dropping the read also drops its bounds — the fetch
timeout and the entry cap — which existed only to keep a fetched blob inside the
pairing fragment cap; a shipped list of five is bounded by construction.

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
