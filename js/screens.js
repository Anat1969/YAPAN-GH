// ============================================================
// screens.js — the six work layers shown in the right-hand panel.
// Each builder takes a view context and returns a DOM node.
//   ctx = { model, state, days }   (days = filtered, each with .fpoints)
// ============================================================
window.Screens = (function () {

  function empty(msg) { return C.el('div.empty', { text: msg || 'אין מה להציג' }); }

  function stopRow(day, pt) {
    return C.el('div.stop', {
      on: { click: function () { window.Detail.openPlace(day, pt); } }
    }, [
      C.el('span.stop-time', { text: pt.time || '' }),
      C.el('span.stop-dot', { style: 'background:' + window.MapView.colorFor(pt.type) }),
      C.el('div.stop-body', null, [
        C.el('div.stop-name', { text: pt.name || pt.nameEn || '' }),
        C.el('div.stop-meta', { text: [window.TYPE_LABELS[pt.type] || pt.type, pt.duration, pt.forWho].filter(Boolean).join(' · ') })
      ]),
      pt.cost ? C.el('span.stop-cost', { text: window.C.yen(pt.cost) }) : null,
      !pt.hasCoords ? C.el('span.stop-warn', { title: 'חסר מיקום', text: '⚠' }) : null
    ]);
  }

  function dayHeader(day) {
    return C.el('div.day-head', { on: { click: function () { window.Detail.openDay(day); } } }, [
      C.el('span.day-badge', { text: 'יום ' + day.gday }),
      C.el('div.day-titles', null, [
        C.el('div.day-title', { text: day.title || '' }),
        day.subtitle ? C.el('div.day-sub', { text: day.subtitle }) : null,
        day.area ? C.el('div.day-area', { text: '🧭 ' + day.area }) : null
      ]),
      day.experiencePhase ? C.el('span.phase phase-' + day.experiencePhase, { text: phaseLabel(day.experiencePhase) }) : null
    ]);
  }

  function phaseLabel(p) {
    return { ascending: '↗ עולה', peak: '★ שיא', descending: '↘ יורד', rest: '☾ מנוחה' }[p] || p;
  }

  // ---- 1. PLANNING -------------------------------------------------
  function planning(ctx) {
    if (!ctx.days.length) return empty('אין ימים. הוסיפי נתונים בקבצי data/.');
    return C.el('div.screen', null, ctx.days.map(function (day) {
      return C.el('div.card.day-card', null, [
        dayHeader(day),
        day.story ? C.el('p.day-story', { text: day.story }) : null,
        day.fpoints.length
          ? C.el('div.stop-list', null, day.fpoints.map(function (p) { return stopRow(day, p); }))
          : C.el('div.muted', { text: 'אין תחנות שמתאימות לסינון' })
      ]);
    }));
  }

  // ---- 2. TIMES ----------------------------------------------------
  function times(ctx) {
    if (!ctx.days.length) return empty();
    return C.el('div.screen', null, ctx.days.map(function (day) {
      return C.el('div.card', null, [
        C.el('div.times-head', null, [
          C.el('span.day-badge', { text: 'יום ' + day.gday }),
          C.el('strong', { text: day.title || '' }),
          C.el('span.muted', { text: '· קימה ' + (day.wakeUp || '—') })
        ]),
        C.el('div.timeline', null, day.fpoints.length ? day.fpoints.map(function (p) {
          return C.el('div.tl-row', null, [
            C.el('span.tl-time', { text: p.time || '' }),
            C.el('span.tl-line', { style: 'background:' + window.MapView.colorFor(p.type) }),
            C.el('div.tl-body', { on: { click: function () { window.Detail.openPlace(day, p); } } }, [
              C.el('div.tl-name', { text: p.name || '' }),
              C.el('div.tl-meta', { text: [p.duration, window.TYPE_LABELS[p.type] || p.type].filter(Boolean).join(' · ') })
            ])
          ]);
        }) : [empty('אין תחנות')])
      ]);
    }));
  }

  // ---- 3. PLACES ---------------------------------------------------
  function places(ctx) {
    const all = [];
    ctx.days.forEach(function (d) { d.fpoints.forEach(function (p) { all.push({ day: d, pt: p }); }); });
    if (!all.length) return empty('אין מקומות שמתאימים לסינון');
    const missing = all.filter(function (x) { return !x.pt.hasCoords; }).length;
    return C.el('div.screen', null, [
      C.el('div.places-count', { text: all.length + ' מקומות' + (missing ? ' · ' + missing + ' ללא מיקום' : '') }),
      C.el('div.places-grid', null, all.map(function (x) {
        return C.el('div.place-card', { on: { click: function () { window.Detail.openPlace(x.day, x.pt); } } }, [
          C.el('span.chip', { style: 'background:' + window.MapView.colorFor(x.pt.type), text: window.TYPE_LABELS[x.pt.type] || x.pt.type }),
          C.el('div.place-name', { text: x.pt.name || '' }),
          C.el('div.place-en', { text: x.pt.nameEn || '' }),
          C.el('div.place-meta', { text: 'יום ' + x.day.gday + (x.pt.time ? ' · ' + x.pt.time : '') }),
          x.pt.cost ? C.el('div.place-cost', { text: window.C.yen(x.pt.cost) }) : null
        ]);
      }))
    ]);
  }

  // ---- 4. LODGING --------------------------------------------------
  function lodging(ctx) {
    const cards = [];
    ctx.model.trips.forEach(function (trip) {
      (trip.lodging || []).forEach(function (l) {
        cards.push(C.el('div.card.lodge-card', null, [
          C.el('div.lodge-head', null, [
            C.el('strong', { text: l.place + (l.placeEn ? ' · ' + l.placeEn : '') }),
            C.el('span.chip.chip-soft', { text: l.type }),
            l.nights ? C.el('span.muted', { text: l.nights + ' לילות' }) : null
          ]),
          l.rec ? C.el('div.lodge-rec', { text: '🏨 ' + l.rec }) : null,
          C.el('div.lodge-times', { text: 'צ\'ק-אין ' + (l.checkIn || '—') + ' · צ\'ק-אאוט ' + (l.checkOut || '—') }),
          l.luggageNote ? C.el('div.lodge-note', { text: '🧳 ' + l.luggageNote }) : null,
          l.bookingUrl ? C.el('a.btn.btn-ghost', { href: l.bookingUrl, target: '_blank', rel: 'noopener', text: 'הזמנה ↗' }) : null
        ]));
      });
    });
    if (!cards.length) return empty('עוד לא הוגדרה לינה');
    return C.el('div.screen', null, cards);
  }

  // ---- 5. COSTS ----------------------------------------------------
  function costs(ctx) {
    let activities = 0, stay = 0;
    const rows = ctx.model.days.map(function (day) {
      let a = 0; (day.timeline || []).forEach(function (it) { a += window.Normalize.num(it.cost); });
      const s = day.sleep ? window.Normalize.num(day.sleep.cost) : 0;
      activities += a; stay += s;
      return C.el('div.cost-row', null, [
        C.el('span.cost-day', { text: 'יום ' + day.gday }),
        C.el('span.cost-title', { text: day.title || '' }),
        C.el('span.cost-a', { text: window.C.yen(a) }),
        C.el('span.cost-s', { text: window.C.yen(s) })
      ]);
    });
    const total = activities + stay;
    return C.el('div.screen', null, [
      C.el('div.cost-summary', null, [
        bigStat('סה"כ', window.C.yen(total)),
        bigStat('פעילויות', window.C.yen(activities)),
        bigStat('לינה', window.C.yen(stay))
      ]),
      C.el('div.card', null, [
        C.el('div.cost-row.cost-head', null, [
          C.el('span.cost-day', { text: '' }), C.el('span.cost-title', { text: 'יום' }),
          C.el('span.cost-a', { text: 'פעילויות' }), C.el('span.cost-s', { text: 'לינה' })
        ])
      ].concat(rows)),
      C.el('div.muted.cost-note', { text: 'הערכה לפי הנתונים שהוזנו. לא כולל טיסות, רכבות ארוכות וקניות אישיות.' })
    ]);
  }

  function bigStat(label, value) {
    return C.el('div.stat', null, [C.el('div.stat-v', { text: value }), C.el('div.stat-l', { text: label })]);
  }

  // ---- 6. SUMMARY --------------------------------------------------
  function summary(ctx) {
    const m = ctx.model;
    let stops = 0, total = 0;
    m.days.forEach(function (d) { stops += (d.timeline || []).length; total += window.Normalize.dayCost(d); });
    const trip = m.trips[0] || {};
    return C.el('div.screen', null, [
      C.el('div.cost-summary', null, [
        bigStat('ימים', String(m.days.length)),
        bigStat('מקומות', String(stops)),
        bigStat('עלות מוערכת', window.C.yen(total))
      ]),
      C.el('div.card', null, [
        C.el('h3', { text: trip.title || 'הטיול' }),
        trip.subtitle ? C.el('p.muted', { text: trip.subtitle }) : null,
        kv('עונה', trip.season), kv('כניסה', trip.entry), kv('יציאה', trip.exit), kv('תחבורה', trip.transport)
      ]),
      C.el('div.card', null, [C.el('h3', { text: 'מסלול' })].concat(
        m.days.map(function (d) {
          return C.el('div.sum-day', { on: { click: function () { window.Detail.openDay(d); } } }, [
            C.el('span.day-badge', { text: d.gday }),
            C.el('span.sum-title', { text: d.title || '' }),
            C.el('span.muted', { text: (d.timeline || []).length + ' תחנות' })
          ]);
        })
      ))
    ]);
  }

  function kv(k, v) {
    if (!v) return null;
    return C.el('div.kv', null, [C.el('span.kv-k', { text: k }), C.el('span.kv-v', { text: v })]);
  }

  const MAP = { planning: planning, times: times, places: places, lodging: lodging, costs: costs, summary: summary };

  function render(name, ctx, panel) {
    C.clear(panel);
    const fn = MAP[name] || planning;
    panel.appendChild(fn(ctx));
    panel.scrollTop = 0;
  }

  return { render: render };
})();
