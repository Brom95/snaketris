// Shared test setup: reset the game, set the player's role, start play, then
// force a state when the test needs one other than PLAYING.
import { game, resetGame, startGame } from '../../js/state.js';

export function startIn(state = 'PLAYING', role = 'snake') {
  resetGame();
  game.play.role = role;
  startGame();
  if (state !== 'PLAYING') game.screen.state = state;
  return game;
}
