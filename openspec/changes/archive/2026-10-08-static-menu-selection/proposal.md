# Proposal

## Why

The ▶ marker appears only on the selected item, and the selected item turns bold. Both widen the item, so the flex-centred list re-centres every time the selection moves. Measured in Chromium at 1280×800: the menu list is 121 px wide at selection 0 and 1, and 138 px at selection 2 (left edge moves 580 → 571). The role list moves the same way (100 px → 110 px). The labels slide under the arrow instead of the arrow moving between fixed labels.

The Back control on the role screen is a `<p>` outside `#role-items`. `moveSelection` cycles over `ROLE_ITEMS` (two entries), so the marker never reaches Back. Only a click, Escape, or the gamepad B button can use it.

## What Changes

- The ▶ marker is present on every item and changes only its visibility.
- The selected item differs from an unselected item by colour only: no bold.
- Menu items and role items use one font size (the role items drop their 18 px rule).
- `#role-back` becomes a `<li>` inside `#role-items` and joins the selection cycle.
- `moveSelection`, `confirmSelection`, `highlightItem`, and `onInterfacePointerUp` handle the three-entry role list.
- No change to the GitHub link: it stays outside the selection cycle, as the `start-menu` spec already requires.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `start-menu`: item geometry stays fixed when the marker moves; one font size for menu and role items; Back becomes a selectable item on the role screen; keyboard role selection and role-screen cancellation cover Back.
- `controller`: the D-pad/stick role cycle covers the Back item, and A on Back returns to the menu.

## Impact

- `snaketris.html`: CSS rules for `#menu-items` and `#role-items`; the role Back markup.
- `js/constants.js`: a role-screen item list that includes Back.
- `js/input.js`: `moveSelection`, `confirmSelection`, `onInterfacePointerUp`.
- `js/ui.js`: `initUi` and `highlightItem` cover the Back element.
- Tests: `tests/input.test.js`, `tests/ui.test.js`, `scripts/verify-role-duel.mjs`.
