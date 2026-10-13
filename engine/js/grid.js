// Engine grid: a rows x cols cell array created from parameters.
// Cell identities are values the consumer supplies; this file names none.
export function createGrid({ cols, rows, empty }) {
  let cells = [];

  return {
    init() {
      cells = [];
      for (let r = 0; r < rows; r++) cells.push(new Array(cols).fill(empty));
    },
    getCell(row, col) {
      return cells[row][col];
    },
    setCell(row, col, id) {
      cells[row][col] = id;
    },
    // The full array, for a consumer that paints every cell in one pass.
    getGrid() {
      return cells;
    },
  };
}
