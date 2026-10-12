// screens.test.js — the screen table is the single source of truth: every
// screen, its items in page order, each item's target, the labels matching the
// constants the page already uses, and every id resolving to a real element in
// snaketris.html.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const screens = await import('../js/screens.js');
const C = await import('../js/constants.js');
const state = await import('../js/state.js');

const page = await readFile(new URL('../snaketris.html', import.meta.url), 'utf8');

const SCREEN_IDS = [C.MENU, C.SELECT_ROLE, C.SELECT_CONTROL, C.PLAYING, C.GAME_OVER, C.RECORDS, C.HELP];

test('the table has one entry per screen, in the declared order', async () => {
  assert.equal(screens.SCREENS.length, SCREEN_IDS.length);
  assert.deepEqual(screens.SCREENS.map((row) => row.id), SCREEN_IDS);
  assert.equal(new Set(screens.SCREENS.map((row) => row.id)).size, SCREEN_IDS.length);
});

test('the table indexes every screen by id', async () => {
  for (const id of SCREEN_IDS) {
    assert.equal(screens.SCREEN_BY_ID[id].id, id);
  }
  assert.equal(Object.keys(screens.SCREEN_BY_ID).length, SCREEN_IDS.length);
});

test('menu labels equal MENU_ITEMS in page order, so no label is invented', async () => {
  assert.deepEqual(screens.SCREEN_BY_ID[C.MENU].items.map((it) => it.label), C.MENU_ITEMS);
});

test('role items equal ROLE_SCREEN_ITEMS in page order', async () => {
  assert.deepEqual(screens.SCREEN_BY_ID[C.SELECT_ROLE].items.map((it) => it.label), C.ROLE_SCREEN_ITEMS);
});

test('control items equal CONTROL_SCREEN_ITEMS in page order', async () => {
  assert.deepEqual(screens.SCREEN_BY_ID[C.SELECT_CONTROL].items.map((it) => it.label), C.CONTROL_SCREEN_ITEMS);
});

test('every menu item names the screen it opens', async () => {
  const menu = screens.SCREEN_BY_ID[C.MENU];
  assert.equal(menu.cursor, 'arrow');
  assert.equal(menu.selection, 'menuSelect');
  assert.equal(menu.items[0].action, screens.TRANSITIONS['select-role']);
  assert.equal(menu.items[0].opens, C.SELECT_ROLE);
  assert.equal(menu.items[1].action, screens.TRANSITIONS['two-player']);
  assert.equal(menu.items[1].opens, C.SELECT_ROLE);
  assert.equal(menu.items[2].opens, C.RECORDS);
  assert.equal(menu.items[2].action, screens.TRANSITIONS.open);
  assert.equal(menu.items[3].opens, C.HELP);
  assert.equal(menu.items[3].action, screens.TRANSITIONS.open);
});

test('the role items carry their role and Back returns to the menu', async () => {
  const role = screens.SCREEN_BY_ID[C.SELECT_ROLE];
  assert.equal(role.cursor, 'arrow');
  assert.equal(role.items[0].role, 'snake');
  assert.equal(role.items[0].marker, C.ROLE_MARKERS.snake);
  assert.equal(role.items[1].role, 'tetris');
  assert.equal(role.items[1].marker, C.ROLE_MARKERS.tetris);
  assert.equal(role.items[0].action, screens.TRANSITIONS['pick-role']);
  assert.equal(role.items[2].action, screens.TRANSITIONS['back-menu']);
});

test('the control items bind to the one-item-at-a-time steps', async () => {
  const control = screens.SCREEN_BY_ID[C.SELECT_CONTROL];
  assert.equal(control.cursor, 'step');
  assert.deepEqual(control.items.map((it) => it.step), [C.GAME_CONTROL_P1, C.GAME_CONTROL_P2, C.GAME_CONTROL_START]);
  assert.equal(control.items[0].player, 1);
  assert.equal(control.items[1].player, 2);
  assert.equal(control.items[0].action, screens.TRANSITIONS['lock-model']);
  assert.equal(control.items[2].action, screens.TRANSITIONS['start-game']);
  assert.equal(control.items[2].hints, 'Enter / Space');
});

test('back and reassign controls are declared on the control screen', async () => {
  const control = screens.SCREEN_BY_ID[C.SELECT_CONTROL];
  assert.deepEqual(control.controls.map((it) => it.id), ['control-back', 'control-reassign-p1', 'control-reassign-p2']);
  assert.equal(control.controls[0].action, screens.TRANSITIONS['back-role-select']);
  assert.equal(control.controls[1].action, screens.TRANSITIONS.reassign);
  assert.equal(control.controls[1].player, 1);
  assert.equal(control.controls[2].player, 2);
});

test('the screens with no items still declare their return control', async () => {
  for (const id of [C.RECORDS, C.HELP, C.GAME_OVER]) {
    const row = screens.SCREEN_BY_ID[id];
    assert.equal(row.items.length, 0);
    assert.equal(row.cursor, 'none');
    assert.equal(row.controls.length, 1);
    assert.equal(row.controls[0].action, screens.TRANSITIONS['back-menu']);
  }
  assert.equal(screens.SCREEN_BY_ID[C.PLAYING].items.length, 0);
  assert.equal(screens.SCREEN_BY_ID[C.PLAYING].controls.length, 0);
});

test('the field is on screen only on PLAYING and GAME_OVER', async () => {
  for (const row of screens.SCREENS) {
    const expected = row.id === C.PLAYING || row.id === C.GAME_OVER;
    assert.equal(row.field, expected);
  }
});

test('every table entry resolves to a real page element id', async () => {
  for (const row of screens.SCREENS) {
    if (row.view) assert.ok(page.includes(`id="${row.view}"`));
    for (const item of [...row.items, ...row.controls]) {
      assert.ok(page.includes(`id="${item.id}"`));
    }
  }
});

test('itemForStep answers the step-driven screens and opensScreen the arrow ones', async () => {
  assert.equal(screens.itemForStep(C.SELECT_CONTROL, C.GAME_CONTROL_P2).id, 'control-item-p2');
  assert.equal(screens.itemForStep(C.SELECT_CONTROL, C.GAME_CONTROL_START).label, C.CONTROL_SCREEN_ITEMS[2]);
  assert.equal(screens.itemForStep(C.MENU, C.GAME_CONTROL_P1), null);
  assert.equal(screens.opensScreen(C.MENU, 2), C.RECORDS);
  assert.equal(screens.opensScreen(C.SELECT_ROLE, 0), null);
  assert.equal(screens.opensScreen(C.RECORDS, 0), null);
});

// This file installs no DOM stub, so `document` is undefined here: any
// navigation path that reached a page element would throw. The intents below
// are the only thing the screen system reads.
test('the screen system drives navigation from intents with no page present', async () => {
  state.resetGame();
  screens.pushIntent({ action: 'menuDown' });
  screens.pushIntent({ action: 'menuDown' });
  screens.pushIntent({ action: 'confirm' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.RECORDS);
  assert.equal(state.game.screen.menuSelect, 2);

  state.resetGame();
  screens.pushIntent({ action: 'confirm' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.SELECT_ROLE);
  screens.pushIntent({ action: 'menuDown' });
  screens.drainIntents();
  assert.equal(state.game.screen.roleSelect, 1);
  screens.pushIntent({ action: 'confirm' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.PLAYING);
  assert.equal(state.game.play.role, 'tetris');
});

test('a two-player role pick hands the other role to the second player', async () => {
  state.resetGame();
  screens.pushIntent({ action: 'menuDown' });
  screens.pushIntent({ action: 'confirm' });
  screens.drainIntents();
  assert.equal(state.game.screen.twoPlayerMode, true);
  assert.equal(state.game.screen.state, C.SELECT_ROLE);
  screens.pushIntent({ action: 'confirm' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.SELECT_CONTROL);
  assert.equal(state.game.screen.p1Role, 'snake');
  assert.equal(state.game.screen.p2Role, 'tetris');
  assert.equal(state.game.screen.gameControlStep, C.GAME_CONTROL_P1);
});

test('an intent the current screen has no item for leaves navigation unchanged', async () => {
  state.resetGame();
  screens.pushIntent({ action: 'toMenu' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.MENU);
  assert.equal(state.game.screen.menuSelect, 0);

  screens.pushIntent({ action: 'select', id: 'control-item-p2' });
  screens.drainIntents();
  assert.equal(state.game.screen.state, C.MENU);
  assert.equal(state.game.screen.menuSelect, 0);

  state.game.screen.state = C.SELECT_CONTROL;
  screens.pushIntent({ action: 'menuDown' });
  screens.drainIntents();
  assert.equal(state.game.screen.gameControlStep, C.GAME_CONTROL_P1);
  assert.equal(state.game.screen.controlSelect, 0);

  screens.pushIntent({ action: 'select', id: 'control-item-p1' });
  screens.drainIntents();
  assert.equal(state.game.screen.p1Model, null);
  assert.equal(state.game.screen.controlSelect, 0);
});
