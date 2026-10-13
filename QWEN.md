# QWEN.md — snaketris

## Project Overview

**snaketris** is a single-page HTML5 game: a Snake/Tetris duel. Before each game the player chooses a role — Snake or Tetris. A bot drives the side the player did not choose. A falling piece is edible while it moves; once it touches the bottom or rests on other pieces it stops being edible and becomes a solid obstacle. The higher side score wins.

- **Tech stack:** `snaketris.html` + two ES-module trees — the game in `js/` (`config.js`, `rules.js`, `copy.js`, `constants.js`, `grid.js`, `state.js`, `pieces.js`, `snake.js`, `bot.js`, `screens.js`, `devices.js`, `input.js`, `ui.js`, `render.js`, `highscores.js`, `app.js`) and the reusable engine in `engine/js/` (`clock.js`, `registry.js`, `state.js`, `grid.js`, `navigation.js`, `canvas.js`, `layout.js`, `interface.js`, `present.js`, `devices.js`, `records.js`) + `package.json` (`"type": "module"`); vanilla JS only, no framework, no backend, no external dependencies, no build step. Eight game modules import across the mount with relative paths (`../engine/js/…`); the page still loads a single `<script type="module" src="js/app.js">` and is served over HTTP (primary target: GitHub Pages; `file://` double-click is blocked for module scripts in some browsers, e.g. Chrome).
- **Current state:** Fully implemented. `npm test` runs both unit trees and reports 243 tests with 0 failures; `npm run verify` runs all twelve harness scripts and prints "All 12 checks passed."; the engine's own suites report 22 tests with 0 failures. Final playability is confirmed by the user. Code pushed to main; GitHub Pages site at https://Brom95.github.io/snaketris.

## Engine mount (`engine/`)

- **Home:** `engine/` inside this repo — `engine/js/` (11 modules), `engine/docs/` (`api.md`, `recipes.md`), `engine/README.md`, `engine/tests/` (3 suites: `api.test.js`, `boundary.test.js`, `engine.test.js`). It is not a git submodule yet; extracting the directory into its own repo at the same mount path changes no import line and no source file (see `engine/README.md`).
- **Split rule:** a symbol is engine-side iff it names no game noun. The engine owns mechanism only — the clock, the systems registry, the state skeleton, the grid container, the intent queue and screen navigation, the canvas/layout/interface plumbing, the device plumbing up to the event, the records write policy. The game owns every noun: rules, scoring, roles, the bot, painters, page copy, screen rows, handlers, mapping tables.
- **Boundary gate:** `engine/tests/boundary.test.js` asserts every import under `engine/js/` resolves inside `engine/`, that the four mechanism leaves (`clock.js`, `grid.js`, `state.js`, `registry.js`) import nothing at all, and that no engine source names a consumer field.
- **Consumer contract:** `engine/README.md` states what the engine guarantees, the eleven registration calls a consumer must make, and the invariants that must not break (page ids, the `.view`/`.view.on` classes, the byte-stable steering branch, intents-only navigation). `engine/docs/api.md` documents all 38 engine exports with a signature, a contract and one worked call from snaketris; `engine/docs/recipes.md` documents the five extension points (add a system, a screen row, a handler, a painter, a device mapping).
- **Constants owners:** `js/config.js` holds the parameters the engine receives at construction, `js/rules.js` the game rules, `js/copy.js` the page copy. `js/constants.js` is a re-export shim over all three, kept only so every existing `from './constants.js'` import keeps working; a consumer that knows which owner it wants may import that one directly.

## OpenSpec Setup

- Schema: `spec-driven` (see `openspec/config.yaml`).
- Open changes: `engine-submodule-split` — `openspec list` reports it "in-progress" (the explicit engine/game split captured from `/opsx-explore`; it carries the `engine-architecture` delta and the new `engine-api` capability).
- Main specs live in `openspec/specs/` (updated by `/opsx-sync` / archive): `snaketris-game`, `bot-opponent`, `start-menu`, `hud`, `highscores`, `controller`, `mobile-input`, `responsive-layout`.
- Completed changes, including `role-selection-bot-snake`, `tighten-mobile-top-space`, `static-menu-selection`, `srs-piece-rotation`, `gamepad-a-rotate` and `shared-e2e-harness`, are archived in `openspec/changes/archive/`.

### OpenSpec workflow (Qwen Code)

- Use the slash commands `/opsx-apply`, `/opsx-archive`, `/opsx-explore`, `/opsx-propose`, `/opsx-sync`, `/opsx-update` (wired to `.qwen/commands/`).
- Standard CLI: `openspec status --change "<name>" --json`, `openspec instructions apply --change "<name>" --json`, `openspec list --json`.
- When implementing, always read the context files from `openspec instructions apply` output before writing code, implement task-by-task (minimal, scoped changes), and flip the task checkbox `- [ ]` → `- [x]` immediately after each task's behavior is fully implemented.
- `openspec init` **must** run in non-interactive mode with explicit flags (e.g. `--tools qwen --no-animation`); never let it prompt.
- **Going back / expanding scope is allowed:** if during implementation it turns out extra work is needed, step back in the pipeline — update `proposal.md`/`design.md`/`spec.md` via `/opsx-update-change`, and/or add tasks to `tasks.md`. Do not work outside the pipeline or absorb scope silently.

## Working Rules (user instructions)

### MANDATORY: ripwire for ALL code interactions

Ripwire is **required** for every interaction with code. No ad-hoc grep, read, or edit bypasses it when a ripwire verb covers the operation. This is an obligation, not a preference.

- **Before reading any source file:** `analyze` (architecture map) or `batch` (up to 16 read sub-queries in one turn: `for`, `grep`, `find_symbol`, `callers`, `callees`, `uses`, `impact`, `mentions`, `exemplar`, `fetch_body`, `slice`, …).
- **Before editing a symbol:** `edit_check` (contract/arity change vs HEAD; can pass `new_body` as a pre-apply preview); `affected` — which test files the change transitively reaches.
- **Start of non-trivial work:** `quality_baseline` — pins the quality floor at git HEAD.
- **Before declaring a change DONE:** `quality_delta` — reports only what the working tree made worse vs the baseline/HEAD across 10 failure modes.
- **Before trusting a design doc or plan:** `doc_drift` — verifies checkable doc anchors (file:line refs, symbol mentions, `= N` constants) against the live index.
- Note: some ripwire commands are CLI-only (not exposed via MCP), e.g. `ripwire <dir> --rank-by=churn` and `--test-gate`.

**All code work goes through the OpenSpec pipeline** — no off-pipeline changes.
Ripwire quality tools compare against **git HEAD** → the repo must be a git repo for them to work.

## Game Mechanics (source of truth: spec.md + design.md)

- **Grid model:** One grid, every cell has an identity: empty / snake-body / edible-piece / solid-block. Logical grid is 10 columns × 20 rows (`COLS = 10`, `ROWS = 20`, `CELL = 24` → 240×480 px), CSS-scaled to the viewport.
- **Roles:** the player picks Snake or Tetris in the role sub-menu (`Play` → `SELECT_ROLE`). The bot drives the other side. The starting snake is three segments.
- **Snake:** moves on discrete steps (arrows/WASD, swipe or tap, no-reverse rule); classic growth — each eaten cell adds one segment; wrap-around at all four edges (modulo, no walls). Step interval is derived from the current piece fall speed: `max(1, 1/fallSpeed − 2)` ticks/cell — the snake is always strictly faster than a falling piece vertically (23 ticks/cell at base, 1 tick/cell at the 0.9 cap).
- **Pieces:** the seven classic tetrominoes (I, O, T, S, Z, L, J) spawn at the top and fall; **edible while falling**, **solid obstacle once landed** (touches bottom or rests on other pieces). **Sequential spawn:** at most one piece is falling at a time — the next spawns only after the previous one has landed or been fully eaten. Falling is continuous, snaps to the grid only on landing.
- **Piece control:** the side that controls the piece (the player in Tetris role, the bot otherwise) can shift it one cell sideways or rotate it. A sideways shift is throttled to one cell per snake step (`game.pieceMoveAcc` gate, shared by player and bot). Rotation follows the Super Rotation System: every tetromino has four rotation states, and a turn tries the five SRS wall-kick offsets in order, applying the first that keeps the piece inside the board and clear of solid blocks; if none fits, the turn is ignored. A rotation never interrupts the fall.
- **Scoring:** two side scores. Snake: **+1 per eaten cell**, **+4 bonus** when a whole piece is eaten. Tetris: **+1 per landed cell**, **+10 per cleared row**. The high-score entry stores the score of the side the player played; the HUD shows both scores and never the role name.
- **Difficulty ramp:** every **5 landed blocks**, fall speed ticks up one step (×1.08): base **0.04 cells/tick**, cap **0.9 cells/tick**.
- **Death:** snake head overlaps own body, or touches a solid (landed) block → game over. Wrap-around is applied *before* the collision test. A piece that lands with no cell inside the grid (top-out) also ends the game.
- **State machine:** explicit enum `MENU | SELECT_ROLE | PLAYING | GAME_OVER | RECORDS | HELP`; input gated by state; game-over status offers a return to the menu (R / click) — single reset routine re-seeds pieces and snake, resets both scores to 0.
- **Rendering:** `<canvas>` with `requestAnimationFrame`; fixed-timestep update decoupled from render (so the game pauses cleanly when the tab is hidden).

## Building and Running

- **Run:** no build step — `snaketris.html` loads `js/app.js` via `<script type="module" src="js/app.js">`; serve over HTTP (published site https://Brom95.github.io/snaketris, or a local static server). `file://` double-click is blocked for module scripts in some browsers (Chrome).
- **Testing:** three trees, one command each. `npm test` runs `node --test "tests/**/*.test.js" "engine/tests/**/*.test.js"` (243 tests, 0 failures — 221 game checks plus 22 engine checks); `npm run verify` runs `scripts/verify-all.mjs`, which runs all twelve harness scripts one after another and prints every exit code. `scripts/harness.mjs` is the shared layer: `check`, `report`, `stubDom`, `servePage`, `waitFor`, `shown`, `snapshot`, plus the Playwright helpers (`freshPage`, `playRole`, `stateIs`, `boxesAtEverySelection`, …). `tests/helpers/dom-stub.js` stays separate: unit tests need a seeded LCG RNG (seed 20240601) for determinism. Playwright scripts serve the repo over `http://duel.test/` through `page.route`, so no local server is needed. Final playability is confirmed by the user against the per-task "verify" clauses in `tasks.md`. Ripwire's `quality_delta` (structure) and CLI `--test-gate` form the pre-PR self-check.

## Development Conventions

- `snaketris.html` is the sole HTML entry; all game code lives in `js/` ES modules with one-way imports and `js/app.js` as the single entry; the engine lives in `engine/js/` and imports nothing from `js/`. Keep the palette in `js/copy.js`, the 7 tetromino definitions in `js/rules.js`, and the parameters the engine receives at construction in `js/config.js`; `js/constants.js` is a re-export shim over the three and stays only so existing imports keep working.
- Vanilla JS only — no framework, no external assets, no backend, no persistence, no sound, no multiple players.
- Keep changes minimal and scoped per task; mark tasks only when the specified behavior is fully implemented, not partially done.
- Do not silently absorb scope beyond the spec; if a task needs more than the spec describes, surface it and route it through the pipeline (opsx-update / add tasks) — per user instructions, stepping back or adding work is allowed.
- Use the OpenSpec workflow for all spec-related work: propose → explore → apply → sync → archive.

## Reference

- https://accessiblegamedesign.com/guidelines/menus.html → cached at reference/menus.md (2026-10-12)
