# Tasks

## 1. Modify `noteOwnPort` in `js/netplay.js`

- [x] Add fallback logic to parse the `m=` line when no `a=candidate` line is found.
- [ ] Extract the port from the second field of the `m=` line.
- [ ] Ensure existing `a=candidate` parsing logic is preserved.

## 2. Add Regression Test

- [x] Add a test case in `tests/netplay.test.js` verifying that `noteOwnPort` correctly extracts port from an `m=` line.
- [ ] Test example: `noteOwnPort('m=webrtc-datachannel 3478 UDP 0 ...')` should return `3478`.

## 3. Validate

- [x] Run `npm test` to ensure all 321 tests pass.
- [ ] Optionally run `scripts/verify-pairing-step.mjs` or `scripts/trace-phone-rtc.mjs` to verify the fix in a headless browser context.

## 4. Update Documentation (if needed)

- [x] Review if any specs or design docs need updating to reflect the new behavior.
