# Tasks: Select-Control Steps

- [ ] Add step-by-step state to SELECT_CONTROL in ui.js: show one item at a time, hide the rest
- [ ] Split SELECT_CONTROL into per-player screens (P1 own, P2 own) so each player sees their own prompt
- [ ] Add key-hint line below each step showing which keys unlock it
- [ ] Add emoji markers (🎮 P1, 🕹 P2) on each step item
- [ ] One key press = immediate confirm (no two-step select→confirm) on per-player screens
- [ ] Reset button (small, in the status row, emoji) visible only after a player confirms
- [ ] Add merged SHARED screen after P2: both assigned layouts + Start
- [ ] Back control on every screen (bidirectional navigation)
- [ ] Game-over returns to the SHARED screen (not the main menu)
- [ ] Update CSS: make step text large and centered, key hints smaller
- [ ] Update harness verify-control-model.mjs to check one-item-at-a-time visibility
- [ ] Run npm test + harness scripts; all green
