# Design

## Context

The snaketris codebase has 127 JS files across engine/ and js/ directories. The engine is self-contained (no consumer imports), while the consumer layer wires everything together. Key pain points identified during code review:

- `js/netplay.js` contains ~200 lines of complex WebRTC logic with ambiguous variable names
- Many functions lack JSDoc documentation
- Module boundaries are implicit rather than explicit
- The `receive()` function in `netplay.js` handles 10+ message types in a single large function

## Goals / Non-Goals

**Goals:**
- Improve code readability for AI agents and human developers
- Add documentation contracts (JSDoc) to key functions
- Clarify module responsibilities with explicit summary comments
- Reduce cognitive load by breaking down complex functions
- Create architectural documentation for future reference

**Non-Goals:**
- No behavioral changes - all changes are cosmetic/structural
- No new features or functionality
- No performance optimizations
- No refactoring of core game logic (snake, pieces, bot, etc.)

## Decisions

### Decision 1: JSDoc over inline comments
**Choice**: Add JSDoc comments to function signatures rather than inline comments.
**Rationale**: JSDoc is machine-readable, provides auto-completion support, and clearly documents contracts. Inline comments are better for "why" explanations.
**Alternative**: Only inline comments - rejected because JSDoc provides better tooling support.

### Decision 2: Named message handlers for `receive()`
**Choice**: Refactor `receive()` in `netplay.js` from a large switch-like function into a `messageHandlers` object with named handlers.
**Rationale**: Improves discoverability - each handler is a named function that can be independently understood. Makes it easier for agents to find relevant code.
**Alternative**: Keep as switch statement - rejected because it's hard to scan and understand at a glance.

### Decision 3: Variable renaming in critical paths
**Choice**: Rename `pc` → `peerConnection`, `link` → `pairLink`, `ctx` → `engineContext` in `js/netplay.js` and `js/app.js`.
**Rationale**: Makes code self-documenting. `pc` could mean "page", "player", "process" - ambiguous. `peerConnection` is explicit.
**Alternative**: Add comments explaining abbreviations - rejected because renaming is clearer and doesn't require readers to decode abbreviations.

### Decision 4: Architecture documentation
**Choice**: Create `docs/architecture.md` with module map, data flow, and key decisions.
**Rationale**: Provides a high-level overview that helps agents understand the codebase structure before diving into specific files.
**Alternative**: Rely on existing engine README - rejected because it doesn't cover the consumer layer (`js/`) in detail.

## Risks / Trade-offs

[Risk] Renaming variables could break references if not done carefully.
→ Mitigation: Use ripwire `find_referencing_symbols` to ensure all usages are updated.

[Risk] JSDoc comments could become outdated if code changes.
→ Mitigation: This is a one-time improvement; future changes should follow the same documentation pattern.

[Risk] Refactoring `receive()` could introduce subtle bugs.
→ Mitigation: All 321 tests should pass; add integration tests if new handler functions are added.

## Open Questions

- Should JSDoc be added to all engine files or just the most complex ones? (Decision: Focus on `netplay.js`, `app.js`, `registry.js` first)
- Should the architecture doc include diagrams? (Decision: Text-based module map is sufficient for now)
