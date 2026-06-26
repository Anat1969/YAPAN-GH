// ============================================================
// app.js — bootstrap + orchestration. Holds view state, wires the
// tabs / filters / reset, and re-renders the panel + map whenever
// the data or filters change.
// ============================================================
(function () {

  const state = { screen: 'planning', person: 'all', type: 'all', day: 'all' };

  const els = {
    tabs: document.getElementById('appTabs'),
    panel: document.getElementById('screenPanel'),
    filterBar: document.getElementById('filterBar'),
    legend: document.getElementById('legend'),
    mapMissing: document.getElementById('mapMissing'),
    title: document.getElementById('tripTitle'),
    sub: document.getElementById('tripSub'),
    reset: document.getElementById('btnReset')
  };

  // Build the filtered view: days in range, each with .fpoints (person+type filtered).
  function computeView(model) {
    let days = model.days;
    if (state.day !== 'all') days = days.filter(function (d) { return String(d.gday) === String(state.day); });
    return days.map(function (d) {
      const pts = d.points.filter(function (p) {
        return window.Filters.matchPerson(p.forWho, state.person)
          && window.Filters.matchType(p.type, state.type);
      });
      pts.forEach(function (p, i) { p._label = i + 1; });
      return Object.assign({}, d, { fpoints: pts });
    });
  }

  function render() {
    const model = window.Store.model();

    // header
    const trip = model.trips[0] || {};
    els.title.textContent = 'יפן2';
    els.sub.textContent = trip.title ? '· ' + trip.title + (trip.subtitle ? ' — ' + trip.subtitle : '') : '';

    // filters + legend
    window.Filters.render(els.filterBar, state, model, function (patch) {
      Object.assign(state, patch);
      render();
    });
    window.Filters.legend(els.legend);

    const days = computeView(model);

    // screen
    window.Screens.render(state.screen, { model: model, state: state, days: days }, els.panel);

    // map (all visible stops, grouped by day so routes connect)
    const groups = days.map(function (d) { return { day: d, points: d.fpoints }; });
    window.MapView.render(groups, function (pt) {
      // find the owning day to open the right detail
      const owner = days.filter(function (d) { return d.fpoints.indexOf(pt) !== -1; })[0];
      if (owner) window.Detail.openPlace(owner, pt);
    });

    // missing-coords banner
    let missing = 0;
    days.forEach(function (d) { d.fpoints.forEach(function (p) { if (!p.hasCoords) missing += 1; }); });
    if (missing) {
      els.mapMissing.style.display = 'block';
      els.mapMissing.textContent = '⚠ ' + missing + ' מקומות ללא מיקום במפה';
    } else {
      els.mapMissing.style.display = 'none';
    }

    // active tab styling
    Array.prototype.forEach.call(els.tabs.querySelectorAll('.app-tab'), function (t) {
      t.classList.toggle('active', t.dataset.screen === state.screen);
    });
  }

  function wire() {
    els.tabs.addEventListener('click', function (e) {
      const tab = e.target.closest('.app-tab');
      if (!tab) return;
      state.screen = tab.dataset.screen;
      render();
    });
    els.reset.addEventListener('click', function () {
      if (confirm('לאפס את כל השינויים ולחזור לנתוני הבסיס?')) window.Store.reset();
    });
    // re-render after any data change (edits, reset)
    window.Store.onChange(function () { render(); });
  }

  function start() {
    window.Store.init();
    window.MapView.init('leafletMap');
    wire();
    render();
    // Leaflet sometimes needs a nudge once the panel has its final size
    setTimeout(function () { try { window.MapView.init('leafletMap').invalidateSize(); } catch (e) {} }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
