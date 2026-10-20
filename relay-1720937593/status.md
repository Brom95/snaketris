# The baton — snaketris LAN test

- Goal: a LAN test over a page served from the user's host — the address line and its QR name the page's address **and** port, the player carries it by copy, and the two pages pair.
- Done: pushed `1b59bda`; the Pages URL serves the pushed tree. Unit tree **248 pass / 0 fail**; `verify-network-local` (the LAN pairing link, typed with real keys), `verify-ice-preload`, `verify-opened-link` and `verify-two-player-gating` pass standalone. The refresh landed and `verify-network-local` measures it: the copied line names the port it read, and the opened page calls that port its peer. The refresh landed: one link-building step feeds the publish, the line shown and the QR, and the pairing tick re-runs it when the page reads its port.
- In flight: the whole sweep on the pushed tree, and `verify-pairing-step` standalone after the copy changes (one earlier batch died at compile, so it gave no verdict for that harness).
- Next: that verdict → fix or close. Nothing to hand back unless a finding worsens.
- Decisions: the same-network way paints no short code, no candidate warning, no candidate wait; 📑 sits under the value it copies; only the anywhere-network way keeps the code and the wait.
- Unknowns: two-page connect in one browser — the guest's answer description exposes no port (measured), and the renegotiation dance throws `InvalidStateError`; a real LAN has what it takes and nothing else.
