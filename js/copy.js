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

// The two ways a "Two Players" entry can run a match: both players share this
// page, or each player plays on their own device. Page order matches the way
// sub-menu's items.
export const WAY_ITEMS = ['Same computer', 'Network'];
export const WAY_SCREEN_ITEMS = ['Same computer', 'Network (anywhere)', 'Network (same network)', 'Back'];
export const WAY_TITLE = 'Choose how two players meet';
export const WAY_HINTS = 'Up / Down — choose · Enter — confirm · Escape — back';

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

// The pairing step. The title names the step and the action the second player
// takes; the hint line lists every key that advances it.
export const PAIRING_TITLE = 'Pair with another device';
export const PAIRING_HINTS = 'Enter or Space — pair · Escape — back';
export const PAIRING_LINK_LABEL = 'Open this link';
export const PAIRING_CODE_LABEL = 'Or type this code';
export const PAIRING_WAITING = 'Waiting for the other device';
export const PAIRING_JOIN = 'Pair';

// The preloader line the pairing step paints while the page's own ICE attempt
// runs: the attempt starts when the page opens, and the step counts the seconds
// left in its budget, so a slow network shows the wait rather than a link that
// pairs nobody.
export const PAIRING_ICE_WAIT = 'Connecting to STUN servers';

// What the pairing step says when the offer carries no remote ICE address. The
// fallback blob reaches only another tab in the same browser instance, so the
// step names the limit it leaves instead of painting a link that pairs nobody.
export const PAIRING_WARN_LOCAL = 'No candidate supply reached this page — on one network, name the same supply in both addresses with ?ice=stun:your-server; otherwise this pairing has no channel';
export const PAIRING_WARN_NONE = 'This browser cannot open a peer connection — network play is unavailable';

// The same-network flow: each peer types the one value the browser cannot read
// on its own — its own address — and the page reads its own port. The lines name
// that value, reject a value that names a scheme instead of a network address,
// and hand the second page the address the first page cannot see.
export const LOCAL_TITLE = 'Pair on one network';
export const LOCAL_HINTS = 'Type your address · Escape — back';
export const LOCAL_WARN = 'This way asks no candidate server, so nothing on it waits for one: the page pairs on the address its link names';
export const ADDRESS_LABEL = 'Your address';
export const ADDRESS_HINTS = 'Type the numbers your device uses, like 192.168.4.10. The port beside it belongs to this page — you never type it.';
export const ADDRESS_BAD = 'An address is four numbers with dots between, each from 0 to 255, like 192.168.4.10 — a name or a link is not an address.';

// The copy affordance: a click puts the value beside it on the clipboard, so a
// player never retypes a link or an address. A browser that refuses the copy
// says so, and the value stays selectable by hand.
export const COPY_LABEL = '📑';
export const COPY_DENIED = 'This page could not copy it — select the text instead.';

// The guest page's read-only copies of the host's preparation sub-menus. The
// copy names the wait beside them so the guest always knows the other device
// is the one choosing.
export const MIRROR_TITLE = 'The other device chooses';
export const MIRROR_HINTS = 'Nothing to choose here';

// The alphabet for the short readable code: no I, O, 0 or 1, so a player can
// read every character off the screen.
export const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
