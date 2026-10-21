# Project notes — snaketris

These rules constrain edits to this repo only. The ripwire, OpenSpec, and
quality-gate rules live in the global `~/.pi/agent/AGENTS.md`; this copy adds
repo specifics.

## Work order — OpenSpec first, ripwire second

1. **OpenSpec is the source of truth.** Any behaviour change starts as a change
   under `openspec/changes/<name>/`: proposal → specs delta → design → tasks.
   No source file is touched before its task exists; `openspec validate` must pass.
2. **Code through ripwire only** (global rule). Read verb first, then edit verb;
   receipts auto-run `edit_check`. Plain `edit`/`write` are for non-symbol content
   (imports, constant blocks, HTML, JSON/JSONC, markdown, OpenSpec artifacts).
   `scripts/` is code too; for a statement-level block with no definition to
   splice, plain `edit` is the fallback — say so when you use it.
3. **Gates:** `quality_baseline` at the start, `quality_delta` before DONE.

## Code invariants

- Vanilla ES modules, no build step: `snaketris.html` loads `js/app.js`; every
  `js/*.js` is ESM.
- The board is 240×480 px (`COLS=10`, `ROWS=20`, `CELL=24`). The canvas buffer is
  never resized; only CSS scales it.
- Layout constants (in `js/config.js`, re-exported by `js/constants.js`) are the
  single source of truth for `js/render.js` (drawing) and `js/input.js` (hit-testing).
  Change them in one place.
- `js/input.js` `setDirection` is the shared steering path (PLAYING gate + no-reverse
  rule). Keep the in-game branch byte-for-byte stable when adding other-state branches.
- `js/bot.js` drives the side the player didn't choose; its direction goes through
  `handleIntent`, so it obeys the same steering rules.

## Checks after a change

- Unit, game tree: `node --test "tests/**/*.test.js"`. Both trees: `npm test`.
- Browser checks: Playwright (`@playwright/test`) drives the real page headless.
  Run the matching `scripts/verify-*.mjs` after a change to the role flow, piece
  control, scoring, the help view, or two-player gating. They route over
  `http://duel.test/` via `page.route`, so no local server is needed.
