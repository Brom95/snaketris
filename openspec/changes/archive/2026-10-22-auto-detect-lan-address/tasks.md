# Tasks

## 1. Auto-detect the page's own local address

- [x] 1.1 In js/app.js, after createTransport builds its RTCPeerConnection, attach a one-time listener on the `icecandidate` event that reads the first non-link-local host candidate in a private range (192.168.x.x, 10.0.0.0/8, 172.16.0.0/12)
- [x] 1.2 Report that detected address back to the pairing state via the existing noteAddress, so it lands in the field exactly like a typed address
- [x] 1.3 Verify a unit test in tests/netplay.test.js that a private-range host candidate is accepted by noteAddress and a link-local / public address is not

## 2. Keep the Pair control reachable on mobile

- [x] 2.1 In js/ui.js paintPairing, stop re-focusing the address field on every paint frame; focus it once when the pairing step is first shown instead
- [x] 2.2 Verify the pairing step's Pair control is tappable with the address field focused by a Playwright check (scripts/verify-network-local or a matching script) on a mobile viewport

## 3. Verification

- [x] 3.1 Run the unit tree (npm test) and confirm it passes after the address and focus changes
- [x] 3.2 Run the network-local verification script (scripts/verify-network-local.mjs) and confirm the same-network pairing flow reports a filled own address and a reachable Pair control
