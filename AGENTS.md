# Project instructions — ripwire MCP

This repo is configured with the **ripwire** MCP server (global, `C:\Users\wasal\.config\opencode\opencode.jsonc` → `mcp.servers.ripwire`, stdio, cached at `C:/Users/wasal/AppData/Local/Temp/opencode/ripwire`). **Use ripwire for any work with code** — navigation, symbol lookup, contract checks, and edits — instead of ad-hoc grepping/reading when a ripwire verb fits.

## Navigation (before reading or editing)
- `tools.ripwire.batch` — one sweep for several read verbs: `analyze` (architecture map), `find_symbol` (handle + line), `uses`/`called_by` (1-hop edges), `lego` (impls of an interface/base).
- `tools.ripwire.fetch_body` — full definition of a symbol by handle; fetch bodies only for symbols you are actually touching.
- `tools.ripwire.from_trace` — land on an error/stack; `tools.ripwire.impact` + `uses` — blast radius before changing a symbol.

## Edits
Prefer ripwire's edit verbs for symbol-level changes; their receipts auto-run `edit_check`:
- `replace_symbol_body` — replace a symbol's ENTIRE definition (signature through closing brace).
- `insert_after_symbol` / `insert_before_symbol` — splice a new definition next to an existing one.

Rules:
1. `new_body` must be a complete, well-formed definition.
2. For **exported** symbols, do **NOT** include the leading `export` keyword — the span starts at the `function`/`class` keyword and the preceding `export` is preserved; including it produces a double `export`.
3. If a receipt reports `stale_index` (or the call refuses with a stale index), call a read verb on the same file first (`find_symbol`/`fetch_body`/`analyze`) and retry.
4. Plain `edit`/`write` remain for non-symbol content: import lines, constant blocks, HTML/JSONC config.

## Safety checks
- `edit_check` — contract diff (param count + publicness) plus 1-hop callers that are now arity-incompatible; run before changing a signature.
- `quality_delta` — the PR self-check; **run it before declaring any change done** (pairs with the git HEAD baseline).
- `edit_check`'s caller list is a starting point, not a proof — verify flagged call sites by opening them.

## Project notes (snaketris)
- Vanilla ES modules, no build step: `index.html` loads `js/app.js`; all `js/*.js` are ESM.
- Logical board is 576×720 px (`COLS=24`, `ROWS=30`, `CELL=24` in `js/constants.js`); the canvas buffer is never resized, only CSS-scaled.
- Layout constants in `js/constants.js` are the single source of truth shared by `render.js` (drawing) and `input.js` (pointer hit-testing).
- `js/input.js` `setDirection` is the shared steering path (PLAYING gate + no-reverse rule); keep the in-game steering branch byte-for-byte stable when adding branches for other states.
