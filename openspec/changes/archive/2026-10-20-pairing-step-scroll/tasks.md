## 1. The mark and the rule

- [x] 1.1 The copy gains one line, in the player's language, that names the scroll and names the step as what moves.
- [x] 1.2 `js/ui.js` paints that line at the top of the step only while the step really is taller than its pane (`scrollHeight` past `clientHeight`), so a layout that fits paints nothing new.
- [x] 1.3 The overflow rule (`max-height: 100vh; overflow-y: auto`) is lifted so the wide layout carries it too, and no layout can cut the step's lower lines at the bezel.

## 2. The measurement

- [x] 2.1 Measure the page before and after: at 390 wide on a 700px-tall viewport the step holds 1070px in a 700px pane and at 300px pane on a 300px-tall one, and the line is painted in both; a shorter page (355px in a 300px pane) paints nothing new.
- [x] 2.2 A check asserts the line appears at that width and that the step is scrollable there, without naming a fixed pixel offset.

## 3. The gates

- [x] 3.1 Re-run the pairing checks and `npm test` with the line and the rule in place.
