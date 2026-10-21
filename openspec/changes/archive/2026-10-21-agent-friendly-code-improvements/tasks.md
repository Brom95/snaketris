# Tasks

## 1. Add JSDoc Documentation

- [x] 1.1 Add JSDoc to `noteOwnPort`, `craftPeerCandidate`, `learnPeerAnnouncement` in `js/netplay.js` with input/output contracts and verify all 321 tests still pass
- [x] 1.2 Add JSDoc to `init`, `buildChannel`, `createTransport` in `js/app.js` and verify tests pass
- [x] 1.3 Add JSDoc to `createEngine`, `advanceTick` in `engine/js/registry.js` and verify engine tests pass

## 2. Add Module Summary Comments

- [x] 2.1 Add module summary comment at top of `js/netplay.js` describing responsibilities and imports/exports
- [x] 2.2 Add module summary comment at top of `js/app.js` describing wiring responsibilities
- [x] 2.3 Add module summary comment at top of `js/input.js`, `js/render.js`, `js/ui.js`

## 3. Rename Ambiguous Variables

- [x] 3.1 Rename `pc` → `peerConnection` in `js/netplay.js` and verify all references updated (use ripwire `find_referencing_symbols`)
- [x] 3.2 Rename `link` → `pairLink` in `js/netplay.js` where it refers to pairing links
- [x] 3.3 Rename `ctx` → `engineContext` in `engine/js/registry.js` and verify engine tests pass

## 4. Refactor `receive()` Function

- [x] 4.1 Extract named handler functions from `receive()` in `js/netplay.js` (e.g., `handlePeerAddress`, `handleAnswer`, `handleFrame`)
- [x] 4.2 Replace switch-like logic in `receive()` with `messageHandlers` object dispatch
- [x] 4.3 Verify all network-related tests pass after refactoring

## 5. Create Architecture Documentation

- [x] 5.1 Create `docs/architecture.md` with module map (engine/ vs js/), key exports/imports, and data flow overview
- [x] 5.2 Document the two network flows (global vs local) and their key invariants
- [x] 5.3 Verify the architecture doc references correct file paths and module names

## 6. Add "Why" Comments

- [x] 6.1 Add inline "why" comments for non-obvious logic in `js/netplay.js` (e.g., fallback to `m=` line in `noteOwnPort`)
- [x] 6.2 Add "why" comments for critical invariants in `engine/README.md` references

## 7. Verification

- [x] 7.1 Run `node --test tests/netplay.test.js` to verify netplay tests pass (7/7)
- [x] 7.2 Run `npm test` to verify all 321 tests pass (321/321, 0 fail)
- [x] 7.3 Run `node --test engine/tests/boundary.test.js` to verify engine boundary constraints still hold (3/3)

## Workflow follow-up

- Archive the change after review requirements are satisfied
- Verify the archived result
