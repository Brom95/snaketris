import { installDomStub } from './tests/helpers/dom-stub.js';
installDomStub();
const { game } = await import('./js/state.js');
const { startIn } = await import('./tests/helpers/game.js');
const { setCell, getCell } = await import('./js/grid.js');
const { SOLID, EMPTY, COLS, ROWS, TETROMINOES } = await import('./js/constants.js');
const { bodyCells } = await import('./js/bot.js');
startIn('PLAYING','snake');
console.log('snake:', JSON.stringify(game.snake), 'dir:', JSON.stringify(game.dir));
for(let r=0;r<ROWS;r++){ const row=[]; for(let c=0;c<COLS;c++) row.push(getCell(r,c)===SOLID?'#':'.'); console.log(r, row.join('')); }
