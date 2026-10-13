// High-score board: load/save/insert the top-10 scores in `localStorage`.
// Each entry is { score: number, date: ISO-8601 string, role: 'snake' | 'tetris' }.
// Entries saved before roles existed have no `role` field and read as 'snake'.
// This module is the records layer: the only writer of the boards. The gameplay
// core reports a finished game and never touches storage.
import { game } from './state.js';
import { ROLE_MARKERS } from './constants.js';
import { registerReport } from '../engine/js/records.js';

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

// ISO-8601 "2026-09-26T12:34:56.789Z" -> "2026-09-26" (deterministic).
function formatDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

// One display line per board entry, in stored order: role marker, score, date.
// The records owner formats the lines because it owns the entry shape; the page
// only puts each line into one list item.
export function recordLines(board) {
  const lines = [];
  for (const entry of board) {
    lines.push(ROLE_MARKERS[entryRole(entry)] + '  ' + entry.score + '  ·  ' + formatDate(entry.date));
  }
  return lines;
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

// The report field and the per-entry writer are handed to the engine shell at
// module load. The shell owns the once-then-clear policy; this module owns the
// board key, the entry shape and the storage write. A failing write is caught
// here, so broken storage leaves navigation and gameplay unchanged.
registerReport({
  field: 'result',
  writer: (entry) => recordScore(entry.score, entry.role, game.play.durationMinutes),
});

// The shell itself lives in the engine; the name stays here so the registry
// import line in js/app.js does not change.
export { recordsSystem } from '../engine/js/records.js';
