// ============================================================
//  detail.js — מודאל פרטי פריט + עריכה מלאה
//  מה זה / איפה / למה חשוב / לאיזה יום / סטטוס / מה אפשר לעשות
//  פעולות: עריכה, בחירה, חלופה, שיוך ליום, עדיפות, סטטוס, מחיקה, מפה
// ============================================================
window.App = window.App || {};
App.detail = (function () {

  const C = () => App.components;
  const S = () => App.store;
  const E = () => App.edit;

  function open(itemId) {
    render(itemId);
    document.getElementById('modalOverlay').classList.add('open');
  }
  function close() { document.getElementById('modalOverlay').classList.remove('open'); }
  // פתיחת מודאל עם HTML כללי (לעזרה וכו')
  function openHtml(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('open');
  }

  function render(itemId) {
    const i = S().getItem(itemId);
    if (!i) return;
    const st = S().get();
    const day = i.dayId ? st.days[i.dayId] : null;

    const PRIORITIES = ['high', 'medium', 'low'];
    const STATUSES = ['proposed', 'selected', 'alternative', 'cancelled', 'done'];
    const PEOPLE = App.normalize.PEOPLE.concat(['כולם']);

    let html = '<div class="detail" data-itemid="' + i.id + '">';

    // כותרת (מה זה) — ניתן לעריכה
    html += '<div class="detail-section">' +
      '<input class="detail-name-input" data-edit="nameHe" value="' + C().esc(i.nameHe) + '" placeholder="שם">' +
      (i.nameEn ? '<div class="muted" style="font-size:0.7rem;direction:ltr">' + C().esc(i.nameEn) + '</div>' : '') +
    '</div>';

    // מטא: סוג + עדיפות + סטטוס
    html += '<div class="card-row" style="margin:8px 0">' + C().typeBadge(i.type) + '</div>';

    // שדות עלות (לפריטי cost / hotel)
    if (i.type === 'cost' || i.type === 'hotel') {
      const m = i.meta || {};
      const total = (Number(m.cost) || 0) * (Number(m.qty) || 1);
      html += '<div class="detail-section cost-edit"><div class="detail-label">💴 עלות</div>' +
        '<div class="detail-row2">' +
          '<div><div class="detail-label">מחיר ליחידה (¥)</div><input class="detail-input" type="number" data-cost="cost" value="' + (Number(m.cost) || 0) + '"></div>' +
          '<div><div class="detail-label">כמות</div><input class="detail-input" type="number" data-cost="qty" value="' + (Number(m.qty) || 1) + '"></div>' +
        '</div>' +
        '<div class="cost-edit-total">סה"כ: <strong>' + C().yen(total) + '</strong></div>' +
      '</div>';
    }

    // עדיפות (כפתורי מעוין)
    html += '<div class="detail-section"><div class="detail-label">עדיפות</div><div class="detail-opts">';
    PRIORITIES.forEach(p => {
      html += '<button class="opt-btn' + (i.priority === p ? ' active' : '') + '" data-setprio="' + p + '">' +
        C().priorityDiamond(p, { sm: true }) + ' ' + C().PRIORITY_LABEL[p] + '</button>';
    });
    html += '</div></div>';

    // סטטוס
    html += '<div class="detail-section"><div class="detail-label">סטטוס</div><div class="detail-opts">';
    STATUSES.forEach(s => {
      html += '<button class="opt-btn' + (i.status === s ? ' active' : '') + '" data-setstatus="' + s + '">' +
        C().STATUS_LABEL[s] + '</button>';
    });
    html += '</div></div>';

    // אנשים
    html += '<div class="detail-section"><div class="detail-label">למי מתאים</div><div class="detail-opts">';
    PEOPLE.forEach(p => {
      const on = (i.people || []).includes(p);
      html += '<button class="opt-btn' + (on ? ' active' : '') + '" data-toggleperson="' + p + '">' + p + '</button>';
    });
    html += '</div>';
    if (i.meta && i.meta.forWhoRaw) html += '<div class="muted" style="font-size:0.66rem;margin-top:4px">מקור: ' + C().esc(i.meta.forWhoRaw) + '</div>';
    html += '</div>';

    // תיאור (למה חשוב) — ניתן לעריכה
    html += '<div class="detail-section"><div class="detail-label">תיאור</div>' +
      '<textarea class="detail-textarea" data-edit="shortDescription" rows="3">' + C().esc(i.shortDescription) + '</textarea></div>';

    // סיבת בחירה + הערות משתמש
    html += '<div class="detail-section"><div class="detail-label">סיבת בחירה</div>' +
      '<input class="detail-input" data-edit="reasonToVisit" value="' + C().esc(i.reasonToVisit) + '" placeholder="למה לבקר כאן"></div>';
    html += '<div class="detail-section"><div class="detail-label">הערות שלי</div>' +
      '<textarea class="detail-textarea" data-edit="userNotes" rows="2" placeholder="הערות אישיות">' + C().esc(i.userNotes) + '</textarea></div>';

    // זמן ומשך
    html += '<div class="detail-row2">' +
      '<div class="detail-section"><div class="detail-label">שעה</div><input class="detail-input" data-edit="recommendedTime" value="' + C().esc(i.recommendedTime) + '"></div>' +
      '<div class="detail-section"><div class="detail-label">משך</div><input class="detail-input" data-edit="duration" value="' + C().esc(i.duration) + '"></div>' +
    '</div>';

    // קישור חיצוני
    html += '<div class="detail-section"><div class="detail-label">קישור</div>' +
      '<input class="detail-input" data-edit="externalLink" value="' + C().esc(i.externalLink) + '" placeholder="https://" dir="ltr">' +
      (i.externalLink ? ' <a href="' + C().esc(i.externalLink) + '" target="_blank" style="font-size:0.7rem">פתח ↗</a>' : '') + '</div>';

    // שיוך ליום (לאיזה יום)
    html += '<div class="detail-section"><div class="detail-label">יום במסלול</div>' +
      '<select class="detail-input" data-moveday><option value="">— ללא יום —</option>';
    st.dayOrder.forEach(did => {
      const dd = st.days[did];
      html += '<option value="' + did + '"' + (i.dayId === did ? ' selected' : '') + '>' +
        'יום ' + dd.index + ' · ' + C().esc(dd.title) + '</option>';
    });
    html += '</select></div>';

    // מיקום
    html += '<div class="detail-section"><div class="detail-label">מיקום במפה</div>';
    if (i.coordinates) {
      html += '<div class="muted" style="font-size:0.7rem">📍 ' + i.coordinates.lat.toFixed(4) + ', ' + i.coordinates.lng.toFixed(4) +
        ' <button class="opt-btn" data-focusmap>הצג</button></div>';
    } else {
      html += '<div class="muted" style="font-size:0.7rem">חסר מיקום' +
        (i.meta && i.meta.address ? ' · ' + C().esc(i.meta.address) : '') +
        ' <button class="opt-btn" data-pickmap>בחר על המפה</button></div>';
    }
    html += '</div>';

    // פעולות
    html += '<div class="detail-actions">' +
      '<button class="hdr-btn dark" data-focusmap>📍 במפה</button>' +
      '<button class="opt-btn danger" data-delete>🗑 מחק</button>' +
    '</div>';

    html += '</div>';
    document.getElementById('modalContent').innerHTML = html;
    bind(itemId);
  }

  function bind(itemId) {
    const root = document.getElementById('modalContent');

    // עריכת שדות טקסט (on change)
    root.querySelectorAll('[data-edit]').forEach(el => {
      el.addEventListener('change', () => {
        E().setField(itemId, el.dataset.edit, el.value);
        render(itemId); // רענון מקומי
      });
    });

    // עריכת עלות/כמות
    root.querySelectorAll('[data-cost]').forEach(el => {
      el.addEventListener('change', () => {
        const field = el.dataset.cost;
        if (field === 'cost') E().setCost(itemId, el.value, null);
        else E().setCost(itemId, null, el.value);
        render(itemId);
      });
    });

    // עדיפות
    root.querySelectorAll('[data-setprio]').forEach(b => b.addEventListener('click', () => {
      E().setPriority(itemId, b.dataset.setprio); render(itemId);
    }));
    // סטטוס
    root.querySelectorAll('[data-setstatus]').forEach(b => b.addEventListener('click', () => {
      E().setStatus(itemId, b.dataset.setstatus); render(itemId);
    }));
    // אנשים (toggle)
    root.querySelectorAll('[data-toggleperson]').forEach(b => b.addEventListener('click', () => {
      const i = S().getItem(itemId);
      const p = b.dataset.toggleperson;
      let ppl = (i.people || []).slice();
      if (p === 'כולם') { ppl = ['כולם']; }
      else {
        ppl = ppl.filter(x => x !== 'כולם');
        if (ppl.includes(p)) ppl = ppl.filter(x => x !== p); else ppl.push(p);
        if (!ppl.length) ppl = ['כולם'];
      }
      E().setPeople(itemId, ppl); render(itemId);
    }));
    // שיוך ליום
    const sel = root.querySelector('[data-moveday]');
    if (sel) sel.addEventListener('change', () => {
      const i = S().getItem(itemId);
      const toDay = sel.value;
      if (toDay) E().moveItemToDay(itemId, i.dayId || '', toDay, -1);
      else E().setField(itemId, 'dayId', '');
      render(itemId);
    });
    // מפה
    root.querySelectorAll('[data-focusmap]').forEach(b => b.addEventListener('click', () => {
      const i = S().getItem(itemId);
      if (i.coordinates) App.map.focus(i);
    }));
    // בחירת מיקום במפה
    const pick = root.querySelector('[data-pickmap]');
    if (pick) pick.addEventListener('click', () => {
      close();
      App.detail.startPickMode(itemId);
    });
    // מחיקה
    const del = root.querySelector('[data-delete]');
    if (del) del.addEventListener('click', () => {
      if (confirm('למחוק את "' + S().getItem(itemId).nameHe + '"?')) { E().deleteItem(itemId); close(); }
    });
  }

  // מצב בחירת מיקום: הקלקה הבאה על המפה מגדירה קואורדינטות
  let pickItemId = null;
  function startPickMode(itemId) {
    pickItemId = itemId;
    const mapEl = document.getElementById('leafletMap');
    mapEl.style.cursor = 'crosshair';
    const m = App.map.get();
    const handler = ev => {
      E().setCoordinates(pickItemId, ev.latlng.lat, ev.latlng.lng);
      mapEl.style.cursor = '';
      m.off('click', handler);
      // snippet להעתקה ל-coords-lookup
      console.log("App.coords['" + pickItemId + "'] = { lat: " + ev.latlng.lat.toFixed(4) + ", lng: " + ev.latlng.lng.toFixed(4) + " };");
      open(pickItemId);
      pickItemId = null;
    };
    m.on('click', handler);
    alert('לחץ על המפה כדי לקבוע את מיקום הפריט');
  }

  // ----- מודאל עריכת יום -----
  function openDay(dayId) {
    const d = S().getDay(dayId);
    if (!d) return;
    const st = S().get();
    const hotels = S().allItems().filter(i => i.type === 'hotel');

    let html = '<div class="detail">' +
      '<div class="detail-section"><div class="detail-label">כותרת היום</div>' +
        '<input class="detail-input" data-dayedit="title" value="' + C().esc(d.title) + '"></div>' +
      '<div class="detail-section"><div class="detail-label">תת-כותרת</div>' +
        '<input class="detail-input" data-dayedit="subtitle" value="' + C().esc(d.subtitle) + '"></div>' +
      '<div class="detail-section"><div class="detail-label">תאריך</div>' +
        '<input class="detail-input" data-dayedit="date" value="' + C().esc(d.date) + '" placeholder="13/7"></div>' +
      '<div class="detail-section"><div class="detail-label">עיר</div>' +
        '<input class="detail-input" data-dayedit="city" value="' + C().esc(d.city) + '"></div>' +
      '<div class="detail-section"><div class="detail-label">סיפור / רקע</div>' +
        '<textarea class="detail-textarea" data-dayedit="story" rows="4">' + C().esc(d.story) + '</textarea></div>' +
      '<div class="detail-section"><div class="detail-label">הערות</div>' +
        '<textarea class="detail-textarea" data-dayedit="notes" rows="2">' + C().esc(d.notes) + '</textarea></div>' +
      '<div class="detail-section"><div class="detail-label">לינה (מלון)</div>' +
        '<select class="detail-input" data-dayhotel><option value="">— ללא —</option>';
    hotels.forEach(h => {
      html += '<option value="' + h.id + '"' + (d.sleepRef === h.id ? ' selected' : '') + '>' + C().esc(h.nameHe) + '</option>';
    });
    html += '</select></div>' +
      '<div class="detail-actions">' +
        '<button class="hdr-btn dark" data-daytimes="' + dayId + '">🕐 פתח בזמנים</button>' +
      '</div></div>';

    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('open');

    const root = document.getElementById('modalContent');
    root.querySelectorAll('[data-dayedit]').forEach(el => el.addEventListener('change', () => {
      E().setDayField(dayId, el.dataset.dayedit, el.value);
    }));
    const hsel = root.querySelector('[data-dayhotel]');
    if (hsel) hsel.addEventListener('change', () => E().setDayHotel(dayId, hsel.value));
    const tBtn = root.querySelector('[data-daytimes]');
    if (tBtn) tBtn.addEventListener('click', () => {
      close(); S().setUi({ activeDayId: dayId, activeScreen: 'times' });
    });
  }

  return { open, openDay, openHtml, close, render, startPickMode };
})();
