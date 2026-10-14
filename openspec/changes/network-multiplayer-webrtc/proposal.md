# Proposal

## Why

Two humans on two devices — a desktop browser and a phone browser — want to play one duel over a network, while the page stays serverless (GitHub Pages, one `<script type="module">`, no backend, no build step).

The cached iroh clone (`reference/n0-computer-iroh`, branch `main`) was examined as the candidate network layer and cannot be used:

- It is Rust only (`iroh/Cargo.toml:1-5`: `name = "iroh"`, `version = "1.3.0"`, `edition = "2024"`, `rust-version = "1.91"`). Grepping the clone for `javascript` returns exactly one hit, a content-type string in `iroh-dns-server/src/http/doh/extract.rs:122`. There is no npm package and no wasm-bindgen API surface; the only wasm-bindgen use in the tree is `iroh/src/runtime.rs:100` `wasm_bindgen_futures::spawn_local`.
- The QUIC/`Ip` transport is compiled out in browsers: `iroh/src/socket/transports.rs` carries `#[cfg(not(wasm_browser))]` on the `Ip` variant of `TransportConfig`, and 51 `wasm_browser` matches in that directory exclude IP transports.
- The one browser transport is a WebSocket dial to a **relay server**: `iroh-relay/src/client.rs:387` (`#[cfg(wasm_browser)] … connect`) calls `ws_stream_wasm::WsMeta::connect(dial_url …)`, and `.github/ansible/redeploy-relay.yml` deploys `iroh-relay-linux-amd64` as a systemd service. That is a server, so it breaks "serverless".
- Greps for `webrtc`, `webtransport` and `rendezvous` across the clone return zero hits.

So the transport must be browser-native: `RTCDataChannel`. It exists in desktop and mobile browsers, needs no host of our own, and keeps the page serverless. iroh stays a reference for the *architecture* only — link-pairing by a shared secret, and hole-punch-then-fallback escalation.

The transport is not the real blocker. The simulation is: `js/pieces.js:73-74` draws the piece type and column from unseeded `Math.random()`, so two peers drift apart on the first tick and no input-replay sync is possible. Grepping `js/` for `webrtc|websocket|network|multiplayer|peer` returns no matches, so there is no transport code either.

The user's requirement fixes where the fix belongs: the engine must be extended so the game can build multiplayer **on top of it**. Under the split rule (`engine-architecture`: "a symbol is engine-side iff it names no game noun"), a transport, a seed, a command stream and a resync policy name no game noun — they are mechanism, so they belong in `engine/js/`, not in `js/`. Today `engine/js/` holds 11 modules (`canvas`, `clock`, `devices`, `grid`, `interface`, `layout`, `navigation`, `present`, `records`, `registry`, `state`) and owns none of that.

## What Changes

- **New engine netcode layer** in `engine/js/`. It owns mechanism only: a seeded deterministic source the game draws from, the tick-aligned command stream (an intent plus the tick it applies on), the peer link (the transport object is supplied by the consumer, never imported), and the gap/resync policy. The engine stays self-contained and page-free: its suite runs with no `RTCDataChannel` present, driven by a channel the test supplies.
- **BREAKING (internal)** `js/pieces.js:73-74` stops calling `Math.random()`. The piece type and column come from the engine's seeded source, and the seed is part of the match so both peers build the same board. A seeded LCG already exists in `tests/helpers/dom-stub.js` (seed 20240601) as the precedent.
- **New** `network-play` game capability: a menu entry, pairing by a shared secret, a control model confirmed per peer, one shared grid simulated once and mirrored to both peers, and no bot because both sides are human.
- **New** The pairing bootstrap is a **link plus a QR code plus a typed code**: the host page builds its `RTCPeerConnection` offer SDP up-front, encodes it into the share link's URL fragment, and paints a QR code of that link, the link itself as page text, and a short readable code the second player can type on their own page. The second player scans, opens, or types; no copy-paste of the blob and no third-party signaling service.
- **New** The "Two Players" entry splits into two ways — "Same computer" (both players on this page, this device) and "Network" (each player on their own device). The starting menu lists the same items at every viewport width, so mobile shows the entry too; the wide-viewport rule that protects two keyboard models on one keyboard moves onto the "Same computer" way only, because a network peer needs only its own device. The way sub-menu is shown only on a wide viewport; on a narrow viewport the entry selects the network way and opens the pairing step directly.
- **New** The guest page mirrors the host's preparation live: the host sends each selection change over the data channel and the guest paints read-only copies of the duration and role sub-menus, marker included, before the host confirms. The guest offers no selectable item for those copies.
- **New** A finished network match keeps the lobby: the host page returns to its preparation stage and can change the duration and the role, the guest receives the mirror role and the same countdown, and the next match starts without re-pairing and with a fresh seed.
- **Non-goals:** no server of our own, no native mobile app, no rollback netcode, no cross-device leaderboard, no voice/video (data channels only).

## Capabilities

### New Capabilities

- `network-play`: networked two-player play over a browser data channel — pairing by a shared secret stated as a link, a QR code and a typed code, one seed shared at pairing, per-peer control model, one grid simulated once and mirrored, no bot, a guest that mirrors the host's preparation live, a lobby that stays open across matches while the host re-prepares, and a peer that drops out ending the match cleanly.

### Modified Capabilities

- `engine-architecture`: the engine gains the netcode mechanism (a seeded source, a peer link, a tick-aligned command stream, a resync policy) and must keep the boundary gate green — it imports nothing outside `engine/`, names no game noun, and receives the transport as a supply.
- `engine-api`: the documented surface grows with the netcode exports and a new extension recipe ("add a transport", "add a peer link"); the engine suite must import every documented export, so an undocumented or renamed export fails a test.
- `snaketris-game`: the piece sequence becomes reproducible from a seed, replacing the unseeded draw at `js/pieces.js:73-74`; the seed is chosen with the duration before play.
- `start-menu`: the "Two Players" entry is offered at every viewport width and the menu lists the same items at every width; the way sub-menu is wide-only and a narrow viewport selects the network way and opens the pairing step directly, and the guest page mirrors the host's preparation sub-menus read-only.

## Impact

Code: `engine/js/` gains the netcode modules (and `engine/tests/` gains suites for them); `js/pieces.js` (seeded draw), `js/state.js` (the seed and the peer slot in the play half), `js/app.js` (the consumer supplies the transport and the peer link), `js/screens.js` + `js/copy.js` (the pairing screens and their copy), `js/input.js` (a control model confirmed on a remote device), `js/bot.js` (not run in network play).

Tests: the engine suite must drive the netcode headless with `document`, `window`, `localStorage` and `RTCDataChannel` all absent. The game suite gains a two-peer simulation driven by two intent streams into one grid. The Playwright harnesses gain a two-page run: `scripts/verify-all.mjs` grows a thirteenth check, and `tests/helpers/dom-stub.js` supplies the seeded RNG both peers use.

Page: `snaketris.html` keeps one module script tag; the netcode ships inside the engine mount, so no new tag and no build step. Element ids and the `.view`/`.view.on` classes stay byte-stable.

## One-network pairing

The pairing must complete between two devices that already share one network — a local
network, or a virtual one such as a tunnel service — without a public candidate list. The
user accepts that the host page's address is reachable from the guest page, so the guest can
name that address as the candidate supply and the attempt needs no reachability proof. The
public list stays as the other supply: read from its configured source on every network-section
open, and pruned to the entries that answer.

Unverified risk: WebRTC `RTCDataChannel` reachability without an ICE server, and Safari-on-iOS behaviour, were not tested. The design must state the fallback and must not assume a STUN server exists.
