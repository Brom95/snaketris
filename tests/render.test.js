import test from 'node:test';
import assert from 'node:assert/strict';
import { installDomStub } from './helpers/dom-stub.js';

const stub = installDomStub();
const state = await import('../js/state.js');
const render = await import('../js/render.js');
const C = await import('../js/constants.js');

// Table-driven: at every overflow 0..22 the head is green, the body is grey
// until overflow reaches its index, then blue, purple and gold — gold past
// the last tier. Seven body segments (indices 1..7) are checked each step.
test('bodyColor over overflow 0..22', () => {
  const TIERS = [C.COLORS.tierBlue, C.COLORS.tierPurple, C.COLORS.tierGold];
  for (let o = 0; o <= 22; o += 1) {
    state.game.overflow = o;
    assert.equal(render.bodyColor(0), C.COLORS.snakeHead);
    for (let i = 1; i < 8; i += 1) {
      if (o < i) {
        assert.equal(render.bodyColor(i), C.COLORS.snakeBody, `overflow=${o} index=${i}`);
      } else {
        const tier = Math.min(2, Math.floor((o - i) / C.TIER_WIDTH));
        assert.equal(render.bodyColor(i), TIERS[tier], `overflow=${o} index=${i}`);
      }
    }
  }
});
