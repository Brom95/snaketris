# Tasks

## 1. Scaffold single-page HTML5 game

- [ ] 1.1 Create `snaketris.html` (single self-contained file) with a `<canvas>` and an inline `<script>`; verify it opens in a browser with no external assets or build step
- [ ] 1.2 Add a `requestAnimationFrame` game loop (fixed-timestep update decoupled from render); verify the loop runs and pauses cleanly when the tab is hidden

## 2. Grid model

- [ ] 2.1 Define the grid cell identities (empty, snake-body, edible-piece, solid-block) and a logical grid size; verify each cell can be read/written by identity
- [ ] 2.2 Implement grid snap for landing pieces; verify a falling piece snaps to a grid cell only when it lands

## 3. Snake movement and classic growth

- [ ] 3.1 Move the snake on discrete steps in response to input (arrows/WASD); verify direction changes respect the no-reverse rule
- [ ] 3.2 Grow the snake by classic growth (each eaten cell adds a segment); verify length increases by one per consumed cell

## 4. Wrap-around edges

- [ ] 4.1 Apply wrap-around at screen edges via modulo (no walls); verify the head re-enters from the opposite side when it moves off one edge

## 5. Falling Tetris pieces

- [ ] 5.1 Spawn the seven classic tetromino shapes (I, O, T, S, Z, L, J) at the top and fall them downward; verify a new piece appears at the top and moves down until it lands
- [ ] 5.2 Turn landed pieces into solid blocks (touch bottom or rest on others); verify a landed piece stops being edible and becomes a solid obstacle

## 6. Cell-by-cell eating with scoring

- [ ] 6.1 Consume edible pieces cell-by-cell; verify the snake eats one cell at a time
- [ ] 6.2 Add exactly 1 to the running score per consumed cell; verify the score increments by 1 per cell

## 7. Death conditions

- [ ] 7.1 End the game on self-collision (head overlaps own body); verify game over triggers when the head hits an own segment
- [ ] 7.2 End the game when the head touches a solid (landed) block; verify game over triggers on touching a landed obstacle

## 8. Difficulty ramp

- [ ] 8.1 Track landed-block count and bump fall-speed tier every 2 landed blocks; verify fall speed increases one step after two more blocks land

## 9. Score and restart

- [ ] 9.1 Maintain and display a running total score on the canvas; verify the displayed score reflects the cumulative total
- [ ] 9.2 Offer restart from scratch after game over (R / click); verify a new game re-seeds pieces and snake and resets the score to 0
