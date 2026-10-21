# Design Notes

## Why This Fix Works

Per RFC 4566 (SDP), the `m=` line always contains the media port, regardless of whether the SDP is an OFFER or ANSWER. `a=candidate` lines are only present when ICE gathering has produced candidates (typical in OFFERs, not guaranteed in ANSWERs).

The fallback to `m=` line is consistent with the existing code's intent: extract the port the peer is listening on.

## Edge Cases

1. **If the `m=` line is missing or malformed**: `noteOwnPort` continues to return 0 (current behavior preserved).
2. **If both `a=candidate` and `m=` lines exist**: The `a=candidate` port is preferred (existing behavior preserved).
3. **If port is 0**: The port is skipped as a placeholder (existing behavior preserved).

## Implementation Details

The `noteOwnPort` function will:
1. First scan for `a=candidate:` lines (existing logic).
2. If none found, scan for `m=` lines and extract the port from the second field.
3. Return early if port is found in either case.

## Testing Strategy

1. **Unit test**: Add regression test in `tests/netplay.test.js` for `m=` line parsing.
2. **Integration test**: Run `scripts/verify-pairing-step.mjs` or `scripts/trace-phone-rtc.mjs` to verify the fix in a headless browser context.
3. **Full suite**: Run `npm test` to ensure all 321 tests pass.
