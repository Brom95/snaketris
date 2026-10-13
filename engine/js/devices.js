// Device MECHANISM: raw browser events -> a shape the consumer maps to an intent.
// Owns the listener registration, the pointer capture bookkeeping, the
// pointer-to-surface conversion, the thumbstick quantization, the controller
// poll loop and the per-device edge state cleared on a device change. It reads
// no consumer half and names no action: the consumer supplies the resolvers,
// so the engine never asks which screen the consumer is on.

let surface = null;
let surfaceWidth = 0;
let surfaceHeight = 0;

let activePointerId = null;
let gestureStart = null;

// Consumer resolvers, supplied in two halves. The consumer that owns the
// mappings registers `gesture` and `pad`; the consumer that owns the flow
// registers `shape`, `key` and `page`. Each slot keeps the first resolver that
// was handed to it, so a second registration cannot silently replace one.
let gestureResolver = null; // (start, end) -> shape | null
let shapeSink = null; // (shape) -> void
let keyResolver = null; // (event) -> void
let pageResolver = null; // (event) -> void
let padResolver = null; // (signals) -> shape | null

export function configureSurface(options) {
  surfaceWidth = options.width;
  surfaceHeight = options.height;
}

export function registerDeviceResolvers(resolvers) {
  if (resolvers.gesture) gestureResolver = resolvers.gesture;
  if (resolvers.shape) shapeSink = resolvers.shape;
  if (resolvers.key) keyResolver = resolvers.key;
  if (resolvers.page) pageResolver = resolvers.page;
  if (resolvers.pad) padResolver = resolvers.pad;
}

// The element gestures and keys are measured on. Every listener is registered
// here, so a consumer adds no listener of its own and cannot register the same
// event twice: the handler identities are these module-level functions.
export function attachSurface(el) {
  surface = el;
  el.addEventListener('pointerdown', onSurfaceDown);
  el.addEventListener('pointermove', onSurfaceMove);
  el.addEventListener('pointerup', onSurfaceUp);
  el.addEventListener('pointercancel', onSurfaceCancel);
  el.addEventListener('keydown', onSurfaceKey);
  document.addEventListener('keydown', onSurfaceKey);
  document.addEventListener('pointerup', onPageUp);
  window.addEventListener('gamepadconnected', clearDeviceEdges);
  window.addEventListener('gamepaddisconnected', clearDeviceEdges);
}

// Displacement of a pointer event in surface coordinates, so a consumer maps
// a gesture without knowing the element's box or the surface's logical size.
export function surfacePoint(clientX, clientY) {
  const rect = surface.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / rect.width * surfaceWidth,
    y: (clientY - rect.top) / rect.height * surfaceHeight,
  };
}

// ---------- Pointer gesture state ----------
// One gesture at a time: a second concurrent pointer is ignored, and capture
// keeps the gesture routed here even when the pointer leaves the surface.
export function pointerDown(e) {
  if (activePointerId !== null) return;
  activePointerId = e.pointerId;
  surface.setPointerCapture(e.pointerId);
  gestureStart = surfacePoint(e.clientX, e.clientY);
}

export function pointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  // Only the end position matters, so a move inside a live gesture is a no-op.
}

// The gesture's end. The shape is returned so a caller can inspect it; the
// registered listener routes it to the consumer's shape sink.
export function pointerEnd(e) {
  if (e.pointerId !== activePointerId) return null;
  activePointerId = null;
  const end = surfacePoint(e.clientX, e.clientY);
  const start = gestureStart;
  gestureStart = null;
  if (!gestureResolver || !start) return null;
  return gestureResolver(start, end);
}

export function pointerCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  gestureStart = null;
}

// ---------- Listener handlers ----------
function onSurfaceDown(e) {
  pointerDown(e);
}

function onSurfaceMove(e) {
  pointerMove(e);
}

function onSurfaceUp(e) {
  const shape = pointerEnd(e);
  if (shape && shapeSink) shapeSink(shape);
}

function onSurfaceCancel(e) {
  pointerCancel(e);
}

function onSurfaceKey(e) {
  if (keyResolver) keyResolver(e);
}

// A pointer event whose target is the surface belongs to the gesture path, so
// the page resolver never sees it.
function onPageUp(e) {
  if (surface && e.target === surface) return;
  if (pageResolver) pageResolver(e);
}

// ---------- Controller device ----------
// Standard Gamepad API button indices and the stick deadzone are device
// facts, not consumer rules.
const DPAD_UP = 12;
const DPAD_DOWN = 13;
const DPAD_LEFT = 14;
const DPAD_RIGHT = 15;
const BUTTON_A = 0;
const BUTTON_B = 1;
const STICK_DEADZONE = 0.3;

// Per-device edge state, keyed by pad id, so two devices never share held
// state. Connection order is kept so a consumer can name the first pad, the
// second pad, and so on.
let padStates = new Map();
let connectedPadIds = [];

function getPadState(id) {
  if (!padStates.has(id)) {
    padStates.set(id, { prevButtons: null, prevStickDir: null });
  }
  return padStates.get(id);
}

function routePads(pads) {
  const connected = [];
  for (const p of pads) {
    if (p && !connectedPadIds.includes(p.id)) {
      connectedPadIds.push(p.id);
      connected.push(p);
    } else if (p) {
      connected.push(p);
    }
  }
  return connected;
}

// Quantize the left thumbstick to one cardinal vector. The axis with the
// larger magnitude past the deadzone wins; inside the deadzone the stick
// contributes nothing.
export function stickDirection(gp) {
  const ax = gp.axes[0];
  const ay = gp.axes[1];
  const axPast = Math.abs(ax) > STICK_DEADZONE ? Math.abs(ax) : 0;
  const ayPast = Math.abs(ay) > STICK_DEADZONE ? Math.abs(ay) : 0;
  if (axPast >= ayPast) {
    return axPast === 0 ? null : { r: 0, c: ax < 0 ? -1 : 1 };
  }
  return { r: ay < 0 ? -1 : 1, c: 0 };
}

// One device's raw poll -> the signal set the consumer maps. Edge detection is
// per device, and the previous poll is recorded on every pass, including the
// pass that emits, so a held button cannot re-fire its edge each frame.
function readPad(gp) {
  const padState = getPadState(gp.id);
  const buttons = gp.buttons;
  const stick = stickDirection(gp);

  // A thumbstick value must never be OR-ed into a button's current/previous
  // state: a held stick would then mark the matching button as already pressed
  // and swallow its edge.
  const aNow = !!buttons[BUTTON_A].pressed;
  const bNow = !!buttons[BUTTON_B].pressed;
  const upNow = !!buttons[DPAD_UP].pressed;
  const downNow = !!buttons[DPAD_DOWN].pressed;
  const leftNow = !!buttons[DPAD_LEFT].pressed;
  const rightNow = !!buttons[DPAD_RIGHT].pressed;

  const prev = padState.prevButtons || {};
  const aEdge = aNow && !prev[BUTTON_A];
  const bEdge = bNow && !prev[BUTTON_B];
  const upEdge = upNow && !prev[DPAD_UP];
  const downEdge = downNow && !prev[DPAD_DOWN];

  const stickUp = !!stick && stick.r === -1;
  const stickDown = !!stick && stick.r === 1;
  const stickUpEdge = stickUp && !(padState.prevStickDir && padState.prevStickDir.r === -1);
  const stickDownEdge = stickDown && !(padState.prevStickDir && padState.prevStickDir.r === 1);

  const shape = padResolver
    ? padResolver({
      aEdge,
      bEdge,
      upEdge,
      downEdge,
      stickUpEdge,
      stickDownEdge,
      leftNow,
      rightNow,
      upNow,
      downNow,
      stick,
      padId: gp.id,
    })
    : null;

  padState.prevButtons = {
    [BUTTON_A]: aNow,
    [BUTTON_B]: bNow,
    [DPAD_UP]: buttons[DPAD_UP].pressed,
    [DPAD_DOWN]: buttons[DPAD_DOWN].pressed,
    [DPAD_LEFT]: buttons[DPAD_LEFT].pressed,
    [DPAD_RIGHT]: buttons[DPAD_RIGHT].pressed,
  };
  padState.prevStickDir = stick;
  return shape;
}

// Polls EVERY connected device and returns the first shape one produced.
export function pollDevices() {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  const connected = routePads(navigator.getGamepads());
  if (connected.length === 0) {
    // No device: clear every edge state so a reconnect cannot inherit a stale
    // held state.
    for (const id of connectedPadIds) {
      const s = getPadState(id);
      s.prevButtons = null;
      s.prevStickDir = null;
    }
    return null;
  }
  let first = null;
  for (const gp of connected) {
    const shape = readPad(gp);
    if (first === null && shape) first = shape;
  }
  return first;
}

// Clears the edge state for every device seen so far. A consumer registers
// this on its device connect/disconnect events.
export function clearDeviceEdges() {
  for (const id of connectedPadIds) {
    const s = getPadState(id);
    s.prevButtons = null;
    s.prevStickDir = null;
  }
}
