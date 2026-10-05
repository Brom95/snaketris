# Tasks

## 1. Menu item spacing and size

- [x] 1.1 Add vertical padding/margin on `#menu-items li` and bump its font size up from 16px in `snaketris.html`; verify the three items are spaced apart (not clustered) and each is a bigger target than before
- [x] 1.2 Give the menu block (`#menu-view`) a min-height at narrow viewports so it extends to roughly two thirds of the viewport height, with the title, the items, and the GitHub link staying in flow; verify the menu is not clustered in the centre at a 390×844 viewport

## 2. Verification

- [x] 2.1 Verify on a narrow phone viewport that the menu does not cover any part of the play field (the field is hidden while the menu is shown) and stays fully visible without scrolling; verify tapping one item selects only that item
- [x] 2.2 Run the ripwire gate before opening a PR: `quality_delta` against the pinned baseline reports nothing worse, and `doc_drift` finds no stale anchor in this change's `design.md`; record both results
