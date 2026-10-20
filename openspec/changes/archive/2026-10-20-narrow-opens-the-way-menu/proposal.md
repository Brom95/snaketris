# Proposal: a narrow viewport opens the way menu

## What changes

The network-play capability says a narrow viewport shows the pairing step
directly and shows no way sub-menu. The shipped entry shows the sub-menu at
every width -- on a narrow viewport it offers the one network way and Back --
and picking the way is what opens the pairing step.

The requirement's rule is corrected; what it protects (the network way is
offered at every width, the shared-page way stays wide-only) stays.

## No code change

Nothing moves. `scripts/verify-two-player-gating.mjs` already measures the
shipped stand at 375 wide and passes, which is why the spec, not the code, was
out of step.
