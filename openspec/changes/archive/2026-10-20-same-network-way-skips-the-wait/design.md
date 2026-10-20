## Design

### What the wait was bought for, and what it costs this way

The candidate wait is bought for the way that asks a server for candidates: the address a peer connects to comes from the servers, so an offer published while the attempt is still waiting carries no address. The same-network way names no server at all — the address comes from a player's own typing and a link — and the page that opened a link has no offer to publish while it waits, so its attempt never resolves: measured, `ice gathering` with the seconds left stuck at three for the whole run, while its own description grew a candidate line naming a real port. Behind that wait sits the way's own work: reading its port, rebuilding the line it hands over, announcing, aiming at the peer its link named. A page that waits forever therefore never reads, never publishes, never aims, and never paints the line its player is meant to carry — the dead phone.

### The decision

**Run the same-network way's block before the wait, and leave the wait exactly where it is for the other way.** The block is already one `if (lobby.flow === 'local')` clause; it moves above the `if (lobby.ice === 'gathering' && !duelOpen()) return;` gate instead of sitting under it. For the way that asks a server nothing changes; for the same-network way, nothing about its own work depends on the attempt — the port it reads is its own, the peer values came from a link, and the aim is a candidate it hands itself.

Three things had to stay true:

1. **The publish and the channel keep their wait.** The offer a page hands over must already carry the supply this open chose, so `publishOffer`, `acceptAnswer` and the frame traffic stay below the gate as they do now. Only the same-network block moves.
2. **The aim is per-tick and per-connection, not per-wait.** `pointAtPeer` already skips a connection it has aimed (`aimedPc`), so running it while the wait still runs costs the pair one aim, not a rebuild each tick.
3. **The countdown line stays the other way's.** The step already hides the candidate count and the candidate warning on this way (`paintPairing` gates both on `!localFlow`), so moving the block above the wait paints nothing new about a wait the player cannot see.

### Risks and what they mean

- **The wait still belongs to the local flow's ICE attempt.** The attempt is started once per open and still records the flow it ran under, so a page that changes the way it runs under still re-runs its open; the move does not touch `startIceAttempt`.
- **A page that aims before its publish.** The aim hands a candidate to this page's own connection; it does not hand the peer anything, so a page that has not published yet can still aim at the values its link named — measured as connecting in the address matrix (one address, each page's own port).
- **A page opened at a link that names no port.** It holds an address and no port for its peer; `pointAtPeer` refuses without a port, so such a page stays waiting for its player to carry the line — the same-network way's stated shape, not a stall this change hides.
