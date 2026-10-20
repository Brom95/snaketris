## Design

### Where the cut happens today

The step is a `flex:1` pane (`#pairing-view`) with a fixed ceiling of 600px and no lower bound, and every layout gives it the leftover height — 442px on the layouts measured. Its content is allowed to run past that ceiling: `overflow` is unset, so the view paints over the bezel and out of the phone's viewport. A run measured the content at nine combinations (375/390/720/1280 wide, four pairings of the two flows, host page and the page opened at the host's link): all fit except one, the phone that opened a link, at 594px of content in 442px.

That one combination is what the user hit, and the lost 152px is the bottom of the step: the address field, its result line, and the copy affordance — the two things the next step of the dance needs.

### The decision

**Give the step a scroll of its own when its content is taller than the pane.** The rule keeps the measured natural height of the step (no shrinking, no line dropped) and keeps the pane's height, so the game above the step never moves and never shrinks. The overflow becomes reachable instead of invisible.

Three things had to be settled:

1. **Scroll the step, not the page.** The page holds the game above; scrolling the page moves the board and hides the header. A user who cannot see the bottom of the step is looking at the step, so the step is what swipes.
2. **A scroll bar alone is not enough on a phone.** A phone user does not know to swipe inside a pane that never scrolled before, so when the content really is taller than the pane, a line in the copy says so — the line is painted only when it is true, measured at paint time (`scrollHeight` past `clientHeight`), so a desktop that fits gets nothing new.
3. **Every layout gets the rule**, not just the phone: the same growth that overflows at 375px could overflow at 390px with a taller toolbar, and a wide short window at 1280px has the same pane height of 442px. The rule is written once per layout block, at the `#pairing-view` rule that already exists there.

## Design

### What already reaches, and what does not

The stacked layout (a single `@media (max-width: 760px)` block, the only breakpoint this page has) already carries a scroll rule for the sub-menus: `#help-view, #records-view, #pairing-view { max-height: 100vh; overflow-y: auto }`, and the step's column starts at the top instead of centring, so its title stays on screen. A phone is inside that block, so at 375 wide the step does scroll — measured: content 594px of pairing step in a pane 442px tall, scroll track present.

What the user hit is therefore not a clipped step but an **unmarked** one: on a touch screen a scroll track draws no bar, nothing on the page says the step moves, and the two things the next step of the dance needs — the address field and the affordance that copies its line — sit below the fold. The player sees the top of a wall of text, cannot tell there is more, and stops.

Above 760 there is no overflow rule at all: a short wide window gets the same 442px pane and, if the step grows, its lower lines are cut at the bezel.

### The decision

**Say so when the step overflows, and let every layout scroll.** Two rules, not one:

1. **A line in the copy, at the top of the step, that names the scroll** — painted only while the step really is taller than its pane (`scrollHeight` past `clientHeight`, measured at paint time), so a layout that fits paints nothing new and no desktop grows used to a line it cannot act on. Naming the gesture ("swipe the step") is what makes a trackless phone scroll discoverable.
2. **The overflow rule on the wide layout too**, so the step can never be cut at the bezel on a short wide window either. The rule is the one the narrow block already states, lifted so both layouts share it.

Three things had to be settled:

1. **Scroll the step, not the page.** The page holds the game above; scrolling the page moves the board. A user who cannot see the bottom of the step is looking at the step, so the step is what swipes.
2. **Never shrink the step.** Height rules that squeeze lines are a lie: the player would read a step that dropped a line they need. The measured natural height stays; the overflow gets a route.
3. **The line is painted, not styled.** A CSS-only affordance (a drawn chevron) cannot answer the question "is this step actually taller than its pane" — a media query cannot read content height — so the paint reads it.

### Risks and what they mean

- **The flex column.** The step sits beside the game in a column where the game takes `flex:1` with no lower bound. Giving the step a scroll must not make the browser shrink the step's pane or push the game out; measured at 375: the pane stays 442 and the game keeps its size.
- **A phone swipe vs. a page swipe.** A one-finger drag inside the pane scrolls the pane; a swipe on its outer edge scrolls the page. The hint line names the step so the gesture is not guessed.
- **The copy affordance inside a scrolled step.** The affordance is a control in the DOM, not a painting, so it stays reachable once the step scrolls; the check asserts the control is present after the growth, not that a fixed pixel offset still lands on screen.
- **Touch browsers are not measured here.** The harness drives a desktop Chromium at phone widths; whether a real phone's own behaviour steals the gesture from the pane is the user's check.
