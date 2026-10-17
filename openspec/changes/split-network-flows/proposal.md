# Proposal: split network play into a global flow and a local flow

### Why

Network play today has one pairing flow whose channel depends on an ICE candidate
supply: the page ships a floor of TURN servers and adds a sample of a public list
per open. That flow needs something that knows a reachable address, and the
public list is unreliable — measured inside the harness, its first entries yield
no candidates at all, so a page that depends on it pairs nothing.

The user asked for two separate flows, and named the mechanism for the local one:
the host states its own LAN address and the two pages exchange the offer plus
ICE candidates as codes. A measurement settles which half of that mechanism is
real, and it changes what gets built:

- Two separate Chromium instances (= two devices) with `iceServers: []`,
  exchanging offer/answer out of band, each produced only its own
  `<uuid>.local` self-candidate; `addIceCandidate` rejected the other side's
  list, `connectionState` stayed `new`, and `dc.send` threw
  `InvalidStateError: RTCDataChannel.readyState is not 'open'`.
- A page-minted offer SDP carries no LAN address: its `o=` line reads
  `o=- 7084349244441824069 2 IN IP4 127.0.0.1`.
- But a page **does** know its own allocated DTLS port: its local SDP carries
  `a=candidate:1414608955 1 udp 2113937151 24f0be48-….local 33500 typ host …`
  — the address is a self-reference, the port is real.
- Hand-crafting the peer's candidate from a typed IP plus the peer's own
  allocated port connects: two separate instances, each given
  `candidate:9 1 udp 2113937151 127.0.0.1 <peer port> typ host` with
  `sdpMid: "0"` and `sdpMLineIndex` set to the index of the `m=` line of its
  remote description, both reported `connectionState: connected`,
  `iceConnectionState: connected`, and the datachannel message crossed
  (`B got ["ping-from-A"]`).

So the local flow needs no relay, no public list and no cloud service: it needs
one typed IP per peer plus a port the page reads itself. That is the user's
proposal, and the codes carry an **address**, which is far shorter than the
offer blob the current flow carries.

### What Changes

- **Two network ways, one section.** The way sub-menu gains a global flow
  (today's flow: the shipped floor of named ICE servers) and a local flow
  (one network, no candidate supply). A page belongs to exactly one flow; the
  flows never mix.
- **The local flow states its own address.** Each page reads its own allocated
  port from its own local SDP and asks the player for their device's network
  address (a dotted-quad). The pairing link carries that address beside the
  flow marker, so the peer receives it without typing.
- **Each page hand-crafts the peer's candidate.** Given the peer's address, a
  page offers the peer a candidate naming that address and the peer's own port,
  with `sdpMid` and `sdpMLineIndex` bound to the remote description's `m=` line
  — measured as required: an `RTCIceCandidate` without them throws
  `TypeError: sdpMid and sdpMLineIndex are both null`.
- **The peer's address travels with the answer.** The pairing machinery already
  posts the second page's answer over the channel before that channel is
  negotiated, so the second page's own address travels in the same message and
  the first page asks its player to carry nothing back.
- **A copy affordance on every copyable element.** The pairing link, the pairing
  code and the address line each carry a 📑 mark directly under the value they
  copy; clicking it copies the value into the clipboard. A browser that denies
  clipboard access says so and leaves the value selectable.
- **Docs and help copy** name the two flows and the one address each peer types.
- **The flow choice survives a narrow viewport.** The two-player entry opens the
  way sub-menu at every viewport width, so a player on a phone picks which
  network flow runs; the narrow shortcut that jumped straight to the pairing step
  silently chose one flow and left the other unreachable. Only the shared-page
  way, which needs a second pad on this device, stays wide-only.
- **The global flow names its supply outright.** The shipped floor becomes the
  five ICE servers the user named — `stun1`–`stun4.l.google.com:19302` and
  `stun.stunprotocol.org:3478` — and the per-open read of a public list is
  dropped: it measured as yielding no candidates, and a page can still name its
  own supply with `?ice=`.

### User Stories

- As two players on one network, I open one link, type my device's address once,
  and the match starts with no server, no public list and no relay.
- As a player, I tap the 📑 mark under the link, the code and the address
  instead of selecting text.
- As a player on the internet, I use the global flow and its candidate supply,
  unchanged.
- As a player on a phone, I still get the choice between the two network flows,
  and the shared-page way is the only item that stays hidden from me.

### Ownership

- `js/netplay.js` owns the pairing secret, the offer/answer hop, the address
  fields and the hand-crafted candidate.
- `js/app.js` owns the transport and reads the page's own allocated port.
- `js/screens.js`, `js/ui.js`, `js/devices.js`, `js/input.js`, `js/copy.js`
  own the two ways, the painted address lines, the copy affordance and its
  keyboard/pointer intents.
- `js/copy.js` owns the wording.

### Cross-cutting requirements

- The engine contract stays: the engine never names a candidate supply, an
  address or a clipboard.
- The existing global-flow requirements in the in-flight `network-multiplayer-webrtc`
  delta keep their meaning except for the candidate-supply read: group 13
  replaces the fetched public list with the named servers the user chose, and
  retires the read with its bounds.
- The board invariants keep holding: layout constants stay in `js/config.js`
  and `js/constants.js`; `js/input.js` `setDirection` keeps its in-game branch
  byte-for-byte stable.

### Implementation notes

- The measured `sdpMLineIndex` is the index of the `m=` line in the **remote**
  description (measured 7 for both the offer and the answer at
  `iceServers: []`); a page must compute it, not hard-code it.
- The typed address is a dotted-quad with an optional port; a value naming a
  scheme (`stun:`, `turn:`) is not an address and is rejected.
- `navigator.clipboard.writeText` needs a user gesture and a secure context;
  the affordance must handle a rejected write and a missing API without leaving
  the player without the value.
