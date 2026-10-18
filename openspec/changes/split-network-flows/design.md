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

**The link names the way it waits under, for either flow (measured at 06:19).**
`publish` appends the flow this page runs under — `flow=global` or `flow=local`
— to the url it hands over, and `noteFlowOfLink` reads either name back, so a
page opened at a global-flow link runs under the global way and paints the step
that way asks. A page opened at such a link arrived with no flow at all before
this, and the line it showed asked about an address while its own way never wants
one. The local flow's marker and address values stay as they were: the address-
bearing link is byte-identical besides the name, since the name is a query
parameter and the fragment stays the secret.

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

### D8 — the field keeps what the player typed, and the key stays a key

The address the player types is the only field the browser itself feeds, and two
places spent it against the player. The page read the field every frame and posted
what it read back into the field, so an unfinished address — the player's own
half-typed line, which no address rule accepts — was replaced with what the page
last accepted, and the player's own digits went missing mid-typing. So the page
reads the field only while its flow shows the field, and posts nothing there: the
field is the player's, the painted line is the page's. A completion test cannot see
this, because a test names the whole address at once; a browser that types it one
key at a time is what shows it, and the check types and reads the field rather than
naming it.

The other half is the key. A digit is in the alphabet the short readable code is
spelled from, so a digit typed over the address was spent on the code and stopped
from the field: only the digits outside that alphabet reached the field at all. On
a page that shows the field, a digit and a dot belong to the field and are not spent
on the code; on a page that shows no address a digit still spells the code. The rule
traded away is that a same-network page cannot spell a code digit — its join route is
the address in its link, which does not carry the secret.

### D9 — the field is typed at, and an address is four numbers of one byte

A field the player must click before typing is a field a player loses: opening the
page and typing straight away wrote nothing, because the typing sat on the rest of
the document. A harness that focuses the field before typing cannot see this, so the
check types into a page its player only opened. So the page that shows the address
puts the typing at it, and the field stays a real input — a phone has no other way
in.

What counts as an address is four numbers with dots between, each small enough to be
one byte, since that is the address of a device on a network. The shape rule alone
would let a page accept 999.999.999.999 and pair nothing, so the rule bounds each
number at one byte, and the line the page shows names the bound it wants.

### D10 — the address keeps its own letters, and the way re-opens until it pairs

Two more things a player found on a real page. The page spells a short readable code
by reading keys itself, and the alphabet it accepts carries digits — the same digits
the address field is made of. So a page that asks for both spends a digit on the code
and takes it away from the address: typing an address one character at a time lands
only its first digit, and the field the player typed into keeps showing the address
the page accepted last. The one page that asks for an address is the one that runs
under the same-network way, so on that page a digit or a dot belongs to the field and
not to the code; a page that shows no field still spells a code with a digit, which is
what a keyboard-only player does today. The address line is drawn from what is typed
even half-typed, so the field and the line agree while the player is still typing.

The other thing: the way was meant to hold for a page's whole life, and a player who
changed their mind on the same page found the page kept the way it had. That decision
is kept only while pairing has not started — until a page has paired with anyone it
can change its mind, and the switch takes back whatever the first way had published
and runs its open again. A page that has paired, or was opened at a link, keeps its
way: two pages half paired under one way and re-picked to another have no meaning.
Re-running the open also re-runs the candidate search, because the offer one way
warmed came from that way's channel; a page navigating from the menu pays the search
twice, which costs nothing for a local way that searches nothing.

### D11 — a page opened at a link paints only what it holds itself

A page opened at a link inherits the host's secret, so the short readable code it
shows repeats the one the host showed; that is the link's own proof. It holds no
link of its own until it publishes, and painting the empty string as a share line
and as a QR made the page look like it was sharing a link while the QR decoded to
nothing a scanner could use. The share line and the QR are painted only while the
link field carries a link, not merely because the step is in link form. The same
reasoning covers the warning line: the sentence naming a candidate server belongs
to the global flow, and the same-network flow names the address it waits on instead,
because a player who reads the other sentence types a server this flow never asks
for.

### D12 — the address in a link is used, not only read

A page opened at a local-flow link already holds what its host published:
`lobby.peerAddress` and `lobby.peerPort`, read out of `?a=` and `?p=`. Nothing
acted on them. The only function that points a channel at such an address,
`craftPeerCandidate`, had one caller, `learnPeerAnnouncement`, and that call
needs `inbound.addr` — the browser's own message bus, which joins pages inside
one browser and reaches no other device. So across two devices the address was
carried into the page and never used, which is why a pair opened from a phone
stayed unpaired no matter what the host published.

The step is moved out of the bus: the local-flow branch of `networkDuties` runs
`pointAtPeer` every tick beside `announceOwn`, and that function points the
channel at the peer address the page holds whenever it holds one, whether or not
anything travelled. `craftPeerCandidate` no longer demands a remote description
— it reads the media line off whichever description the channel has, preferring
the one it made itself — because a page that never received an answer still
names its own media line. One page may point one connection once, so the step
records the connection it pointed and re-points only when the channel rebuilds.

The candidate line is dropped from this way rather than reworded again: a local
page asks an address, never a server, so a line about candidates names something
the way cannot act on and reads like a failure the player cannot fix.

### D13 — what a page shows, what it holds, and what a key belongs to

Three things a player found on a real page, all about the same pairing step.

**A digit typed into the address field went missing.** The page reads keys
itself, and the alphabet it accepts for the short readable code carries digits —
so a digit on the pairing page was spent on the code and never reached the field
the browser was typing into. The field is the one native input on this step; the
code is painted text. Only the same-network page asks for an address, so on that
page a digit and a dot belong to the field and are not spent on the code; the
code keeps its letters, which no address uses. A measured probe typed the whole
address one character at a time and read the field back: before the fix it held
one digit and the page never opened its pairing step, because the code the page
chose for itself had not been typed either.

**The field held what the page had already accepted.** The page reads the field
back every frame and answers as though its own player typed the address, so on a
page that does not ask for one the digits a previous player left there came back
as an address — the anywhere-network page showed a share line naming an address
it had never asked for. The reading is gated to the page that asks. The line
beside the field is painted from what is typed, even half-typed, so a player who
stops at `100.` sees that text and the shape the page wants.

**The way stuck on a page that changed its mind.** The way was meant to hold for
a page's whole life, and that decision is kept only while pairing has not
started: until a page has paired with anyone it may pick the other way on the
same page, and the switch takes back what the first way published. Because a
page's candidate attempt ran under the way it had picked, the switch also lets
go of that way's channel and runs its open again under the new one — a measured
probe saw a fresh connection and a fresh attempt, and saw the new way publish.

### D14 — the link is rebuilt when a value it names arrives late

Measured: a local-flow page published `?flow=local&a=<address>` with no port, while its own
port field read a number two rows later. The link is built inside the publish, and the publish
runs only while the page holds no offer — so the moment that learns the port (the description
grows the candidate line only once ICE gathers) has no way to put it into the line a peer opens.

The decision: the link line is one function of what the page knows now — its own address, the
port it read, the flow it runs under, and the secret it published. Extract that building into
one step both the publish and a later refresh call, and let the pairing tick refresh the link
whenever a value arrives after the publish. A link rebuilt this way carries the same secret, so
a page that already opened at the older line is unaffected; the refreshed line is for whoever
opens next.

## D10: the line a peer opens is rebuilt once the port lands

Why: the page published its pairing line before it had read its own port — the
port is the ICE gather step's to read, it appears in the page's own local
channel only as the channels open, and `networkDuties` runs its local-flow port
step every tick for that reason ([5b32ac92ade5] confirms publish runs while
`port` is 0). The publish happens once, gated on the page having no offer yet,
so after the port lands nothing writes the line again and the address-bearing
link names an address with no port to join on. The port was read and kept
([e6252c30eb6a] measured the host's own port land), only never republished.

How: one link-building step shared by the publish and the refresh. `pageLink(secret, pageUrl)`
returns the marked line, naming the way and the address, port and code it holds
when they are known, and `publish` returns that line unchanged for the global
flow. `refreshLink()` compares the line the page would build now against the one
it published and replaces it when the two differ; `networkDuties` runs that step
beside the announcement, every tick on the same-network flow, because the port
lands on a later tick than the publish. `refreshLink` is a no-op until the page
holds both an offer and a link, so a page that published nothing builds no line
and a guest that opened at a marked URL rebuilds only its own.

This replaces the whole line-building step in `publish`, and so its shape carries
across the earlier decision about shortening the line (D2, whose cap was measured
at 313 characters of the 255-byte cap) — the refreshed line carries the same two
values plus the port. A local-flow page that publishes before it has read its port
must not publish at all (measured), so the publish stays gated on the address and
the refresh carries the port to the line afterwards.

### D15 — the same-network way paints only lines its player can act on

Why: the user opened the same-network way and asked, of the short code shown on
it, where and why to enter it — there is no answer, because that way pairs over
the line a player opens, not over a typed secret, and the page spends a typed
digit on the address field instead. The two candidate lines are the same shape
of dead end: that way asks no server, so a warning or a wait about candidates
names something the way cannot act on, and a player reads it as an error to fix.

How: `paintPairing` derives one `localFlow` and gates all three on it — the
short code (and its copy affordance) is painted only off that flow, and both the
candidate warning and the candidate wait are suppressed on it. Nothing else
changes: the global way keeps all three lines, and the same-network way keeps its
link, its QR, its address lines and the waiting line, which name what that way's
player can still do. Retiring `LOCAL_WARN` leaves the copy file without an unused
line, and `js/constants.js` stops re-exporting it.

### D10: The way choice is offered wherever its player is, not only on a wide screen

A stacked viewport had a shortcut that answered the flow question for the player:
it opened the pairing step under the shared-page way, hiding the choice. A phone
player therefore never saw an address field at all, and no match across two real
devices could be finished from one. The choice is now opened at every width — the
player decides, even when the device is small — and only the shared-page way, the
one that needs two controllers on one device, is hidden where the layout is stacked.
An item that needs a second pad on the same screen cannot be played on a viewport
that stacks its panels, so hiding that one item is the honest narrow rule; hiding
the choice is not.

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
