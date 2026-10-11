# Design

## Context

The current `confirmControlModel(player, model)` in `state.js` is a single operation: pressing WASD instantly locks P1's model. There is no separate selection step. The `onKey()` handler in `input.js` routes layout keys directly to confirm, with no intermediate state.

This change splits the flow into two stages within the existing `SELECT_CONTROL` state — no new enum value is introduced.

## Goals / Non-Goals

**Goals:**
- Separate selection from confirmation so a player can try a different layout before locking in
- Any layout key press selects that layout (WASD, arrows, gamepad button)
- A different layout pressed before confirmation replaces the previous selection
- Confirmation is an explicit action (Space / Enter / click Start / A on gamepad)
- Back from SELECT_CONTROL returns to SELECT_ROLE

**Non-Goals:**
- No new state enum value — `SELECT_CONTROL` absorbs both sub-phases
- No change to the exclusivity rule (keyboard layouts remain exclusive, gamepad remains shareable)
- No change to single-player mode

## Decisions

### D1: Two fields on `game` for selection vs confirmation

Add two new fields to the `game` object in `state.js`:

```
p1Selection: null   // 'wasd' | 'arrows' | 'gamepad' | null
p2Selection: null   // 'wasd' | 'arrows' | 'gamepad' | null
```

The existing `p1Model` / `p2Model` fields become the *confirmed* (locked) values. A player's selection is mutable until confirmed; once confirmed, the selection becomes the model and further layout-key presses for that player are ignored.

**Why two fields instead of one:** The "replace previous selection" rule requires a mutable slot that is distinct from the locked value. A single field would conflate "I picked WASD" with "I confirmed WASD".

### D2: Split `confirmControlModel` into select + confirm

Replace the current `confirmControlModel(player, model)` with two functions:

- `selectControlModel(player, model)` — sets `p1Selection` / `p2Selection`. If the player already has a selection and the new model differs, replace it. If P2's selection conflicts with P1's confirmed model (same keyboard layout), set `controlError` and do not update.
- `confirmControlModel(player)` — locks: copies the current selection into `p1Model` / `p2Model`, clears `controlError`, sets `controlConfirmed = true` when both are locked.

**Alternative considered:** a single function with a "confirmed" flag on each player. Rejected because the existing code already uses `p1Model`/`p2Model` for the confirmed values and `controlConfirmed` for the both-locked gate — reusing those avoids adding a third pair of fields.

### D3: Input routing in `onKey()`

Restructure the SELECT_CONTROL branch of `onKey()`:

1. Layout keys (WASD, arrows) → `selectControlModel(whoever-has-not-chosen, layout)`.
2. Space or Enter → `confirmControlModel(whoever-has-not-confirmed)`.
3. Both confirmed: keys fall through to navigation.

The gamepad path (`pollController` → `devicePoll`) already normalizes button presses into intents. Add two new intent actions: `selectP1Model`, `selectP2Model` (for layout selection via gamepad button) and reuse `confirmP1Model` / `confirmP2Model` for the confirm action (A button).

### D4: Back navigation target

Change the Back item in SELECT_CONTROL from `toMenu()` to a new `backToRoleSelect()` that sets `game.state = SELECT_ROLE`. The role screen already has its own Back item returning to MENU, so the chain is:

```
SELECT_CONTROL → Back → SELECT_ROLE → Back → MENU
```

**Why not reuse `toMenu()`:** the user's requirement is "from each stage, return to the previous stage". Going straight to MENU skips SELECT_ROLE and loses the role that was chosen.

### D5: UI text update

The control-view items in `snaketris.html` change from "press W/A/S/D or arrows to confirm" to "select a layout (WASD / Arrows / Gamepad)" for P1 and P2. The Start item remains hidden until `controlConfirmed` is true (existing behavior via `syncViews`).

## Risks / Trade-offs

- **Key collision risk:** Space and Enter are also used in the main menu navigation (`keyToIntent` maps them to `menuUp`/`menuDown`/`confirm`). In SELECT_CONTROL, the SELECT_CONTROL branch of `onKey()` must intercept Space/Enter *before* they fall through to `keyToIntent`. Mitigation: the SELECT_CONTROL branch returns early on Space/Enter when a player is pending confirmation.
- **Gamepad button ambiguity:** any gamepad button press selects 'gamepad'. A player who has not chosen and presses any button gets 'gamepad' selected; pressing A confirms. This is consistent with "any layout key = selection".
