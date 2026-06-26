// ============================================================
// store.js — owns the trip data + persistence (localStorage).
// Base data lives in window.__BASE_TRIPS (the data/*.js files).
// Edits are saved per-browser and survive reloads. "Reset"
// throws away edits and restores the base data.
// ============================================================
window.Store = (function () {

  const KEY = 'yapan2-state-v1';
  let data = {};                 // { kansai:{...}, hokkaido:{...}, ... }
  const listeners = [];

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function base() { return clone(window.__BASE_TRIPS || {}); }

  function load() {
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(KEY)); } catch (e) { stored = null; }
    data = (stored && typeof stored === 'object') ? stored : base();
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
    emit();
  }

  function reset() {
    data = base();
    save();
  }

  function init() { load(); return data; }

  function raw() { return data; }

  // Normalized, render-ready itinerary.
  function model() { return window.Normalize.itinerary(data); }

  function trip(id) { return data[id]; }

  function updateDay(tripId, dayIndex, patch) {
    const d = data[tripId] && data[tripId].days[dayIndex];
    if (!d) return;
    Object.assign(d, patch);
    save();
  }

  function updateItem(tripId, dayIndex, itemIndex, patch) {
    const d = data[tripId] && data[tripId].days[dayIndex];
    if (!d || !d.timeline[itemIndex]) return;
    Object.assign(d.timeline[itemIndex], patch);
    save();
  }

  function onChange(cb) { listeners.push(cb); }
  function emit() { listeners.forEach(function (cb) { try { cb(data); } catch (e) {} }); }

  return {
    init: init, raw: raw, model: model, trip: trip,
    save: save, reset: reset,
    updateDay: updateDay, updateItem: updateItem,
    onChange: onChange
  };
})();
