# Proposal

## Why

The snaketris codebase, while functionally correct, lacks documentation and structural clarity that would make it easier for AI agents (and human developers) to understand, modify, and extend. Key functions lack JSDoc contracts, module boundaries are implicit, and complex functions like `receive()` in `netplay.js` are hard to follow. This change improves code readability, maintainability, and agent-comprehensibility without changing behavior.

## What Changes

- Add JSDoc comments to key functions in `js/netplay.js`, `js/app.js`, and `engine/js/registry.js` documenting inputs, outputs, and side effects
- Add module summary comments at the top of each major file (`js/*.js`) describing responsibility and imports/exports
- Rename ambiguous variables (`pc` → `peerConnection`, `link` → `pairLink`, `ctx` → `engineContext`) in critical paths
- Refactor `receive()` in `netplay.js` from a large switch-like function into named message handlers
- Create `docs/architecture.md` documenting module map, data flow, and key architectural decisions
- Add inline "why" comments (not "what" comments) for non-obvious logic

## Capabilities

### New Capabilities
- `agent-friendly-code`: Documentation and structural improvements to make the codebase more understandable for AI agents and human developers

### Modified Capabilities
<!-- No spec-level behavior changes - this is a pure refactor/documentation change -->

## Impact

- **Affected code**: `js/netplay.js`, `js/app.js`, `js/input.js`, `js/render.js`, `engine/js/registry.js`, `engine/js/navigation.js`
- **New files**: `docs/architecture.md`
- **No breaking changes**: All changes are cosmetic/structural; behavior remains identical
- **Tests**: All 321 tests should continue to pass
