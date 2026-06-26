// ============================================================
//  filters.js — סרגל פילטרים + סינון פריטים
//  קבוצות: people, type, priority, status, city
// ============================================================
window.App = window.App || {};
App.filters = (function () {

  const C = function () { return App.components; };

  // החלת פילטרים על רשימת פריטים
  function apply(items, filters) {
    filters = filters || {};
    return items.filter(i => {
      if (filters.people) {
        const ppl = i.people || [];
        if (!ppl.includes(filters.people) && !ppl.includes('כולם')) return false;
      }
      if (filters.type && i.type !== filters.type) return false;
      if (filters.priority && i.priority !== filters.priority) return false;
      if (filters.status && i.status !== filters.status) return false;
      if (filters.city && i.city !== filters.city) return false;
      return true;
    });
  }

  // ספירה לפי ערך בקבוצה (על הבסיס המלא, לא המסונן)
  function counts(items, key) {
    const m = {};
    items.forEach(i => {
      let v = i[key];
      if (key === 'people') { (i.people || []).forEach(p => { m[p] = (m[p] || 0) + 1; }); return; }
      m[v] = (m[v] || 0) + 1;
    });
    return m;
  }

  // רינדור סרגל הפילטרים — כפתורי-תפריט נפתחים + שורת הסבר
  function render(allItems, filters) {
    const c = C();
    const peopleCounts = counts(allItems, 'people');
    const typeCounts = counts(allItems, 'type');
    const priorityCounts = counts(allItems, 'priority');
    const statusCounts = counts(allItems, 'status');
    const cityCounts = counts(allItems, 'city');

    const activeCount = ['people', 'priority', 'status', 'city', 'type'].filter(g => filters[g]).length;

    // שורת הסבר + עזרה + נקה
    let html = '<div class="filter-help-row">' +
      '<span class="filter-help-text">🔍 סננו את המסלול:</span>';

    // people
    html += c.filterDropdown({ group: 'people', icon: '👤', label: 'מי', activeValue: filters.people,
      options: App.normalize.PEOPLE.map(p => ({ value: p, label: p, count: peopleCounts[p] || 0 })) });

    // priority
    html += c.filterDropdown({ group: 'priority', icon: '⭐', label: 'עדיפות', activeValue: filters.priority,
      options: ['high', 'medium', 'low'].map(p => ({ value: p, label: c.PRIORITY_LABEL[p], count: priorityCounts[p] || 0 })) });

    // status
    html += c.filterDropdown({ group: 'status', icon: '🏷', label: 'סטטוס', activeValue: filters.status,
      options: ['selected', 'alternative', 'proposed', 'done', 'cancelled']
        .filter(s => statusCounts[s])
        .map(s => ({ value: s, label: c.STATUS_LABEL[s], count: statusCounts[s] })) });

    // city
    html += c.filterDropdown({ group: 'city', icon: '📍', label: 'עיר', activeValue: filters.city,
      options: Object.keys(cityCounts).map(city => ({ value: city, label: city, count: cityCounts[city] })) });

    // type
    html += c.filterDropdown({ group: 'type', icon: '🔖', label: 'סוג', activeValue: filters.type,
      options: Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a])
        .map(t => ({ value: t, label: c.TYPE_LABEL[t] || t, count: typeCounts[t] })) });

    // כפתור עזרה + נקה הכל
    html += '<button class="filter-help-btn" id="btnFilterHelp" title="איך זה עובד?">?</button>';
    if (activeCount) html += '<button class="filter-clear-all" id="btnFilterClearAll">✕ נקה הכל (' + activeCount + ')</button>';
    html += '</div>';

    return html;
  }

  // מודאל הסבר על הסרגל
  function helpHtml() {
    return '<div class="filter-help-modal">' +
      '<h3 style="margin-bottom:10px">🔍 איך עובדים המסננים?</h3>' +
      '<p style="font-size:0.82rem;color:#555;line-height:1.6;margin-bottom:12px">המסננים מצמצמים את מה שמוצג ברשימה ובמפה. אפשר <strong>לשלב כמה יחד</strong> — וכל שינוי מתעדכן מיד גם במפה.</p>' +
      '<table class="filter-help-table">' +
      '<tr><td>👤 <strong>מי</strong></td><td>פעילויות שמתאימות לבן משפחה מסוים (+ לכולם). המספר = כמה פריטים מתאימים לו.</td></tr>' +
      '<tr><td>⭐ <strong>עדיפות</strong></td><td>חשיבות הפריט. "גבוהה" = ה-must של הטיול.</td></tr>' +
      '<tr><td>🏷 <strong>סטטוס</strong></td><td>מצב ההחלטה: נבחר / חלופה / מוצע. שימושי כשמכריעים מה נכנס.</td></tr>' +
      '<tr><td>📍 <strong>עיר</strong></td><td>אזור בטיול: קנסאי / הוקאידו / טוקיו.</td></tr>' +
      '<tr><td>🔖 <strong>סוג</strong></td><td>סוג הפעילות: מקדש / אוכל / טבע / אדריכלות...</td></tr>' +
      '</table>' +
      '<p style="font-size:0.78rem;color:#16697a;margin-top:12px;background:rgba(22,105,122,0.06);padding:8px 10px;border-radius:8px">' +
      '💡 <strong>דוגמה:</strong> בחרו "מי: עילאי" + "עיר: קנסאי" + "סטטוס: חלופה" → תראו רק את מה שצריך להכריע לעילאי בקנסאי.</p>' +
      '</div>';
  }

  // האזנה ללחיצות
  function bind(container, getFilters, onChange) {
    container.addEventListener('click', e => {
      // כפתור עזרה
      if (e.target.id === 'btnFilterHelp') {
        App.detail.openHtml ? App.detail.openHtml(helpHtml()) : openHelpModal();
        return;
      }
      // נקה הכל
      if (e.target.id === 'btnFilterClearAll') {
        onChange({ people: null, type: null, priority: null, status: null, city: null });
        return;
      }
      // פתיחה/סגירה של dropdown
      const toggle = e.target.closest('[data-fdtoggle]');
      if (toggle) {
        const dd = toggle.closest('.filter-dropdown');
        const wasOpen = dd.classList.contains('open');
        container.querySelectorAll('.filter-dropdown.open').forEach(x => {
          x.classList.remove('open');
          const p = x.querySelector('.fd-panel'); if (p) p.removeAttribute('style');
        });
        if (!wasOpen) {
          dd.classList.add('open');
          // מיקום ה-panel ב-fixed כדי לא להיחתך ע"י overflow של הסרגל
          const panel = dd.querySelector('.fd-panel');
          const rect = toggle.getBoundingClientRect();
          if (panel) {
            panel.style.position = 'fixed';
            panel.style.top = (rect.bottom + 5) + 'px';
            panel.style.right = (window.innerWidth - rect.right) + 'px';
            panel.style.left = 'auto';
          }
        }
        return;
      }
      // בחירת אפשרות (כולל ביטול)
      const opt = e.target.closest('[data-fgroup]');
      if (opt) {
        const group = opt.dataset.fgroup;
        const value = opt.dataset.fvalue;
        const filters = Object.assign({}, getFilters());
        filters[group] = (value === '' || filters[group] === value) ? null : value;
        onChange(filters);
        return;
      }
    });
  }

  // סגירת dropdowns בלחיצה מחוץ
  function closeAll(container) {
    container.querySelectorAll('.filter-dropdown.open').forEach(x => x.classList.remove('open'));
  }

  // מודאל עזרה fallback (אם אין App.detail.openHtml)
  function openHelpModal() {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalContent').innerHTML = helpHtml();
    overlay.classList.add('open');
  }

  return { apply, render, bind, counts, closeAll, helpHtml };
})();
