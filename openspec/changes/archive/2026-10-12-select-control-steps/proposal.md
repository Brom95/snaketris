# Proposal: Select-Control Steps

## Problem
The SELECT_CONTROL screen currently shows all items as a simultaneous list (P1 layout, P2 layout, Start, Back). The user must scan the whole list to understand what is required. The interface is not intuitive: there is no clear indication of which player's turn it is, and no explicit "what do I press next" guidance.

## Proposed UX Principle
**One item per display.** Each step in a sequential flow shows exactly one item at a time. The item replaces the entire menu area (large, centered text). When the user acts on that item, the next item appears. No more than one selectable choice is shown per screen display.

## Redesign: per-player screens + merged SHARED
The confirmation flow is split into separate per-player screens so each player sees their own prompt:

- **P1 screen**: P1 selects and confirms their input layout (one key press = immediate confirm).
- **P2 screen**: P2 selects and confirms their input layout (one key press = immediate confirm).
- **SHARED screen**: after P2 confirms, a merged screen shows BOTH assigned layouts together with a Start button.

Navigation is bidirectional: every screen carries a Back control to return to the previous step. After a game ends, players return to the SHARED screen (not the main menu), where they can see the assigned layouts and reassign if needed.

## Scope
- SELECT_CONTROL becomes a sequential step-by-step flow with per-player screens
- Each step shows one prominent item with explicit key hints
- Emoji markers on each step (🐍 🏗️ ⌨️ etc.)
- One key press = immediate confirm (no two-step select→confirm)
- Reset button (small, in the status row, emoji) visible only after a player confirms
- Back control on every screen (bidirectional navigation)
- Merged SHARED screen after P2: both assigned layouts + Start
- Game-over returns to the SHARED screen (not the main menu)

## Non-goals
- Changing the main menu or role screen (they stay as lists)
- Adding sound effects
- Changing the game rules
