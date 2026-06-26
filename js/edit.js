// ============================================================
// edit.js — edit forms for a day and a single stop. Writes back
// through Store (which persists to localStorage and triggers a
// full re-render via its onChange listeners).
// ============================================================
window.Edit = (function () {

  function field(label, name, value, type) {
    const input = (type === 'textarea')
      ? C.el('textarea.input', { name: name, rows: 3 })
      : C.el('input.input', { name: name, type: type || 'text', value: value == null ? '' : value });
    if (type === 'textarea') input.value = value == null ? '' : value;
    return C.el('label.edit-field', null, [C.el('span', { text: label }), input]);
  }

  function typeField(value) {
    const sel = C.el('select.input', { name: 'type' });
    Object.keys(window.TYPE_LABELS).forEach(function (k) {
      const o = C.el('option', { value: k, text: window.TYPE_LABELS[k] });
      if (k === value) o.selected = true;
      sel.appendChild(o);
    });
    return C.el('label.edit-field', null, [C.el('span', { text: 'סוג' }), sel]);
  }

  function values(form) {
    const out = {};
    form.querySelectorAll('[name]').forEach(function (i) { out[i.name] = i.value; });
    return out;
  }

  function openDay(day) {
    const form = C.el('form.edit-form', null, [
      C.el('h3', { text: 'עריכת יום ' + day.gday }),
      field('כותרת', 'title', day.title),
      field('כותרת משנה', 'subtitle', day.subtitle),
      field('אזור', 'area', day.area),
      field('שעת קימה', 'wakeUp', day.wakeUp),
      field('הסיפור', 'story', day.story, 'textarea'),
      buttons()
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = values(form);
      window.Store.updateDay(day.tripId, day.dayIndex, {
        title: v.title, subtitle: v.subtitle, area: v.area, wakeUp: v.wakeUp, story: v.story
      });
      window.Modal.close();
    });
    window.Modal.open(form);
  }

  function openItem(day, itemIndex) {
    const it = day.timeline[itemIndex] || {};
    const form = C.el('form.edit-form', null, [
      C.el('h3', { text: 'עריכת תחנה' }),
      C.el('div.edit-grid', null, [
        field('שעה', 'time', it.time),
        field('משך', 'duration', it.duration)
      ]),
      field('שם', 'name', it.name),
      field('שם באנגלית', 'nameEn', it.nameEn),
      typeField(it.type),
      field('למי', 'forWho', it.forWho),
      field('תיאור', 'desc', it.desc, 'textarea'),
      field('למה דווקא כאן', 'whyThisPlace', it.whyThisPlace, 'textarea'),
      field('כתובת', 'address', it.address),
      C.el('div.edit-grid', null, [
        field('Lat', 'lat', it.lat, 'number'),
        field('Lng', 'lng', it.lng, 'number'),
        field('עלות ¥', 'cost', it.cost, 'number')
      ]),
      buttons()
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const v = values(form);
      window.Store.updateItem(day.tripId, day.dayIndex, itemIndex, {
        time: v.time, duration: v.duration, name: v.name, nameEn: v.nameEn,
        type: v.type, forWho: v.forWho, desc: v.desc, whyThisPlace: v.whyThisPlace,
        address: v.address,
        lat: parseFloat(v.lat) || 0, lng: parseFloat(v.lng) || 0,
        cost: parseInt(v.cost, 10) || 0
      });
      window.Modal.close();
    });
    window.Modal.open(form);
  }

  function buttons() {
    return C.el('div.edit-actions', null, [
      C.el('button.btn', { type: 'submit', text: '💾 שמירה' }),
      C.el('button.btn.btn-ghost', { type: 'button', text: 'ביטול', on: { click: function () { window.Modal.close(); } } })
    ]);
  }

  return { openDay: openDay, openItem: openItem };
})();
