// ============================================================
//  screens.js — App.screens
//  מרנדר את המסך הפעיל לתוך הפאנל, ומסנכרן את המפה.
//  6 מסכים: planning · times · places · lodging · costs · summary
// ============================================================
window.App = window.App || {};
App.screens = (function () {

  const C = () => App.components;
  const S = () => App.store;
  let panel = null;

  function setPanel(el) {
    panel = el;
    panel.addEventListener('click', onClick);
  }

  function filtered() {
    return App.filters.apply(S().allItems(), S().get().ui.filters);
  }
  function inSet(set) { const m = {}; set.forEach(i => m[i.id] = true); return m; }

  function dayItems(day, allow) {
    return (day.itemOrder || []).map(id => S().getItem(id)).filter(it => it && allow[it.id]);
  }

  // ---------- planning ----------
  function planning() {
    const st = S().get();
    const allow = inSet(filtered());
    let html = '<div class="screen">';
    st.dayOrder.forEach(did => {
      const day = st.days[did];
      const items = dayItems(day, allow);
      const hotel = day.sleepRef ? S().getItem(day.sleepRef) : null;
      html += C().dayCard(day, { sleepName: hotel ? hotel.nameHe : '' });
      html += '<div class="day-items">';
      html += items.length ? items.map(i => C().placeCard(i, { expandable: true })).join('')
        : '<div class="muted" style="padding:6px 10px">אין תחנות שמתאימות לסינון</div>';
      html += '</div>';
    });
    html += '</div>';
    return { html, mapItems: filtered().filter(i => i.type !== 'hotel') };
  }

  // ---------- times ----------
  function times() {
    const st = S().get();
    const allow = inSet(filtered());
    let html = '<div class="screen">';
    st.dayOrder.forEach(did => {
      const day = st.days[did];
      const items = dayItems(day, allow).slice().sort((a, b) =>
        (a.recommendedTime || '').localeCompare(b.recommendedTime || ''));
      html += '<div class="card"><div class="times-head"><span class="day-badge">יום ' + day.index + '</span>' +
        '<strong>' + C().esc(day.title) + '</strong></div><div class="timeline">';
      html += items.length ? items.map(i =>
        '<div class="tl-row" data-detail="' + C().esc(i.id) + '">' +
          '<span class="tl-time">' + C().esc(i.recommendedTime) + '</span>' +
          '<span class="tl-line" style="background:' + App.map.colorFor(i.type) + '"></span>' +
          '<div class="tl-body"><div class="tl-name">' + C().esc(i.nameHe) + '</div>' +
          '<div class="tl-meta muted">' + [i.duration, C().TYPE_LABEL[i.type] || i.type].filter(Boolean).join(' · ') + '</div></div>' +
        '</div>').join('') : '<div class="muted">אין תחנות</div>';
      html += '</div></div>';
    });
    html += '</div>';
    return { html, mapItems: filtered().filter(i => i.type !== 'hotel') };
  }

  // ---------- places ----------
  function places() {
    const set = filtered().filter(i => i.type !== 'hotel');
    const missing = set.filter(i => !i.coordinates).length;
    let html = '<div class="screen"><div class="places-count muted">' + set.length + ' מקומות' +
      (missing ? ' · ' + missing + ' ללא מיקום' : '') + '</div><div class="places-grid">';
    html += set.map(i => C().placeCard(i, { expandable: true })).join('');
    html += '</div></div>';
    return { html, mapItems: set };
  }

  // ---------- lodging ----------
  function lodging() {
    const st = S().get();
    const hotels = S().allItems().filter(i => i.type === 'hotel');
    let html = '<div class="screen">';
    if (!hotels.length) html += '<div class="empty">עוד לא הוגדרה לינה</div>';
    hotels.forEach(h => {
      const day = h.dayId ? st.days[h.dayId] : null;
      html += C().lodgingRow(h, day);
    });
    html += '</div>';
    return { html, mapItems: hotels };
  }

  // ---------- costs ----------
  function costs() {
    const items = S().allItems();
    let activities = 0, stay = 0;
    const rows = [];
    items.forEach(i => {
      const t = (Number(i.meta && i.meta.cost) || 0) * (Number(i.meta && i.meta.qty) || 1);
      if (!t) return;
      if (i.type === 'hotel') stay += t; else activities += t;
      rows.push(i);
    });
    const total = activities + stay;
    let html = '<div class="screen">';
    html += '<div class="cost-summary">' +
      C().statBox(C().yen(total), 'סה"כ מוערך', '💴') +
      C().statBox(C().yen(activities), 'פעילויות', '🎯') +
      C().statBox(C().yen(stay), 'לינה', '🏨') + '</div>';
    html += '<div class="card">';
    rows.sort((a, b) => C().itemTotal(b) - C().itemTotal(a));
    html += rows.map(i => C().costRow(i)).join('');
    html += '</div>';
    html += '<div class="muted cost-note">הערכה לפי הנתונים שהוזנו. לא כולל טיסות וקניות אישיות.</div>';
    html += '</div>';
    return { html, mapItems: [] };
  }

  // ---------- summary ----------
  function summary() {
    const st = S().get();
    const items = S().allItems();
    let total = 0; items.forEach(i => total += C().itemTotal(i));
    const stops = items.filter(i => i.type !== 'hotel').length;
    const trip = st.meta.kansai || st.meta[Object.keys(st.meta)[0]] || {};
    let html = '<div class="screen">';
    html += '<div class="cost-summary">' +
      C().statBox(st.dayOrder.length, 'ימים', '📅') +
      C().statBox(stops, 'מקומות', '📍') +
      C().statBox(C().yen(total), 'עלות מוערכת', '💴') + '</div>';
    html += '<div class="card"><h3>' + C().esc(trip.title || 'הטיול') + '</h3>' +
      (trip.subtitle ? '<p class="muted">' + C().esc(trip.subtitle) + '</p>' : '') +
      kv('עונה', trip.season) + kv('כניסה', trip.entry) + kv('יציאה', trip.exit) + kv('תחבורה', trip.transport) + '</div>';
    html += '<div class="card"><h3>מסלול</h3>';
    st.dayOrder.forEach(did => {
      const d = st.days[did];
      const n = (d.itemOrder || []).length;
      html += '<div class="sum-day" data-goday="' + C().esc(did) + '">' +
        '<span class="day-badge">' + d.index + '</span>' +
        '<span class="sum-title">' + C().esc(d.title) + '</span>' +
        '<span class="muted">' + n + ' תחנות</span></div>';
    });
    html += '</div></div>';
    return { html, mapItems: [] };
  }
  function kv(k, v) { return v ? '<div class="kv"><span class="kv-k">' + C().esc(k) + '</span><span class="kv-v">' + C().esc(v) + '</span></div>' : ''; }

  const MAP = { planning, times, places, lodging, costs, summary };

  function renderActive() {
    if (!panel) return;
    const screen = S().get().ui.activeScreen || 'planning';
    const out = (MAP[screen] || planning)();
    panel.innerHTML = out.html;
    panel.scrollTop = 0;
    App.map.render(out.mapItems);
  }

  // ----- interactions -----
  function onClick(e) {
    const detail = e.target.closest('[data-detail]');
    if (detail) { App.detail.open(detail.dataset.detail); return; }
    const editday = e.target.closest('[data-editday]');
    if (editday) { App.detail.openDay(editday.dataset.editday); return; }
    const focus = e.target.closest('[data-focus]');
    if (focus) { const it = S().getItem(focus.dataset.focus); App.map.focus(it); return; }
    const goday = e.target.closest('[data-goday]');
    if (goday) { S().setUi({ activeDayId: goday.dataset.goday, activeScreen: 'planning' }); return; }
    const expand = e.target.closest('[data-expand]');
    if (expand) {
      const card = expand.closest('.place-card');
      if (card) { const ex = card.querySelector('.card-expand'); if (ex) ex.classList.toggle('open'); }
      return;
    }
  }

  function selectItem(itemId) {
    const it = S().getItem(itemId);
    if (it) { App.map.focus(it); App.detail.open(itemId); }
  }
  function hoverItem(itemId) {
    if (!panel) return;
    panel.querySelectorAll('.is-hover').forEach(x => x.classList.remove('is-hover'));
    const card = panel.querySelector('[data-item="' + itemId + '"]');
    if (card) card.classList.add('is-hover');
  }

  return { setPanel, renderActive, selectItem, hoverItem };
})();
