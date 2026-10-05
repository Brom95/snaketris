# Design

## Context

The starting menu is the `#menu-view` block in `snaketris.html`: an `h1` title, a `ul#menu-items` with three `li` items ("Play", "Records", "How to Play"), and the GitHub anchor. Today `#menu-items li` is 16px with no spacing between the items, so the block is a small dense cluster centred in the interface column (`#ui`, width `min(320px, 92vw)`, column flex). On a phone that leaves tiny, close-together hit targets.

The menu's visibility is driven by `syncViews()` in `js/ui.js` toggling `.on` on `#menu-view`; the field is hidden while the menu is shown (existing `start-menu` requirement), so on the menu screen nothing else competes for the viewport height.

## Goals / Non-Goals

**Goals:**
- Space the three items apart and make them larger, so each is a distinct target.
- Extend the menu block to roughly two thirds of the viewport height at narrow viewports, so it is not clustered in the centre.

**Non-Goals:**
- No change to which items exist, their order, or how they are selected (keyboard / pointer / gamepad paths are untouched).
- No change to the field, the score readout, or the records/help views.

## Decisions

- **Spacing mechanism.** Add vertical padding/margin on `#menu-items li` so each item is separated from its neighbours, and bump `#menu-items li`'s font size up from 16px so each label is a bigger target. The items keep their existing rendered boxes; the hit area follows the box (existing `start-menu` "Hit area follows the rendered label" requirement).
- **Viewport-height extent.** Give the menu block (`#menu-view`) a `min-height` at narrow viewports so it extends to roughly two thirds of the viewport height, and space the items within it (the title, the items, and the GitHub link stay in flow). Because the field is hidden while the menu is shown, this does not push the field off-screen.
- **No new constants.** The item font size and the spacing are pure page CSS in `snaketris.html`; no `js/constants.js` value is mirrored, so no JS change is needed.

## Risks / Trade-offs

- [Menu pushes off-screen at narrow viewports] → Mitigation: keep the menu block's extent within the viewport height; verify no vertical scroll and that the stacked interface band still fits (existing `responsive-layout` "Stacked interface yields its band to the field").
- [Menu covers the play field] → Mitigation: the field is hidden while the menu is shown (existing `start-menu` requirement); verify no overlap on a narrow viewport.
- [A tap still misses into a neighbour] → Mitigation: spacing plus larger font size make each item's box distinct; verify tapping one item selects only that item.
