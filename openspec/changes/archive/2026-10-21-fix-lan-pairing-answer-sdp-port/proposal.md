# Proposal: Fix LAN Pairing Answer SDP Port Extraction

## Why

The LAN pairing feature fails because the guest/phone page cannot extract its DTLS port from its ANSWER SDP. This breaks the pairing flow and leaves both pages stalled in "Waiting for the other device".

## What Changes

The snaketris LAN multiplayer pairing feature uses WebRTC's `RTCPeerConnection` to establish direct peer-to-peer connections. The pairing mechanism works as follows:

1. The host page creates an OFFER SDP, which contains `a=candidate` lines with the allocated DTLS port.
2. The guest/phone page creates an ANSWER SDP, which (per WebRTC spec) does **not** contain `a=candidate` lines.
3. The `noteOwnPort` function (`js/netplay.js:100`) extracts the port by scanning for `a=candidate:` lines in the SDP.
4. This works for the host (OFFER) but fails for the guest (ANSWER), leaving `lobby.port = 0`.
5. `craftPeerCandidate` bails when `lobby.peerPort === 0`, causing the pair to stall in "Waiting for the other device."

## Problem Statement

The guest/phone page cannot extract its DTLS port from its ANSWER SDP because `noteOwnPort` only searches for `a=candidate` lines, which are absent in ANSWER SDPs. This asymmetry breaks the LAN pairing flow.

## Proposed Fix

Modify `noteOwnPort` to fall back to parsing the `m=` line when no `a=candidate` line is found. The `m=` line format is `m=<media> <port> <proto> <fmt>...`, where the port is the second field.

## Impact

- **Minimal change**: Only modifies `noteOwnPort` function in `js/netplay.js`.
- **Backward compatible**: Existing behavior for OFFER SDPs (with `a=candidate` lines) is preserved.
- **Fixes the root cause**: Guest pages can now extract their port from ANSWER SDPs.
