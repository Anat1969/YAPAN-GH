// ============================================================
// detail.js — the shared modal + read-only detail views for a
// single day and a single place/stop. Edit buttons hand off to
// edit.js.
// ============================================================
window.Modal = (function () {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const closeBtn = document.getElementById('modalClose');

  function open(node) {
    C.clear(content);
    C.append(content, node);
    overlay.classList.add('open');
  }
  function close() { overlay.classList.remove('open'); }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  return { open: open, close: close };
})();

window.Detail = (function () {

  function row(label, value) {
    if (value == null || value === '' || value === 0) return null;
    return C.el('div.kv', null, [
      C.el('span.kv-k', { text: label }),
      C.el('span.kv-v', { text: String(value) })
    ]);
  }

  function section(title, children) {
    const kids = (children || []).filter(Boolean);
    if (!kids.length) return null;
    return C.el('div.detail-section', null, [C.el('h4', { text: title })].concat(kids));
  }

  function openPlace(day, pt) {
    const it = pt.raw;
    const node = C.el('div.detail', null, [
      C.el('div.detail-head', null, [
        C.el('span.chip', { style: 'background:' + window.MapView.colorFor(it.type), text: window.TYPE_LABELS[it.type] || it.type }),
        C.el('h3', { text: (it.time ? it.time + ' · ' : '') + (it.name || '') }),
        it.nameEn ? C.el('div.detail-en', { text: it.nameEn }) : null
      ]),
      it.desc ? C.el('p.detail-desc', { text: it.desc }) : null,
      it.whyThisPlace ? section('למה דווקא כאן', [C.el('p', { text: it.whyThisPlace })]) : null,
      section('פרטים', [
        row('משך', it.duration),
        row('למי', it.forWho),
        row('כתובת', it.address),
        it.cost ? row('עלות', C ? window.C.yen(it.cost) : it.cost) : null
      ]),
      pt.hasCoords ? C.el('button.btn.btn-ghost', {
        text: '📍 מרכז במפה',
        on: { click: function () { window.Modal.close(); window.MapView.focus(pt.lat, pt.lng); } }
      }) : C.el('div.warn', { text: '⚠ אין מיקום למקום הזה' }),
      C.el('button.btn', {
        text: '✏️ עריכה',
        on: { click: function () { window.Edit.openItem(day, pt.itemIndex); } }
      })
    ]);
    window.Modal.open(node);
  }

  function openDay(day) {
    const fb = day.familyBalance || {};
    const ly = day.layers || {};
    const node = C.el('div.detail', null, [
      C.el('div.detail-head', null, [
        C.el('span.chip.chip-day', { text: 'יום ' + day.gday }),
        C.el('h3', { text: day.title || '' }),
        day.subtitle ? C.el('div.detail-en', { text: day.subtitle }) : null
      ]),
      day.story ? C.el('p.detail-desc', { text: day.story }) : null,
      section('שלוש שכבות', [
        row('שכלי', ly.intellectual), row('רגשי', ly.emotional), row('פיזי', ly.physical)
      ]),
      section('איזון משפחתי', [
        row('ענת', fb.anat), row('עילאי', fb.ilay), row('לוטם', fb.lotem), row('נתן', fb.natan)
      ]),
      day.drive && (day.drive.route || day.drive.time !== '0:00')
        ? section('מעבר', [row('זמן', day.drive.time), row('ק"מ', day.drive.km), row('מסלול', day.drive.route)]) : null,
      day.sleep && day.sleep.hotel
        ? section('לינה', [row('מקום', day.sleep.place), row('מלון', day.sleep.hotel), row('כתובת', day.sleep.address), day.sleep.cost ? row('עלות', window.C.yen(day.sleep.cost)) : null]) : null,
      day.food ? section('אוכל', [row('צמחוני', day.food.vegetarian), row('גלידה', day.food.iceCream), row('חובה לטעום', day.food.mustTry)]) : null,
      day.localGem && day.localGem.name
        ? section('פנינה מקומית', [C.el('strong', { text: day.localGem.name }), day.localGem.desc ? C.el('p', { text: day.localGem.desc }) : null, day.localGem.why ? C.el('p.muted', { text: day.localGem.why }) : null]) : null,
      day.skip ? section('לא כדאי', [C.el('p', { text: day.skip })]) : null,
      day.transportTip ? section('תחבורה', [C.el('p', { text: day.transportTip })]) : null,
      (day.tips && day.tips.length) ? section('טיפים', [C.el('ul', null, day.tips.map(function (t) { return C.el('li', { text: t }); }))]) : null,
      C.el('button.btn', { text: '✏️ עריכת היום', on: { click: function () { window.Edit.openDay(day); } } })
    ]);
    window.Modal.open(node);
  }

  return { openPlace: openPlace, openDay: openDay };
})();
