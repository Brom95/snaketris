# QWEN.md — snaketris

## Project Overview

**snaketris** is a greenfield single-page HTML5 game: a Snake/Tetris hybrid where the player pilots a snake that eats falling Tetris pieces before they land. Once a piece touches the bottom or stacks on others it stops being edible and becomes a solid obstacle.

- **Tech stack:** One self-contained `snaketris.html` file — inline `<script>`, vanilla JS only, no framework, no backend, no external dependencies, no build step.
- **Current state:** No source code yet. The project is set up with **OpenSpec** (spec-driven schema). An active change `snaketris-game` exists with a complete proposal, design, spec delta, and a 9-task task list — all tasks currently **unchecked**. The first implementation task is to create `snaketris.html`.

## OpenSpec Setup

- Schema: `spec-driven` (see `openspec/config.yaml`).
- Active change: `openspec/changes/snaketris-game/`
  - `proposal.md` — why/what
  - `design.md` — grid model, canvas/rAF loop, state machine, difficulty ramp, death detection
  - `specs/snaketris-game/spec.md` — requirements (snake movement/growth, wrap-around, death conditions, falling tetrominoes, edible-while-falling, cell-by-cell scoring, difficulty ramp, restart)
  - `tasks.md` — 9 numbered tasks (scaffold → grid model → snake → wrap → pieces → eating/scoring → death → ramp → score/restart)
- Main specs live in `openspec/specs/` (empty `.gitkeep` until sync/archive).
- Archived changes land in `openspec/changes/archive/`.

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

- **Grid model:** One grid, every cell has an identity: empty / snake-body / edible-piece / solid-block. Logical grid ~24×30 scaled to CSS pixels.
- **Snake:** moves on discrete steps (arrows/WASD, no-reverse rule); classic growth — each eaten cell adds one segment; wrap-around at all four edges (modulo, no walls).
- **Pieces:** the seven classic tetrominoes (I, O, T, S, Z, L, J) spawn at the top and fall; **edible while falling**, **solid obstacle once landed** (touches bottom or rests on other pieces). Falling is continuous, snaps to the grid only on landing.
- **Eating/scoring:** cell-by-cell; exactly **+1 score per cell consumed**; running total displayed on the canvas.
- **Difficulty ramp:** every **2 landed blocks**, fall speed ticks up one step (small multiplier on piece fall velocity).
- **Death:** snake head overlaps own body, or touches a solid (landed) block → game over. Wrap-around is applied *before* the collision test.
- **State machine:** explicit enum `IDLE | PLAYING | GAME_OVER`; input gated by state; game-over overlay offers restart from scratch (R / click) — single reset routine re-seeds pieces and snake, resets score to 0.
- **Rendering:** `<canvas>` with `requestAnimationFrame`; fixed-timestep update decoupled from render (so the game pauses cleanly when the tab is hidden).

## Building and Running

- **Run:** no build step — open `snaketris.html` directly in any browser. (TODO: file does not exist yet; created by task 1.1.)
- **Testing:** no test framework; verification is manual in-browser against the per-task "verify" clauses in `tasks.md`. Ripwire's `quality_delta` (structure) and CLI `--test-gate` form the pre-PR self-check.

## Development Conventions

- One self-contained HTML file; keep the palette and the 7 tetromino definitions as small constants.
- Vanilla JS only — no framework, no external assets, no backend, no persistence, no sound, no multiple players.
- Keep changes minimal and scoped per task; mark tasks only when the specified behavior is fully implemented, not partially done.
- Do not silently absorb scope beyond the spec; if a task needs more than the spec describes, surface it and route it through the pipeline (opsx-update / add tasks) — per user instructions, stepping back or adding work is allowed.
- Use the OpenSpec workflow for all spec-related work: propose → explore → apply → sync → archive.
