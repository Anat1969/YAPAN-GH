// ============================================================
//  store.js — App.store
//  מצב מרכזי (items + days + ui) עם שמירה ב-localStorage.
//  update(delta) ממזג שינויים ומשדר לכל המנויים.
// ============================================================
window.App = window.App || {};
App.store = (function () {

  const KEY = 'yapan2-state-v2';
  let state = null;
  const listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function freshState() {
    const built = App.normalize.build();
    return {
      ui: { activeScreen: 'planning', filters: {}, activeDayId: built.dayOrder[0] || '' },
      dayOrder: built.dayOrder,
      days: built.days,
      items: built.items,
      meta: built.meta,
    };
  }

  function init() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    if (saved && saved.dayOrder && saved.items) {
      state = saved;
      if (!state.ui) state.ui = { activeScreen: 'planning', filters: {}, activeDayId: state.dayOrder[0] || '' };
      if (!state.ui.filters) state.ui.filters = {};
    } else {
      state = freshState();
    }
    return state;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function get() { return state; }
  function allItems() { return Object.keys(state.items).map(k => state.items[k]); }
  function getItem(id) { return state.items[id]; }
  function getDay(id) { return state.days[id]; }

  // delta: { items:{id:patch}, days:{id:patch}, dayOrder:[], deleted:[ids], tripMeta:{...} }
  function update(delta) {
    delta = delta || {};
    if (delta.items) {
      for (const id in delta.items) {
        state.items[id] = Object.assign({}, state.items[id], delta.items[id]);
      }
    }
    if (delta.days) {
      for (const id in delta.days) {
        state.days[id] = Object.assign({}, state.days[id], delta.days[id]);
      }
    }
    if (delta.dayOrder) state.dayOrder = delta.dayOrder.slice();
    if (delta.deleted) {
      delta.deleted.forEach(id => {
        const it = state.items[id];
        if (it && it.dayId && state.days[it.dayId]) {
          const d = state.days[it.dayId];
          d.itemOrder = (d.itemOrder || []).filter(x => x !== id);
        }
        delete state.items[id];
      });
    }
    if (delta.tripMeta) state.meta = Object.assign({}, state.meta, delta.tripMeta);
    persist();
    emit();
  }

  function setUi(patch) {
    state.ui = Object.assign({}, state.ui, patch);
    if (patch.filters) state.ui.filters = Object.assign({}, patch.filters);
    persist();
    emit();
  }

  function reset() {
    state = freshState();
    persist();
    emit();
  }

  function subscribe(cb) { listeners.push(cb); }
  function emit() { listeners.forEach(cb => { try { cb(state); } catch (e) { console.error(e); } }); }

  return {
    init, get, allItems, getItem, getDay,
    update, setUi, reset, subscribe,
  };
})();
