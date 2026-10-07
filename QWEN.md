# QWEN.md — snaketris

## Project Overview

**snaketris** is a single-page HTML5 game: a Snake/Tetris duel. Before each game the player chooses a role — Snake or Tetris. A bot drives the side the player did not choose. A falling piece is edible while it moves; once it touches the bottom or rests on other pieces it stops being edible and becomes a solid obstacle. The higher side score wins.

- **Tech stack:** `snaketris.html` + `js/` ES modules (`constants.js`, `grid.js`, `state.js`, `engine.js`, `pieces.js`, `snake.js`, `bot.js`, `devices.js`, `input.js`, `ui.js`, `render.js`, `highscores.js`, `app.js`) + `package.json` (`"type": "module"`); vanilla JS only, no framework, no backend, no external dependencies, no build step. `snaketris.html` loads a single `<script type="module" src="js/app.js">` and is served over HTTP (primary target: GitHub Pages; `file://` double-click is blocked for module scripts in some browsers, e.g. Chrome).
- **Current state:** Fully implemented. Change `role-selection-bot-snake` (40 tasks) is complete and awaits sync/archive. Unit tests live in `tests/` and run with `node --test "tests/**/*.test.js"` (106 checks). The headless Playwright check `scripts/verify-role-duel.mjs` drives the real page; final playability is confirmed by the user. Code pushed to main; GitHub Pages site at https://Brom95.github.io/snaketris.

## OpenSpec Setup

- Schema: `spec-driven` (see `openspec/config.yaml`).
- Active change: `openspec/changes/role-selection-bot-snake/`
  - `proposal.md` — why/what
  - `design.md` — role selection, bot policies, shared piece-shift throttle, side scoring
  - `specs/` — `snaketris-game`, `bot-opponent`, `start-menu`, `hud`, `highscores`, `controller`, `mobile-input`
  - `tasks.md` — 40 numbered tasks (state/constants → role sub-menu → piece control → bot snake policy → bot piece policy → scoring/HUD → records → help/docs → integration verification)
- Main specs live in `openspec/specs/` (updated by `/opsx-sync` / archive).
- Changes `snaketris-game` and `sequential-pieces-code-extraction` are archived in `openspec/changes/archive/`.

### OpenSpec workflow (Qwen Code)

- Use the slash commands `/opsx-apply`, `/opsx-archive`, `/opsx-explore`, `/opsx-propose`, `/opsx-sync`, `/opsx-update` (wired to `.qwen/commands/`).
- Standard CLI: `openspec status --change "<name>" --json`, `openspec instructions apply --change "<name>" --json`, `openspec list --json`.
- When implementing, always read the context files from `openspec instructions apply` output before writing code, implement task-by-task (minimal, scoped changes), and flip the task checkbox `- [ ]` → `- [x]` immediately after each task's behavior is fully implemented.
- `openspec init` **must** run in non-interactive mode with explicit flags (e.g. `--tools qwen --no-animation`); never let it prompt.
- **Going back / expanding scope is allowed:** if during implementation it turns out extra work is needed, step back in the pipeline — update `proposal.md`/`design.md`/`spec.md` via `/opsx-update-change`, and/or add tasks to `tasks.md`. Do not work outside the pipeline or absorb scope silently.

## Working Rules (user instructions)

- **Ripwire MCP — actively used for all code work** (tools `mcp__ripwire__*`):
  - Start of non-trivial work: `quality_baseline` — pins the quality floor at git HEAD.
  - Orientation before reading files: `analyze` (architecture map / call graph) or `batch` (up to 16 read sub-queries in one turn: `for`, `grep`, `find_symbol`, `callers`, `callees`, `uses`, `impact`, `mentions`, `exemplar`, `fetch_body`, `slice`, …).
  - Before editing a symbol: `edit_check` (contract/arity change vs HEAD; can pass `new_body` as a pre-apply preview); `affected` — which test files the change transitively reaches.
  - Before declaring a change DONE: `quality_delta` — reports only what the working tree made worse vs the baseline/HEAD across 10 failure modes.
  - Before trusting a design doc or plan: `doc_drift` — verifies checkable doc anchors (file:line refs, symbol mentions, `= N` constants) against the live index.
  - Note: some ripwire commands are CLI-only (not exposed via MCP), e.g. `ripwire <dir> --rank-by=churn` and `--test-gate`.
- **All code work goes through the OpenSpec pipeline** — no off-pipeline changes.
- Ripwire quality tools compare against **git HEAD** → the repo must be a git repo for them to work.

## Game Mechanics (source of truth: spec.md + design.md)

- **Grid model:** One grid, every cell has an identity: empty / snake-body / edible-piece / solid-block. Logical grid is 10 columns × 20 rows (`COLS = 10`, `ROWS = 20`, `CELL = 24` → 240×480 px), CSS-scaled to the viewport.
- **Roles:** the player picks Snake or Tetris in the role sub-menu (`Play` → `SELECT_ROLE`). The bot drives the other side. The starting snake is three segments.
- **Snake:** moves on discrete steps (arrows/WASD, swipe or tap, no-reverse rule); classic growth — each eaten cell adds one segment; wrap-around at all four edges (modulo, no walls). Step interval is derived from the current piece fall speed: `max(1, 1/fallSpeed − 2)` ticks/cell — the snake is always strictly faster than a falling piece vertically (23 ticks/cell at base, 1 tick/cell at the 0.9 cap).
- **Pieces:** the seven classic tetrominoes (I, O, T, S, Z, L, J) spawn at the top and fall; **edible while falling**, **solid obstacle once landed** (touches bottom or rests on other pieces). **Sequential spawn:** at most one piece is falling at a time — the next spawns only after the previous one has landed or been fully eaten. Falling is continuous, snaps to the grid only on landing.
- **Piece control:** the side that controls the piece (the player in Tetris role, the bot otherwise) can shift it one cell sideways or rotate it. A sideways shift is throttled to one cell per snake step (`game.pieceMoveAcc` gate, shared by player and bot). A rotation that leaves the board sideways or overlaps a solid block is ignored.
- **Scoring:** two side scores. Snake: **+1 per eaten cell**, **+4 bonus** when a whole piece is eaten. Tetris: **+1 per landed cell**, **+10 per cleared row**. The high-score entry stores the score of the side the player played; the HUD shows both scores and never the role name.
- **Difficulty ramp:** every **5 landed blocks**, fall speed ticks up one step (×1.08): base **0.04 cells/tick**, cap **0.9 cells/tick**.
- **Death:** snake head overlaps own body, or touches a solid (landed) block → game over. Wrap-around is applied *before* the collision test. A piece that lands with no cell inside the grid (top-out) also ends the game.
- **State machine:** explicit enum `MENU | SELECT_ROLE | PLAYING | GAME_OVER | RECORDS | HELP`; input gated by state; game-over status offers a return to the menu (R / click) — single reset routine re-seeds pieces and snake, resets both scores to 0.
- **Rendering:** `<canvas>` with `requestAnimationFrame`; fixed-timestep update decoupled from render (so the game pauses cleanly when the tab is hidden).

## Building and Running

- **Run:** no build step — `snaketris.html` loads `js/app.js` via `<script type="module" src="js/app.js">`; serve over HTTP (published site https://Brom95.github.io/snaketris, or a local static server). `file://` double-click is blocked for module scripts in some browsers (Chrome).
- **Testing:** `node:test` only — `node --test "tests/**/*.test.js"` (106 checks). `tests/helpers/dom-stub.js` supplies the stubbed DOM, canvas, `localStorage` and gamepad, plus a seeded LCG RNG (seed 20240601) so the suite is deterministic. `scripts/verify-role-duel.mjs` and `scripts/verify-views.mjs` drive the real page headless with Playwright (the repo is served over `http://duel.test/` through `page.route`, so no local server is needed). Final playability is confirmed by the user against the per-task "verify" clauses in `tasks.md`. Ripwire's `quality_delta` (structure) and CLI `--test-gate` form the pre-PR self-check.

## Development Conventions

- `snaketris.html` is the sole HTML entry; all game code lives in `js/` ES modules with one-way imports and `js/app.js` as the single entry; keep the palette and the 7 tetromino definitions as small constants in `js/constants.js`.
- Vanilla JS only — no framework, no external assets, no backend, no persistence, no sound, no multiple players.
- Keep changes minimal and scoped per task; mark tasks only when the specified behavior is fully implemented, not partially done.
- Do not silently absorb scope beyond the spec; if a task needs more than the spec describes, surface it and route it through the pipeline (opsx-update / add tasks) — per user instructions, stepping back or adding work is allowed.
- Use the OpenSpec workflow for all spec-related work: propose → explore → apply → sync → archive.
