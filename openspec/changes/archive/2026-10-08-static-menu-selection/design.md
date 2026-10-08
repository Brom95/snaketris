# Design

## Root cause of the slide

`#menu-view.on` is a flex column with `align-items: center`. Each `<li>` is a flex item, so the `<ul>` width equals the widest `<li>`. Two rules change that width when the selection moves:

```css
#menu-items li.on { font-weight: bold; }        /* 400 -> 700: wider glyphs */
#menu-items li.on::before { content: '\25b6 '; } /* adds 22 px */
```

Measured at 1280×800:

```
menuSelect = 0   ul 121 px   x = 580
menuSelect = 1   ul 121 px   x = 580
menuSelect = 2   ul 138 px   x = 571     (+17 px, block moves 9 px left)
```

The font size never changes. Only `font-weight` changes. The 20 px menu size and the 18 px role size are two different screens, not one item resizing.

## Chosen approach: a permanent marker

Put the marker on every item and show it only on the selected one:

```css
#menu-items li::before  { content: '\25b6'; opacity: 0; }
#menu-items li.on::before { opacity: 1; }
```

Every item then has the same intrinsic width in both states. The list width is fixed, so the block cannot re-centre. Dropping `font-weight: bold` removes the second width change.

Rejected alternatives:
- A fixed `ul` width alone: it still needs the bold removed, and it hard-codes a size that must match the longest label.
- An absolutely positioned arrow outside the items: more markup, and the hit area no longer matches the label box, which the "Hit area follows the rendered label" requirement forbids.

## Back as a real item

`#role-back` becomes the third `<li>` in `#role-items`. One list, one highlight path, one confirm path.

```
#role-items
  li  🐍 Snake     index 0
  li  🏗️ Tetris    index 1
  li  Back         index 2
```

`js/constants.js` gains:

```js
export const ROLE_SCREEN_ITEMS = ['Snake', 'Tetris', 'Back'];
```

`ROLE_ITEMS` stays the two roles, because `game.role` and the high-score records use it.

`confirmSelection` in `js/input.js` maps index 2 to `toMenu()`:

```js
} else if (game.state === SELECT_ROLE) {
  if (game.roleSelect === ROLE_SCREEN_ITEMS.length - 1) { toMenu(); return; }
  game.role = ROLE_ITEMS[game.roleSelect].toLowerCase();
  startGame();
}
```

`moveSelection` uses `ROLE_SCREEN_ITEMS.length` in `SELECT_ROLE`.

`onInterfacePointerUp` keeps its click path: a hit on any of the three items sets `game.roleSelect` and sends `confirm`. The separate `hit(roleBackEl, ...)` branch is removed.

## Verification

The geometry claim needs a real browser. `scripts/verify-role-duel.mjs` already has `serve`, `shown`, and `snapshot`. Add a check that reads `#menu-items` and `#role-items` `getBoundingClientRect()` at every selection index and asserts equal width and equal left edge.
