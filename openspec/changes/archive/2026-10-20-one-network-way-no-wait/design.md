## Design

### Why the wait and the other way were carrying weight

The wait is bought for a public candidate supply: the address a peer connects to comes from servers, so an offer published while the attempt runs carries no address. This project builds no relay — a design note in the archived change says a relay is only the fallback if the address route fails — and measured attempts with no ICE servers pair nobody outside one browser instance. So the way that would need that supply ships without a way to satisfy it, and its wait shows a countdown, a warning and an unfillable expectation on every page.

The same-network way needs neither: it names an address a player types and a port the page reads out of its own description, and the pair connects on candidates each page hands itself (measured: two separate Chromium instances joined on one address plus each page's own port, with no servers at all). Keeping the two ways and the wait means keeping a step whose first half names things the joinable way never does.

### The decision

**One network way, and no candidate attempt anywhere.** The way menu offers the same-network pair and Back; `pickFlow` and its flow name retire with it (the flow name is what the link carried to tell the ways apart, and with one way there is nothing to tell); `startIceAttempt`, `openIceAttempt` and `iceAttempt` retire with the wait; the step's countdown line and warning lines retire with the attempt; `lobby.ice`, `lobby.iceLeft` and the timeout constant retire with those.

The pairing dance keeps the same carriers as the archived change: the opened URL names the host's address and port, one line is carried by hand from the other page, and each page reads its own port. What changes is where that work runs: **the page's own work happens before the guest and host branches**, so a page that opened a link — which is a guest page — reads its own port and aims, instead of returning at the guest gate before any of it ran. Measured, that ordering was the dead phone: the opened page's own description named a real port while `lobby.port` stayed 0, it aimed nothing and painted nothing to carry.

Three constraints had to survive:

1. **The offer still publishes before the answer is accepted, and the channel still carries the frames.** Only the page's own port-read, line-rebuild, announce and aim move above the guest branch; the publish, the answer accept and the frame traffic stay where the seat rules put them.
2. **No ICE server is configured, so a candidate only ever comes from a line a page holds.** `iceSupplyForOpen` returns nothing at all; a page with no peer values holds no candidate and stays waiting, which is the same-network way's stated shape.
3. **The link keeps naming what a peer needs.** The flow name leaves the link; the address and port params stay, so a page opened at a link still learns its peer without typing.

### What the implementation settled

- **The short readable code is not a way's, it is the publish's.** The first pass retired the
  code line with the way vocabulary; that was wrong. `publish` sets `form = 'code'` and an empty
  `lobby.link` when the offer blob is longer than `PAIRING_FRAGMENT_CAP`, so a device that can
  neither scan the QR nor open the link has no way in without the code. The shipped `paintPairing`
  paints the code line and its copy affordance keyed to `published && lobby.form === 'code'`, which
  is the publish's own call, and hides them whenever the offer rode a link — which is what the
  same-network page does today.
- **`pageLink` writes what this page knows, not what it opened with.** The archived guard left a
  page that opened an already-marked link free of its own values, so a refreshed line kept
  repeating the peer's address instead of naming the page that refreshed it — which is what made
  the carried line unusable on the guest leg. The shipped function strips the opened URL's query
  and writes this page's own `a=` and `p=`, each once.
- **The tail of `networkDuties` is the shipped tail unchanged.** `sendFrame` guarded by
  `duelOpen() && (game.screen.state === PLAYING || game.play.gameOverReason)`, then
  `sendPreparationMirror()`, stay byte-for-byte: the change moves the page's own work above the
  seat branches, it does not re-invent what travels once the duel holds a peer.
- **The checks split in two kinds.** Three harnesses drove shapes that no longer exist at all and
  were retired with them — `verify-ice-preload.mjs` (the countdown and its publish gate),
  `verify-way-switch.mjs` (picking the OTHER way re-decides) and `verify-network-duel.mjs` (the
  stand-in transport over the anywhere way). Four were re-keyed to the one way and keep their
  subjects: `verify-two-player-gating.mjs`, `verify-network-local.mjs`, `verify-opened-link.mjs`,
  `verify-pairing-step.mjs`. Two unit tests for the shipped ICE supply were retired with the supply,
  and the `tests/netplay.test.js` flow tests became assertions about the link's own `a=`/`p=` and
  the absence of a `flow=` marker.

### Risks and what they mean

- **The way menu grows no second network item, and an old link that names a flow is a link that names nothing new.** A link still carrying `flow=` is read by no one; a bookmark opened from the other way lands on the same-network way. Nothing rejects it, and nothing about it is claimed.
- **The step stops saying anything about candidates.** A player who used the other way's lines — the countdown, the warning, the "ask a peer for its address" line — finds them gone. That is the point of the change, and the step must still say what the one way asks, which its address and carried lines already do.
- **The tests and harnesses that drove the other way and the wait go with them** — see the split recorded above: three harnesses retired, four re-keyed, and the unit tree green at the one way rather than the two.
- **Two devices over a router stay unmeasured.** This change retires code; it does not prove the join. The carried-line proof stays the user's on real devices, and the harness keeps asserting only what headless Chromium reaches.
