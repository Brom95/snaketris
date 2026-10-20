
> Superseded by `one-network-way-no-wait`, which retires the wait this change moved instead of doubling it.

## Why

The same-network way asks no server for candidates, yet a page on that way still stops behind the candidate wait before it does any of its own work, and for the page that opened a link the wait never finishes at all. Measured: a host page resolves the wait (`ice local`) and reads its own port, and the page it opened sits at `ice gathering` with the countdown stuck at three for the whole run — its own description already carries a candidate line naming a real port (587 bytes), yet `lobby.port` stays 0, the page never aims at the peer its link named, and it paints no line its player can carry. That is what a phone does after a player types their address: nothing activates.

## What Changes

- The same-network way's per-tick work — read its own port, rebuild its line, announce, aim at the peer its link named — runs before the candidate wait, not behind it. The wait belongs to the way that asks a server for candidates.
- Nothing about the anywhere-network way changes: its wait still holds its publish and its channel, exactly as before.
- A page on the same-network way that opened a link naming its peer aims at that peer from the moment it opens, whether or not its own wait ever resolves.
