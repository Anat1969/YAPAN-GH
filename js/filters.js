// ============================================================
// filters.js — the always-visible filter bar + colour legend.
// Filters by person, activity type, and day. Emits a new filter
// state object to app.js, which re-renders everything.
// ============================================================
window.TYPE_LABELS = {
  culture: 'תרבות', nature: 'טבע', food: 'אוכל', shopping: 'קניות',
  sport: 'ספורט', walk: 'הליכה', architecture: 'אדריכלות', temple: 'מקדש',
  market: 'שוק', workshop: 'סדנה', view: 'נוף'
};

window.PEOPLE = [
  { key: 'ענת', label: 'ענת' },
  { key: 'עילאי', label: 'עילאי' },
  { key: 'לוטם', label: 'לוטם' },
  { key: 'נתן', label: 'נתן' }
];

window.Filters = (function () {

  // does a timeline item / point match the active person filter?
  function matchPerson(forWho, person) {
    if (person === 'all') return true;
    if (!forWho) return false;
    return forWho.indexOf(person) !== -1 || forWho.indexOf('כולם') !== -1;
  }

  function matchType(type, t) { return t === 'all' || type === t; }

  function select(value, options, onChange) {
    const sel = C.el('select.filter-select');
    options.forEach(function (o) {
      const opt = C.el('option', { value: o.value });
      opt.textContent = o.label;
      if (String(o.value) === String(value)) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () { onChange(sel.value); });
    return sel;
  }

  function render(container, state, model, onChange) {
    C.clear(container);

    // person filter
    const people = [{ value: 'all', label: '👥 כולם' }]
      .concat(window.PEOPLE.map(function (p) { return { value: p.key, label: p.label }; }));
    container.appendChild(wrap('מי', select(state.person, people, function (v) {
      onChange({ person: v });
    })));

    // type filter
    const types = [{ value: 'all', label: 'כל הסוגים' }]
      .concat(Object.keys(window.TYPE_LABELS).map(function (k) {
        return { value: k, label: window.TYPE_LABELS[k] };
      }));
    container.appendChild(wrap('סוג', select(state.type, types, function (v) {
      onChange({ type: v });
    })));

    // day filter
    const days = [{ value: 'all', label: 'כל הימים' }]
      .concat(model.days.map(function (d) {
        return { value: String(d.gday), label: 'יום ' + d.gday + ' · ' + (d.title || '') };
      }));
    container.appendChild(wrap('יום', select(state.day, days, function (v) {
      onChange({ day: v });
    })));
  }

  function wrap(label, control) {
    return C.el('label.filter-group', null, [
      C.el('span.filter-label', { text: label }), control
    ]);
  }

  function legend(container) {
    C.clear(container);
    container.style.display = 'flex';
    Object.keys(window.TYPE_LABELS).forEach(function (k) {
      container.appendChild(C.el('span.legend-item', null, [
        C.el('span.legend-dot', { style: 'background:' + window.MapView.colorFor(k) }),
        C.el('span', { text: window.TYPE_LABELS[k] })
      ]));
    });
  }

  return { render: render, legend: legend, matchPerson: matchPerson, matchType: matchType };
})();
