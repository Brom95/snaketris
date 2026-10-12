# Design

## Context

Current composition, verified by reading the modules:

- `js/engine.js createEngine(systems)` loops over ordered `{ name, init, update }` entries. `js/app.js` registers three: `[botSystem, snakeSystem, piecesSystem]`.
- The interface runs as four frame-level calls in `app.js frame()`: `pollController()`, `render()`, `syncViews(...)`, `fitField()`.
- Navigation is written in four modules: `constants.js` item lists, `input.js` index branches (`confirmSelection`, `openMenuItem`, `moveSelection`), `state.js` transitions (`toMenu`, `backToRoleSelect`, `pickP1Role`, `gameOver`), `ui.js` view visibility plus the `GAME_CONTROL_*`-to-index mapping.
- `js/state.js` owns one mutable `game` object. Every module imports it and mutates it in place. That convention is stated in the module header as the reason there are no stale references across module boundaries.
- `state.js gameOver()` calls `recordScore` from `js/highscores.js`, so the core writes browser storage.
- `tests/helpers/dom-stub.js` stubs `menu-items` and `role-items` only. There is no `control-items` element, so `SELECT_CONTROL` is not unit-testable today.
- ripwire reports the coupling that churns most: `constants.js <-> input.js` 13 commits, `constants.js <-> state.js` 11 (degree 0.85, recurring 3), `input.js <-> state.js` 10, `input.js <-> ui.js` 9. The one cycle in the graph is `snake.js <-> pieces.js`.

See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- One declarative screen table is the single source of truth for screens, items, order, key hints, and item targets.
- The navigation state machine is an engine system that advances from normalized intents only.
- Gameplay state and screen state live in separate halves with separate resets.
- The gameplay core reads no page object, no viewport, no browser storage.
- One module owns the page element lookup, so hit-testing and painting read the same elements.
- One module owns the viewport math, so the field fit and the interface band read one rule.

**Non-Goals:**

- No new screen, no new label, no new item order, no visual style change. The page CSS and `snaketris.html` element ids and the `.view`/`.view.on` classes stay byte-stable.
- No change to gameplay rules: scoring, roles, the bot, the difficulty ramp, wrap-around, death conditions, SRS rotation.
- No framework, no build step, no external asset, no backend.
- Breaking the `snake.js <-> pieces.js` cycle. That cycle is inherent: the snake eats pieces and pieces land on the snake.
- Portability beyond this repo. "Portable navigation scheme" means one table inside this codebase, not a cross-project format.

## Decisions

**D1. The screen system is a tick-level system; presentation stays a frame pass.**
The navigation state machine joins the registry as a fourth entry, after the three gameplay systems. Canvas painting, page painting and field fitting stay in the frame pass. Reason: a frame can run several ticks, and painting inside the registry would paint several times per frame. Alternative considered: register `render` and `syncViews` as systems; rejected for that reason.

**D2. One screen table, data only.**
`js/screens.js` exports the table: one entry per screen, each with its items in page order, and for each item its label, its marker, its key hints, and the screen or transition it opens. Back and reassign controls are declared per screen, not hard-coded in an input module. `constants.js` keeps the labels and markers it already owns; the table references them. Alternative considered: keep per-module branches and delete the duplication by convention; rejected, because the duplication is the defect.

**D3. The state split keeps one root object.**
`game` stays the single import every module reads. It gains two halves: `game.play` (snake, pieces, scores, accumulators, tick, result) and `game.screen` (state, selections, models, control step). The halves are separate objects, so each reset touches one. Alternative considered: two module-level exports (`play`, `screen`); rejected, because it breaks the "import `game` and mutate in place" convention that keeps references fresh across module boundaries.

**D4. Intents flow through a queue the screen system drains.**
`input.js` normalizes device events into intents and pushes them onto a queue. The screen system drains the queue at the start of its update step. Reason: the interface stops calling gameplay directly, and the order of work per tick becomes explicit. Consequence: an intent applies on the next tick instead of synchronously. Mitigation: drain at the start of the update step, so one tick is the maximum delay, and tests advance one tick before asserting. Alternative considered: `input.js` calls the screen system directly; rejected, because it keeps the interface outside the engine's ordering.

**D5. The core reports the result; a records system persists it.**
`gameOver()` sets `game.play.result` and stops calling `recordScore`. A records owner persists a reported result once, then clears it. Reason: the core becomes storage-free, and the write gains one owner. Alternative considered: the frame pass calls `recordScore`; rejected, because it puts persistence back into `app.js` and makes the write order invisible to tests.

**D6. One owner for page elements.**
`ui.js` owns the element lookup and exposes the item lists it already queries. `input.js` hit-tests against that same map instead of calling `querySelectorAll` and `getElementById` again. Reason: the ids are declared once, in the table, and looked up once.

**D7. One owner for viewport math.**
`stackedLayout()` and `interfaceBandHeight()` and the field fit read one viewport helper. The constants stay in `constants.js`. Reason: `ui.js` and `input.js` duplicate the `window.innerWidth`, `FIELD_V_GAP`, `UI_STACK_MAX_WIDTH` rule today.

## Risks / Trade-offs

- [The 13 Playwright harnesses assert page ids and the `.view`/`.view.on` classes] → Keep ids and classes byte-stable; run `npm run verify` after every task group, not only at the end.
- [`tests/app.test.js:68` asserts the engine order and already fails at clean HEAD] → The green baseline is 155 of 156. Update that test's expectation to the new order deliberately and keep the pre-existing failure accounted for; do not treat it as a fix.
- [The intent queue shifts navigation by one tick] → Drain at the start of the update step; every navigation test advances one tick before asserting.
- [`state.js` has 8 dependents, so the split has a wide blast radius] → Stage the split: add the halves first, move reads second, delete the old flat fields last; run `npm test` after each step.
- [The table can drift from the page HTML] → Add a check that every table entry resolves to a real page element, and let the existing geometry harnesses confirm the boxes.
- [QWEN.md states 120 unit checks and 8 harness scripts] → Those counts change; update QWEN.md in the same change so the docs stay true.
- [A records system that persists on every tick would write repeatedly] → Persist only a reported result and clear it after writing.

## Open Questions

- Whether the records owner is a registry system or a named call in the frame pass. Both satisfy the spec delta; decide when task 6 lands and record the choice in the commit.
- Whether `game.screen` keeps a `state` field name or renames it to `screen.id`. Renaming touches every read; defer until the split is green.
