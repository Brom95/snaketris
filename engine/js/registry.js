// Engine registry: the ordered systems list and the tick it owns.
// A system is a plain object { name, init?, update?, endTick? }. init(ctx)
// runs once at load; update(ctx) runs once per tick in declared order;
// endTick(ctx) runs after every update, in declared order, so a system can
// claim work that must see the finished tick.
//
// The engine owns the tick slot: it advances ctx.state.play.tick before the
// first system runs, so no entry point increments it and no system has to.
export function createEngine(systems) {
  return {
    init(ctx) {
      for (const s of systems) s.init?.(ctx);
    },
    update(ctx) {
      advanceTick(ctx);
      for (const s of systems) s.update?.(ctx);
    },
    endTick(ctx) {
      for (const s of systems) s.endTick?.(ctx);
    },
  };
}

function advanceTick(ctx) {
  const play = ctx.state?.play;
  if (!play) return;
  play.tick = (play.tick ?? 0) + 1;
}
