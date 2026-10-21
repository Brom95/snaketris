// Engine registry: the ordered systems list and the tick it owns.
// A system is a plain object { name, init?, update?, endTick? }. init(ctx)
// runs once at load; update(ctx) runs once per tick in declared order;
// endTick(ctx) runs after every update, in declared order, so a system can
// claim work that must see the finished tick.
//
// The engine owns the tick slot: it advances ctx.state.play.tick before the
// first system runs, so no entry point increments it and no system has to.
export /**
 * Create the game engine with a list of systems.
 * @param {Array<Object>} systems - Ordered list of system objects with init/update/endTick methods.
 * @returns {Object} Engine object with init(ctx), update(ctx), endTick(ctx) methods.
 * 
 * Systems run in declared order: init runs once at load, update runs once per tick,
 * endTick runs after every other system in that tick.
 */
function createEngine(systems) {
  return {
    init(engineContext) {
      for (const s of systems) s.init?.(engineContext);
    },
    update(engineContext) {
      advanceTick(engineContext);
      for (const s of systems) s.update?.(engineContext);
    },
    endTick(engineContext) {
      for (const s of systems) s.endTick?.(engineContext);
    },
  };
}

/**
 * Advance the game tick counter in the play state.
 * @param {Object} ctx - The engine context containing state.
 * 
 * Increments play.tick by 1 if play state exists.
 */
function advanceTick(engineContext) {
  const play = engineContext.state?.play;
  if (!play) return;
  play.tick = (play.tick ?? 0) + 1;
}
