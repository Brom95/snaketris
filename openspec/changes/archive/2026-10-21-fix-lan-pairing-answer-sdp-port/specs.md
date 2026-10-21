# Specs Delta

## Modified Requirement

**File:** `openspec/specs/network-play.spec.md` (or equivalent)

**Current Behavior:**
> The pairing mechanism extracts the local DTLS port from the SDP's `a=candidate` line.

**Changed Behavior:**
> The pairing mechanism extracts the local DTLS port from the SDP, preferring `a=candidate` lines when present, and falling back to the `m=` line's port field when no candidate lines exist.

## New Behavioral Guarantee

> A guest/phone page that creates an ANSWER SDP MUST be able to extract its own port from the `m=` line, enabling `craftPeerCandidate` to proceed.

## Test Requirements

1. `noteOwnPort('a=candidate:1 1 udp 1 100.107.90.10 3478 typ host')` must return port `3478` (existing test).
2. `noteOwnPort('m=webrtc-datachannel 3478 UDP ...')` must return port `3478` (new regression test).
