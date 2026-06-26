// ============================================================
//  app.js — boot. מחבר store → map → filters → screens.
//  מנוי אחד: בכל שינוי ב-store, רינדור המסך הפעיל + סנכרון מפה.
// ============================================================
window.App = window.App || {};

App.tabs = (function () {
  function sync() {
    const screen = App.store.get().ui.activeScreen;
    document.querySelectorAll('.app-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.screen === screen);
    });
  }
  return { sync };
})();

(function boot() {
  document.addEventListener('DOMContentLoaded', () => {
    // 1. אתחול מאגר (BASE + OVERRIDES)
    App.store.init();
    const st = App.store.get();

    // אבחון בקונסול (P1)
    console.log('יפן2: ' + st.dayOrder.length + ' ימים, ' +
      Object.keys(st.items).length + ' פריטים');

    // 2. כותרת
    const m = st.meta.hokkaido || {};
    document.getElementById('tripTitle').textContent = 'יפן · הוקאידו + טוקיו';
    document.getElementById('tripSub').textContent =
      st.dayOrder.length + ' ימים · ' + (m.transport || '');

    // 3. מפה — בחירה + ריחוף (סנכרון דו-כיווני עם הרשימה)
    App.map.init({
      onSelect: itemId => App.screens.selectItem(itemId),
      onHover: itemId => App.screens.hoverItem(itemId),
    });
    App.map.invalidate();

    // 4. פאנל מסך
    App.screens.setPanel(document.getElementById('screenPanel'));

    // 5. מקרא — עבר לקופסה על המפה; משאירים את ה-chrome נקי
    document.getElementById('legend').innerHTML = '';

    // 6. סרגל פילטרים — רינדור + קישור
    const filterBar = document.getElementById('filterBar');
    function renderFilters() {
      filterBar.innerHTML = App.filters.render(App.store.allItems(), App.store.get().ui.filters);
    }
    renderFilters();
    App.filters.bind(filterBar, () => App.store.get().ui.filters, filters => {
      App.store.setUi({ filters });
    });
    // סגירת תפריטי-פילטר נפתחים בלחיצה מחוץ לסרגל
    document.addEventListener('click', e => {
      if (!e.target.closest('.filter-dropdown') && !e.target.closest('#filterBar')) {
        App.filters.closeAll(filterBar);
      }
    });

    // 7. טאבים
    document.getElementById('appTabs').addEventListener('click', e => {
      const tab = e.target.closest('.app-tab');
      if (!tab) return;
      App.store.setUi({ activeScreen: tab.dataset.screen });
    });

    // 8. איפוס
    document.getElementById('btnReset').addEventListener('click', () => {
      if (confirm('לאפס את כל השינויים והבחירות לברירת המחדל?')) App.store.reset();
    });

    // 9. מודאל
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', e => {
      if (e.target.id === 'modalOverlay') closeModal();
    });

    // 10. מנוי מרכזי — כל שינוי ב-store מרנדר מחדש
    App.store.subscribe(() => {
      App.tabs.sync();
      renderFilters();
      App.screens.renderActive();
    });

    // רינדור ראשוני
    App.tabs.sync();
    App.screens.renderActive();
  });

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
  }
})();
