# Design

## Order inside `pieceSteerIntent`

`pollController` emits at most one intent per frame. The current order is shift, then rotation. Putting the A edge first keeps that contract and makes the rotation win the frame:

```js
function pieceSteerIntent(s) {
  if (s.aEdge) return { action: 'pieceRotate', cw: true };
  let dc = 0;
  if (s.leftNow) dc = -1;
  else if (s.rightNow) dc = 1;
  else if (s.stick) dc = s.stick.c;
  if (dc) return { action: 'pieceShift', dc };
  if (s.upEdge || s.stickUpEdge) return { action: 'pieceRotate', cw: false };
  if (s.downEdge || s.stickDownEdge) return { action: 'pieceRotate', cw: true };
  return null;
}
```

A held D-pad plus A gives a rotation on the edge frame and a shift on the next frame. The shift gate `game.pieceMoveAcc` is not touched by rotation, so the pending shift is not consumed by the rotation.

Rejected: emitting two intents in one frame. `tests/devices.test.js` asserts `pollController()` returns exactly one object, and `handleIntent` handles one intent. Changing that contract is a larger change than this need.

## A in Snake role

`playingIntent` routes Snake role to `snakeSteerIntent`, which reads only the D-pad and the stick. A therefore does nothing while the player controls the snake. The spec states this so the button is not expected to do something.

## Help text

`snaketris.html` line 148 becomes:

```html
<li>Tetris role: D-pad left/right — shift, up/down — rotate, A — rotate clockwise</li>
```

`tests/constants.test.js` asserts this string verbatim, so it is updated in the same change.
