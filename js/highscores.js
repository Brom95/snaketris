// High-score board: load/save/insert the top-10 scores in `localStorage`.
// Each entry is { score: number, date: ISO-8601 string, role: 'snake' | 'tetris' }.
// Entries saved before roles existed have no `role` field and read as 'snake'.
// This module is the records layer: the only writer of the boards. The gameplay
// core reports a finished game and never touches storage.
import { game } from './state.js';

// One key per match duration: `snaketris.highscores.1`, `.3`, `.5`. The pre-split
// key `snaketris.highscores` is never read or written here, so entries recorded
// before the split stay hidden instead of appearing on every board.
const STORAGE_PREFIX = 'snaketris.highscores';

export function boardKey(minutes) {
  return STORAGE_PREFIX + '.' + minutes;
}

// Normalise an entry's role. Anything that is not 'tetris' is the snake side,
// which keeps legacy entries readable.
export function entryRole(entry) {
  return entry && entry.role === 'tetris' ? 'tetris' : 'snake';
}

// Load the stored board for one match duration. Returns [] when the entry is
// missing, not JSON, or not an array, so corrupt state never breaks the game.
export function loadBoard(minutes) {
  try {
    const raw = localStorage.getItem(boardKey(minutes));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Persist one duration's board as JSON. A failing write (e.g. full/sandboxed
// storage) is ignored — the board stays in memory and the game is unaffected.
export function saveBoard(minutes, board) {
  try {
    localStorage.setItem(boardKey(minutes), JSON.stringify(board));
  } catch (e) {
    // ignore
  }
}

// Record a finished game's score into one duration's board. Loads that board,
// appends the new entry, sorts by score descending then date descending (newest
// first), keeps the top 10, and saves.
export function recordScore(score, role, minutes) {
  const board = loadBoard(minutes);
  board.push({ score: score, date: new Date().toISOString(), role: role === 'tetris' ? 'tetris' : 'snake' });
  board.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.date > a.date) return 1;
    if (b.date < a.date) return -1;
    return 0;
  });
  saveBoard(minutes, board.slice(0, 10));
}

// The records owner, run as a system in the engine registry. The core reports
// a finished game once as `game.play.result`; this step persists that report
// and clears it before writing, so a failing storage write cannot repeat on
// later ticks. A two-player duel reports two entries, a single-player game one.
// Each entry goes into the board of the match's own duration.
export const recordsSystem = {
  name: 'records',
  update(ctx) {
    const report = game.play.result;
    if (!report) return;
    game.play.result = null;
    for (const entry of report) recordScore(entry.score, entry.role, game.play.durationMinutes);
  },
};
