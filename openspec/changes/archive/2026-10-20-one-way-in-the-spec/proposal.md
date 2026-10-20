# Proposal: one network way in the spec

## What changes

The shipped game now runs one network way: the same-network pair, with no
candidate attempt and no ICE supply. The network-play capability spec still
carries requirements from the changes that built the two-flow design, and three
of them state rules the shipped code no longer follows: a pairing that needs a
candidate supply carried in the secret, a two-player entry that lists two
network flows, and a narrow viewport that shows the pairing step with no way
sub-menu at all.

## What this change does

Spec-only. No source file changes: the code already ships the one-way shape,
and the change under `openspec/changes/archive/2026-10-20-one-network-way-no-wait`
already retired the flow requirements themselves. This change restates the
survivors without the flow vocabulary and replaces the two requirements whose
subject no longer exists.

## Scope of the honest measurement

The one claim that stays unasserted: on two separate headless Chromium
instances the same-network pair reaches the state headless reaches (each page
reads its own, names its own address and port, aims at the peer it holds) and
does not report a joined channel. That was true before this change and is true
after it; the harness prints both.
