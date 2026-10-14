# Design

## Context

See `proposal.md` (Why) for the motivation and the file:line evidence that the cached iroh clone cannot carry this feature. Design-level constraints only:

- The page keeps its delivery shape: one `<script type="module" src="js/app.js">`, no build step, no backend, GitHub Pages. A multi-megabyte wasm blob is out.
- The engine/game split rule is fixed: a symbol is engine-side iff it names no game noun. `engine/tests/boundary.test.js` asserts that every import under `engine/js/` resolves inside `engine/`, that the four mechanism leaves (`clock.js`, `grid.js`, `state.js`, `registry.js`) import nothing, and that no engine source names a consumer field. Any netcode added here must keep that gate green.
- The engine today owns no netcode. `engine/js/` is 11 modules: `canvas`, `clock`, `devices`, `grid`, `interface`, `layout`, `navigation`, `present`, `records`, `registry`, `state`.
- The simulation is non-deterministic: `js/pieces.js:73-74` draws the piece type and the spawn column from unseeded `Math.random()`. A seeded LCG already exists as a precedent in `tests/helpers/dom-stub.js` (seed 20240601).
- The user chose the pairing bootstrap: a link carrying a pre-prepared blob plus a QR code the second player scans, and a short readable code the second player can type on their own page.
- The user chose the preparation owner: the host page opens the duration sub-menu and the role sub-menu; the guest drives neither. The guest paints read-only mirrors of both sub-menus and sees each host selection as the host makes it, before the host confirms, next to its waiting line (`js/ui.js` `paintStageTitle` prints "P1 picks, P2 gets the other").
- The user chose the two-player entry to split into two ways, "Same computer" and "Network", and chose the starting menu to list the same items at every viewport width. On a narrow viewport the network way is selected automatically and no way sub-menu is shown; the way sub-menu appears only on a wide viewport.
- The user chose the lobby to persist: after a match the host changes the settings and starts the next match without re-pairing.
- The user chose the ICE configuration: a **public STUN list** the consumer supplies, not `iceServers: []`. Measured: no configuration pairs two separate headless browser instances in this environment, and DTLS-over-DTLS tunneling reaches only another connection inside the *same* browser instance. Two real devices therefore need ICE addresses from a public list.
- The user verifies the group-1 transport proof themselves ("i'l test it by myself lately"). That run is recorded as user-verified in a real browser, not machine-verified in this environment.

## Goals / Non-Goals

**Goals:**

- The netcode mechanism lives in `engine/js/` and is drivable headless, so a two-peer run needs no page object, no browser storage, and no channel object.
- The transport is a supply, never an import: the engine compiles and runs with no `RTCPeerConnection` present, and a consumer can swap the channel object without touching an engine file.
- One simulation produces one board state that both pages present, so a control action from one peer moves only that peer's own character on both pages.
- The pairing step works with no server of the project's own and no third-party signaling service.
- The seed is a match property in every mode, not only network play, so the unit suites stay deterministic without a stub-only RNG.

**Non-Goals:**

- No rollback netcode, no input prediction, no delay-based lag compensation. The resync policy is drop-and-count.
- No state traffic design that assumes bit-identical floating-point simulation on two devices.
- No leaderboard across devices, no reconnect mid-match, no more than two peers.
- No native mobile app, no Electron, no wasm build of any Rust code.
- No voice, video, or screen share; `RTCDataChannel` only.

## Decisions

### D1. The engine owns the netcode mechanism; the game supplies the transport

`engine/js/` gains four netcode modules. Each names mechanism only, per the split rule:

- a seeded deterministic source (`next(seed, callCount) -> value`) — the game draws piece type and column from it;
- a tick-aligned command stream — an intent plus the tick it applies on, applied only on that tick, dropped and counted when late;
- a peer link — the state a peer connection has, the close event, the resync policy;
- the seed slot in the match half of `engine/js/state.js`.

The engine never constructs a channel and never names a browser channel object. The consumer (`js/app.js`) passes a transport object into the peer link, exactly as it already passes the canvas, the layout, and the devices. This mirrors the existing supply pattern, so no new engine concept is invented.

**Alternative considered:** netcode in `js/`. Rejected — the user asked for the engine to be extended so the game builds multiplayer on top of it, and these symbols name no game noun, so the split rule puts them engine-side anyway.

### D2. One authoritative simulation on the host page; the guest paints received frames

The host page runs the simulation. The guest sends intents to the host and paints the state frames the host sends back. The engine's two-peer headless test feeds two intent streams into one simulation, which is the same shape.

**Alternative considered:** both peers simulate from the same seed and exchange only intents. Rejected — it needs bit-identical tick counts and arithmetic on two devices, and drift is invisible without a checksum round trip. Authoritative-host makes drift impossible by construction and makes resync a re-send.

**Trade-off:** the host's device is the bottleneck for frame traffic, and a laggy host lags both pages. Accepted for two players on one 10×20 grid.

### D3. Pairing = a pre-prepared offer blob in the link plus a QR code

The host page, on entering the pairing step:

1. constructs an `RTCPeerConnection` and calls `createDataChannel(label, { negotiated: true, negotiatedStreams: 2 })` **before** any offer/answer exchange;
2. calls `createOffer()` and waits for ICE gathering to finish;
3. trims the offer SDP (drops comment lines, keeps the `a/` lines the guest needs) and encodes it into the share link's URL fragment;
4. paints a QR code of that link.

The guest page reads the fragment, calls `setRemoteDescription(offer)`, `createAnswer()`, and sends its answer **over the negotiated data channel** to the host, which calls `setRemoteDescription(answer)`. The negotiated channel exists before negotiation, so it carries the guest→host hop that the link cannot.

**Why the negotiated channel is required:** the link carries one direction only. A `RTCDataChannel` normally becomes usable only after both peers have set a remote description, which is the chicken-and-egg this step runs into. `negotiated: true` creates the channel up-front and it is the standard SDP-over-the-channel pattern.

**Alternative considered:** a public third-party signaling service. Rejected — it is a server, and it breaks the serverless requirement the user set.

**Alternative considered:** a short pairing token in the fragment, with both SDPs over the negotiated channel. Kept as the painted fallback form: when the trimmed blob exceeds the fragment cap, the step paints a short readable code instead, and the second player types it on their own page. The step always paints that code next to the link and the QR, so a phone that cannot scan still joins.

**Alternative considered:** copy-paste of the blob by hand. Rejected — two hops of manual typing on a phone.

### D4. The seed is a match property in every mode

`js/state.js` carries the seed alongside the duration. Single-player picks a seed the page generates; network play takes the seed that travels in the pairing payload. `js/pieces.js:73-74` reads the engine source instead of `Math.random()`. The unit suites keep their existing seeded LCG helper for determinism, and the game suite gains a seed-driven check.

**Alternative considered:** seed only in network play. Rejected — the unseeded draw would stay in the single-player path, so the "no draw reads browser entropy" scenario in `specs/snaketris-game/spec.md` would fail.

### D5. The QR encoder is a game-side painter

The encoder is dependency-free vanilla JS (byte mode, Reed–Solomon error correction) and lives game-side, next to the painters. A QR encoder is a presentation of page content, and the engine already delegates all painting to the game.

**Alternative considered:** engine-side. Rejected — it would add a presentation export to the engine contract and push the engine toward owning page concerns.

### D6. The ICE configuration is a consumer supply

The `iceServers` list is part of the transport object the consumer constructs, not an engine constant. The engine stays ICE-agnostic, so a consumer can change the list without an engine edit.

**Chosen value (user decision):** a **public STUN list** — `iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]` — supplied by `js/app.js`, not `iceServers: []`. Reason from the measured run: DTLS-over-DTLS tunneling reaches only another connection in the same browser instance, so two real devices need ICE addresses from a public list. The ICE host is third-party and optional, so "no server of the project's own" still holds.

### D7. One "Two Players" entry splits into two ways; the wide gate moves onto one way

The menu keeps the single "Two Players" entry at every viewport width, and the starting menu lists the same items at every width. Confirming it opens a way sub-menu with "Same computer" and "Network" on a wide viewport. On a narrow viewport the way sub-menu is not shown at all: the entry selects the network way and opens the pairing step, because the only way a phone can run is the network way. The wide-viewport rule that today hides the whole entry (`js/screens.js` `menu-item-two-player` carries `requiresWide: true`; `js/ui.js` hides it through `twoPlayerOffered()`) moves from the entry onto the "Same computer" way only. The rule's reason stays the same — two players on one device need two control models on one keyboard — and a network peer needs only its own device, so the network way is never gated.

**Alternative considered:** a separate top-level "Network Play" item next to "Two Players". Rejected — the user asked for "Two Players" itself to appear on mobile, and two entries offering the same match type read as one entry with two ways.

**Trade-off:** the way sub-menu is one more screen in the preparation flow. Accepted, because the alternative hides the network path on every phone.

### D8. The lobby persists; the host re-prepares between matches

A network match that ends with both peers still paired returns the host page to its preparation stage — the duration sub-menu and the role sub-menu — while the peer link, the offer blob and the pairing secret stay exactly as they are. The guest keeps its waiting line and its read-only mirrors, and each mirror marker follows the host's selection, the same rule as at first pairing. Each match draws a fresh seed, so the piece sequence differs across matches.

**Alternative considered:** re-pairing before every match. Rejected — the user asked for the host to change settings without recreating the lobby, and re-pairing would force the second player to scan a new QR each round.

**Trade-off:** the host page owns the rematch decision, so the guest cannot start a match on its own. Accepted, and it matches the host-owned preparation the user chose.

### Tailscale subnet support

The user can choose a Tailscale subnet for the pairing instead of public STUN servers. The ICE servers are configured with Tailscale IP addresses, and the pairing works over the Tailscale subnet. This allows devices on different networks to connect directly via Tailscale without needing a public STUN server. The `ICE_SERVERS` in `js/app.js` is parameterized by the chosen subnet, and the `iceAttempt()` in `js/netplay.js` uses the configured candidates. The design doc's `ICE_SERVERS` list is replaced by the subnet's peer addresses, and the pairing step paints the Tailscale IP as the offer URL.

### D9. The host sends every preparation selection; the guest paints read-only mirrors

The host page sends each preparation change over the data channel: every marker move and every confirmation. The guest paints a read-only copy of the duration sub-menu and the role sub-menu on its own page, next to the waiting line that names its state. The guest offers no selectable item for those copies, so it cannot change the match settings. The host confirmation still starts the match; the mirror only shows progress.

**Why:** the user wants the second player to follow the host's decisions in real time, before the host confirms. The waiting line stays so the guest still names its own state.

**Alternative considered:** sending only confirmations. Rejected — the user asked for the guest to see each selection as the host makes it.

**Alternative considered:** the guest simulating the preparation itself. Rejected — two independent selections would drift, and the guest has no authority over the settings.

**Trade-off:** a handful of extra channel messages during preparation. Accepted — preparation is not on the match's hot path, and the frame traffic rule in D2 is unchanged.

## Risks / Trade-offs

- **[Risk] `RTCDataChannel` reachability with `iceServers: []` cannot pair two devices** — measured in this environment: no configuration pairs two separate headless browser instances. With `iceServers: []` the offer carries only the default `<uuid>.local` candidate; a supplied STUN list returns no candidate at all (`curl https://stun.l.google.com/127.0.0.1` times out, `curl https://example.com/` returns 200, so HTTP works and STUN does not); an injected `a=ice-candidate 127.0.0.1:<port>` with a Node UDP relay between the two ports is accepted into both local and remote descriptions yet leaves `signalingState: "stable"`, `connectionState: "new"`, `iceConnectionState: "new"`, and the relay receives zero datagrams. Two `RTCPeerConnection`s inside ONE page carry the same peer-id UUID in both candidate lines and still never open. → **Conclusion:** DTLS-over-DTLS tunneling is same-browser-instance only, so it cannot pair two real devices. **Mitigation applied:** the user chose a public STUN `iceServers` list as the consumer supply (D6), and the user verifies the transport proof in their own browser ("i'l test it by myself lately"). The group-1 run is recorded as user-verified, not machine-verified here. The spec's "no server of the project's own" wording still holds, because the ICE host is third-party and optional.
- **[Risk] The offer SDP is ~1–2 KB and a QR of that size is dense** — a phone camera may not resolve it on a small screen. → **Mitigation:** trim the SDP to the `a/` lines the guest needs; use byte mode with error-correction level L; cap the fragment and fall back to a short pairing token (D3's alternative) when the trimmed blob exceeds the cap. The fallback is a documented recipe, not a redesign.
- **[Risk] The guest→host answer hop depends on `negotiated: true` semantics** — channel behaviour before negotiation differs across engines. → **Mitigation:** the same first task asserts the negotiated channel carries bytes before `iceconnection` reports connected.
- **[Risk] Frame traffic scales with the grid** — 200 cells plus the snake and the piece per frame. → **Mitigation:** send one compact frame per simulation tick, packed as a short array, and keep each message under the ~1 KB DTLS-safe size; the guest renders received frames and never re-simulates.
- **[Risk] A late intent from a laggy peer is dropped** — a dropped steer is felt as a lost input. → **Mitigation:** the engine reports the drop count, the HUD can show it, and the drop window is one tick; the resync policy is stated in `specs/engine-architecture/spec.md` and is not silent.
- **[Trade-off] The host device gates both pages** — a slow host slows the guest. Accepted for two players.
- **[Trade-off] The QR encoder is ~200 lines of vanilla JS** — it is the largest new block in `js/`. Accepted because the user asked for a scannable code and no dependency may be added.

## Migration Plan

1. Prove the transport primitive in the existing Playwright harness (two pages, one served repo, `page.route`) before writing engine code.
2. Land the engine netcode modules and their suites; `engine/tests/boundary.test.js` must stay green, and the engine suite must run with `document`, `window`, `localStorage` and `RTCDataChannel` absent.
3. Land the seeded source in the game path (`js/pieces.js`, `js/state.js`) and re-run `npm test` and `npm run verify`; the single-player and local two-player modes must be unchanged in behavior.
4. Land the pairing screens, the QR painter, and the `network-play` capability on top of the engine link.
5. Grow `scripts/verify-all.mjs` with the two-page network check as a thirteenth harness.
6. Rollback: the seed stays (the suites need it); dropping network play means dropping the transport supply and the pairing screens only, and no engine file is reverted.

## Open Questions

- The exact frame encoding (packed array vs. JSON) and whether the guest needs a frame on every tick or only on the host's render tick. Neither changes the specs, the approach, or the task breakdown.
- The QR error-correction level and the fragment size cap. Tuning only.
- Whether a network rematch reuses the pairing or re-pairs. Decided in D8: the lobby persists and the host re-prepares. What stays open is where the way sub-menu's Back control leads when the host re-prepares between matches — the starting menu or the way sub-menu. Copy decision only.
