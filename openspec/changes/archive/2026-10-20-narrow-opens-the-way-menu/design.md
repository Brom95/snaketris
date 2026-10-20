# Design: a narrow viewport opens the way menu

## Why only the spec

The check that drives the two-player entry at both widths passes against the
shipped code, so the code's stand is the measured one and the capability is the
one out of step. A behaviour change with no code change is the rare honest case:
the rule was written wrong, not implemented wrong.

## Decision

The narrow viewport keeps a way sub-menu with the network way and Back. The
menu is what a one-pad player needs now that the entry no longer picks a way
for them: with one network way there is nothing to auto-pick and the back item
is how the section is left. The wide-only gate stays on the shared-page way
alone, since that way needs a second pad on this device.
