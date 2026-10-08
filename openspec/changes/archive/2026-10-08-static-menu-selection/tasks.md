# Tasks

## 1. Static item geometry

- [x] 1.1 In `snaketris.html`, put the ▶ marker on every item (`#menu-items li::before`, `#role-items li::before`) with `opacity: 0`, and show it only on `.on`. Remove `font-weight: bold` from `.on`.
  Verify: the computed width of `#menu-items` is identical for selection 0, 1 and 2.
- [x] 1.2 Give `#menu-items` and `#role-items` a fixed width so the block cannot re-centre.
  Verify: the left edge of the list is identical for every selection index on both screens.
- [x] 1.3 Use one font size for menu items and role items. Remove the 18 px `#role-items li` rule.
  Verify: the computed font size of every item on both screens is the same.

## 2. Back joins the selection cycle

- [x] 2.1 Move `#role-back` from a `<p>` to a `<li>` inside `#role-items`.
  Verify: `#role-items` contains three `<li>` elements in the order Snake, Tetris, Back.
- [x] 2.2 Add `ROLE_SCREEN_ITEMS = ['Snake', 'Tetris', 'Back']` to `js/constants.js`. Keep `ROLE_ITEMS` as the two roles.
  Verify: `ROLE_ITEMS.length === 2` and `ROLE_SCREEN_ITEMS.length === 3`.
- [x] 2.3 In `js/input.js`, make `moveSelection` cycle over `ROLE_SCREEN_ITEMS` in `SELECT_ROLE`, and make `confirmSelection` call `toMenu()` for the Back index.
  Verify: three down-arrow presses return the highlight to "Snake"; confirming index 2 returns to the menu.
- [x] 2.4 In `js/ui.js`, include the Back element in the highlighted item list.
  Verify: the `.on` class appears on the Back `<li>` when `game.roleSelect === 2`.
- [x] 2.5 In `js/input.js` `onInterfacePointerUp`, route a click on the Back item through the same confirm path, and remove the separate `hit(roleBackEl, ...)` branch.
  Verify: a click on Back returns to the menu.

## 3. Tests

- [x] 3.1 Add unit tests in `tests/input.test.js` for the three-item role cycle and for confirming Back.
- [x] 3.2 Add a Playwright check in `scripts/verify-role-duel.mjs` that reads `getBoundingClientRect()` of `#menu-items` and `#role-items` at every selection index and asserts equal width and equal left edge.
  Verify: `node scripts/verify-role-duel.mjs` reports no failures.
- [x] 3.3 Run `node --test "tests/**/*.test.js"` and `node scripts/verify-role-duel.mjs`.
  Verify: both exit 0.
