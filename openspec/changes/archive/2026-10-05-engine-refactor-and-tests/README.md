# engine-refactor-and-tests

Refactor game logic into an engine-manner (js/engine.js clock + ordered systems registry, uniform {init,update} module surface, input split into devices vs flow) and replace the monolithic headless harness with a per-module node:test suite under tests/, plus a snakatris-test local skill.
