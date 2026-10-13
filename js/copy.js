// snaketris — page copy and presentation. Every value here is something the
// game shows or a label the player reads: menu wording, role markers, screen
// item lists, key hints, the repository link, the palette. The engine receives
// none of them, and no rule is computed from them.

// The menu labels, in the order they appear as page elements in snaketris.html.
export const MENU_ITEMS = ['Play', 'Two Players', 'Records', 'How to Play'];

// The two roles, in the order they appear as page elements in snaketris.html.
// Each role's marker is shown on the role sub-menu item and on every record
// entry, so the same glyph is used in both places.
export const ROLE_ITEMS = ['Snake', 'Tetris'];
export const ROLE_MARKERS = { snake: '\u{1F40D}', tetris: '\u{1F3D7}\u{FE0F}' };

// The role screen's selectable items in page order: the two roles plus Back.
// The arrow cycles over this list; only the first two entries are roles.
export const ROLE_SCREEN_ITEMS = ['Snake', 'Tetris', 'Back'];

// The control confirmation screen's selectable items in page order: P1 select,
// P2 select, Start (enabled after both confirm). Back is a separate always-
// visible button outside this list.
export const CONTROL_SCREEN_ITEMS = ['P1 Select', 'P2 Select', 'Start'];

// The four layout keys for each keyboard model, keyed by model name. A model is
// "keyboard" when it has an entry here; gamepad and any other model are not.
export const GAME_CONTROL_KEYBOARD_MODELS = {
  wasd: ['w', 'a', 's', 'd'],
  arrows: ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'],
};

// The keyboard model names, in display order. Kept separate so the UI can list
// them without depending on the key arrays.
export const GAME_CONTROL_KEYBOARD_MODEL_NAMES = ['wasd', 'arrows'];

// The emoji marker shown with each player's name on the control screen.
export const GAME_CONTROL_PLAYER_MARKERS = { 1: '\u{1F3AE}', 2: '\u{1F579}\u{FE0F}' }; // 🎮 🕹

// Emoji marker shown with each keyboard model name in the key-hint line.
export const GAME_CONTROL_MODEL_EMOJI = { wasd: '\u{2328}\u{FE0F}', arrows: '\u{2B06}\u{FE0F}\u{2B07}\u{FE0F}\u{2B05}\u{FE0F}\u{2B06}\u{FE0F}' }; // ⌨️ ⬆⬇⬅⬆

// URL for the GitHub repository.
export const GITHUB_URL = 'https://github.com/Brom95/snaketris';

// The duration screen's selectable items in page order: the three durations
// plus Back. The arrow cycles over this list; only the first three entries are
// durations.
export const DURATION_SCREEN_ITEMS = ['1 minute', '3 minutes', '5 minutes', 'Back'];

// Palette
export const COLORS = {
  bg: '#0b0e14',
  grid: 'rgba(255,255,255,0.05)',
  snakeHead: '#4ade80',
  snakeBody: '#9ca3af',
  tierBlue: '#2563eb',
  tierPurple: '#8b5cf6',
  tierGold: '#facc15',
  edible: '#7dd3fc',
  solid: '#f97316',
  text: '#e8ecf4',
  overlay: 'rgba(11,14,20,0.8)',
};
