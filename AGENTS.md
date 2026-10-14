# Project notes — snaketris

These rules constrain edits to this repo only. The ripwire obligations, verbs,
gates and the strict ordering rule live in the global `~/.pi/agent/AGENTS.md`;
this project copy restates the obligation and the two must stay in sync.

## Work order — OpenSpec first, ripwire second

1. **OpenSpec is the source of truth.** Any behaviour change starts as a change
   under `openspec/changes/<name>/`: proposal → specs delta → design → tasks.
   No source file is touched before its task exists in the change. Review the
   artifacts before implementing; `openspec validate` must pass.
2. **Code is read and changed through ripwire only** (see the section below).
   Read verb first, then the edit verb; receipts auto-run `edit_check`.
3. **Gates bracket the work:** `quality_baseline` at the start, `quality_delta`
   before declaring DONE.
4. **Plain `edit`/`write`** stay reserved for non-symbol content: import lines,
   constant blocks, HTML, JSON/JSONC config, markdown prose, and the OpenSpec
   artifacts themselves.

## ripwire is mandatory for code work (project copy)

Use ripwire (`mcp__ripwire__<verb>`) for **every** interaction with code in this
repo — navigation, symbol lookup, contract checks, search, and edits. Start with
a ripwire read verb (`batch` / `find_symbol` / `fetch_body` / `analyze`) before
opening a file, and change a definition with a ripwire edit verb
(`replace_symbol_body` / `insert_after_symbol` / `insert_before_symbol`). Do not
bypass a ripwire verb with ad-hoc `grep` / `read` / `edit` — this is an
obligation, not a preference. Plain `edit` / `write` stay reserved for non-symbol
content only: import lines, constant blocks, HTML, JSON/JSONC config, markdown
prose. Harness scripts under `scripts/` are code and obey this rule too; where a
range carries no definition to splice (a statement-level block), plain `edit` is
the fallback because no ripwire edit verb can address it — say so when you use it.

This repo is a git repo, so the quality gates work: pin `quality_baseline` before
non-trivial work, and run `quality_delta` before declaring any change DONE.

## Code invariants

- Vanilla ES modules, no build step: `snaketris.html` loads `js/app.js`; every
  `js/*.js` is ESM.
- The board is 240×480 px (`COLS=10`, `ROWS=20`, `CELL=24`). The canvas buffer is
  never resized; only CSS scales it.
- Layout constants (declared in `js/config.js`, re-exported by `js/constants.js`)
  are the single source of truth shared by `js/render.js` (drawing) and `js/input.js`
  (pointer hit-testing). Change them in one place.
- `js/input.js` `setDirection` is the shared steering path (PLAYING gate + no-reverse
  rule). Keep the in-game steering branch byte-for-byte stable when you add branches
  for other states.
- `js/bot.js` drives the side the player did not choose. Its snake direction goes
  through `handleIntent`, so it obeys the same steering rules as the player.

## Checks after a change

- Unit, game tree: `node --test "tests/**/*.test.js"`. Both trees: `npm test`.
- Browser checks are allowed. Playwright (`@playwright/test`) drives the real page
  headless. Run the matching `scripts/verify-*.mjs` after a change to the role flow,
  piece control, scoring, the help view, or two-player gating. They route the repo
  over `http://duel.test/` through `page.route`, so no local server is needed.
