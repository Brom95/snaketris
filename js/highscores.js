// High-score board: load/save/insert the top-10 scores in `localStorage`.
// Each entry is { score: number, date: ISO-8601 string }.
const STORAGE_KEY = 'snaketris.highscores';

// Load the stored board. Returns [] when the entry is missing, not JSON,
// or not an array, so corrupt state never breaks the game.
export function loadBoard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Persist the board as JSON. A failing write (e.g. full/sandboxed storage)
// is ignored — the board stays in memory and the game is unaffected.
export function saveBoard(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (e) {
    // ignore
  }
}

// Record a finished game's score. Loads the board, appends the new entry,
// sorts by score descending then date descending (newest first), keeps the
// top 10, and saves.
export function recordScore(score) {
  const board = loadBoard();
  board.push({ score: score, date: new Date().toISOString() });
  board.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.date > a.date) return 1;
    if (b.date < a.date) return -1;
    return 0;
  });
  saveBoard(board.slice(0, 10));
}
