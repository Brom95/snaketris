# Design

## Context

The pairing step re-focuses its address field through a flag
(`pairingFocused` in `js/ui.js` `paintPairing`). The flag was meant to focus
once per step entry and hold still afterwards, but the branch structure clears
the flag on every frame where it is already set, so the field gets re-focused on
every other paint frame while the step stays entered.

## Goals / Non-Goals

**Goals:**

- Focus the address field once when the pairing step is entered.
- Never re-focus the field on later frames of the same step.
- Reset the flag only when the step is left.

**Non-Goals:**

- Any change to the game model, network frames, or the global way.
- Removing the manual address field or the peer-address fallback.

## Decisions

### Focus once per step entry, reset on leave

The focus call runs only while the flag is unset; the flag is set on the focus
and cleared only when the screen leaves `PAIRING`. A cleared field may be
re-focused once, but never on a steady frame of the same step.

## Risks / Trade-offs

- A re-focus loop would reintroduce the keyboard covering the Pair control;
  the once-only rule plus the leave-reset keeps the step stable.

## Open Questions

None.
