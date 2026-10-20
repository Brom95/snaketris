# Design: one network way in the spec

## Why so little

The code is where it should be. Only the capability spec contradicts it, and a
contradicting spec is what makes the next change wrong rather than the code.

## Decisions

1. **Restate rather than delete where the rule still holds.** "The same-network
   pair carries one line by hand" and "The network way is offered on a narrow
   viewport" describe behavior the shipped code still has; only their wording
   names a flow. They are modified in place, with their scenarios kept.
2. **Replace where the subject is gone.** A pairing whose secret carries a
   candidate supply, and a two-player entry that offers two network flows, no
   longer describe anything in the game: they are removed and restated as one
   requirement each in the one-way vocabulary.
3. **Nothing here claims a join the harness cannot measure.** The
   replacement requirement stops at what the pages do; joining across a real
   network stays a player report, as it has been.
