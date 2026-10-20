## Why

The pairing step fits on the screens the user's own browser shows: 204px of content at 375px wide (a phone), 280px at 390px with browser chrome, 273px at 720px, all inside a pane 442px tall. It stops fitting as soon as the flow paints more: a phone that opened a pairing link grew to 594px of content in a pane 442px tall — 152px that no touch can reach — and the cut happens at the bottom, where the address field and the affordance that copies its line live. The user reported exactly this: after entering their own address the page showed so much that they could not see what else to enter, or where.

## What Changes

- A step that grows past the pane says so at its top, in the player's language, and names the gesture that moves it. The stacked layout already scrolls, but nothing marks it and a touch screen draws no bar; the wide layout does not scroll at all.
- The scroll rule is lifted onto both layouts, so a short wide window cannot cut the step at the bezel either. The step is never shrunk and the pane never grows past the space the layout gives it.
- When the step does overflow, a line says so in the player's language, so a phone user knows to swipe rather than hunt.
- The copy affordance for the line a pair carries stays inside the scrolled step, so a phone can always reach the value it has to copy.

## Impact

Nothing about the flow changes: the same lines, the same fields, the same waits. A check reads whether the step is scrollable at the widths a phone and a desktop chrome give, and the pairing checks are re-run.
