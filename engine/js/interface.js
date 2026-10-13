// Engine interface: the page-element owner and the view-sync mechanism.
// A consumer registers its screen rows and asks this instance for elements;
// the instance never names an id, a screen or a game noun. The visibility
// classes are the contract: `.view` hides by default, `.view.on` shows.

export function createInterface() {
  const elById = new Map();
  const itemsByScreen = new Map();
  const controlsByScreen = new Map();

  function lookup(id) {
    if (!id) return null;
    const el = document.getElementById(id);
    elById.set(id, el);
    return el;
  }

  // `.view` hides by default, `.view.on` shows it; the toggle keeps the base class.
  function show(el, on) {
    if (el) el.classList.toggle('on', on);
  }

  function items(screenId) {
    return itemsByScreen.get(screenId) ?? [];
  }

  function controls(screenId) {
    return controlsByScreen.get(screenId) ?? [];
  }

  // The interface elements of one screen: its items, then its controls.
  function hitTargets(screenId) {
    const out = [];
    for (const el of items(screenId)) if (el) out.push(el);
    for (const el of controls(screenId)) if (el) out.push(el);
    return out;
  }

  // Highlight one element in a list by index; -1 clears the whole list.
  function highlight(list, index) {
    for (let i = 0; i < list.length; i++) show(list[i], i === index);
  }

  // Index every id a registered row names, in row order. A page element that is
  // absent keeps its slot, so every table index stays true.
  function indexRows(rows) {
    for (const row of rows) {
      if (row.view) lookup(row.view);
      const rowItems = [];
      for (const item of row.items) rowItems.push(lookup(item.id));
      const rowControls = [];
      for (const control of row.controls) rowControls.push(lookup(control.id));
      itemsByScreen.set(row.id, rowItems);
      controlsByScreen.set(row.id, rowControls);
    }
  }

  // Toggle every registered row's view element from the current screen id, and
  // report whether that row shows the field.
  function paintViews(rows, screenId) {
    let fieldOn = false;
    for (const row of rows) {
      show(elById.get(row.view), row.id === screenId);
      if (row.id === screenId) fieldOn = !!row.field;
    }
    return fieldOn;
  }

  return {
    lookup,
    show,
    element: (id) => elById.get(id),
    indexRows,
    items,
    controls,
    hitTargets,
    highlight,
    paintViews,
  };
}
