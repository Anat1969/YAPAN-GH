// ============================================================
//  components.js — רכיבים חוזרים טהורים: (data) → HTML string
//  אינם קוראים מה-store. מקבלים הכל מבחוץ.
// ============================================================
window.App = window.App || {};
App.components = (function () {

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ----- תוויות -----
  const PRIORITY_LABEL = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' };
  const STATUS_LABEL = { proposed: 'מוצע', selected: 'נבחר', alternative: 'חלופה', cancelled: 'בוטל', done: 'בוצע' };
  const TYPE_LABEL = {
    drive: 'נסיעה', station: 'תחנה', transit: 'מעבר', logistics: 'לוגיסטיקה',
    hotel: 'לינה', restaurant: 'מסעדה', food: 'אוכל', attraction: 'אטרקציה',
    district: 'רובע', view: 'תצפית', hike: 'הליכה', swim: 'רחצה', water: 'מים',
    onsen: 'אונסן', culture: 'תרבות', walk: 'טיול', sport: 'ספורט',
    shopping: 'קניות', rest: 'מנוחה', nature: 'טבע', note: 'הערה', cost: 'עלות',
    architecture: 'אדריכלות', temple: 'מקדש', market: 'שוק', workshop: 'סדנה',
  };
  const TYPE_ICON = {
    drive: '🚗', station: '🚉', transit: '🚆', logistics: '🧳', hotel: '🏨',
    restaurant: '🍴', food: '🍽', attraction: '📍', district: '🏙', view: '👁',
    hike: '🥾', swim: '🏊', water: '🚤', onsen: '♨️', culture: '🎎', walk: '🚶',
    sport: '🏃', shopping: '🛍', rest: '☕', nature: '🌿', note: '📝', cost: '💴',
    architecture: '🏛', temple: '⛩', market: '🏪', workshop: '🛠',
  };
  // קטגוריות עלות
  const COST_CATS = {
    flights:   { label: 'טיסות', icon: '✈️' },
    hotels:    { label: 'מלונות', icon: '🏨' },
    car:       { label: 'רכב', icon: '🚗' },
    trains:    { label: 'רכבות', icon: '🚆' },
    transport: { label: 'תחבורה ציבורית', icon: '🚇' },
    other:     { label: 'אחר', icon: '💴' },
  };
  // טיפ חיסכון לכל קטגוריה (תוכן קבוע)
  const COST_TIPS = {
    flights: 'טיסות פנים יפניות: השוו ANA/JAL מול חברות לואו-קוסט (Peach, Jetstar). הזמנה 2-3 חודשים מראש מוזילה משמעותית. בדקו טיסה לאוסקה (KIX) במקום טוקיו אם זול יותר.',
    hotels: 'ריוקאן עם חצי-פנסיון לרוב משתלם יותר ממלון + אוכל בנפרד. אזורי אונסן כפריים זולים מהערים. בוקינג עם ביטול חינם שומר גמישות.',
    car: 'השוו Toyota / Nippon / Times. ביטוח מלא (CDW) מומלץ. החזרה בנקודה שונה (one-way) לרוב בתוספת — בדקו אם משתלם מול רכבת. ETC card לכבישי אגרה.',
    trains: 'JR Hokkaido Rail Pass מול כרטיסים בודדים — תלוי בכמות הנסיעות. IC card (Suica/ICOCA) לנסיעות קצרות. הזמנת מושב שמור ל-Shinkansen מראש.',
    transport: 'כרטיס יומי/שבועי במטרו זול מכרטיסים בודדים. IC card נוח וחוסך. באזורים צפופים (אסאקוסה, שיבויה) הליכה מהירה מרכבת.',
    other: 'כרטיסים משולבים לאטרקציות. כניסות מראש אונליין לרוב זולות. מים מקומביני במקום מסעדה.',
  };

  // ----- מעוין עדיפות -----
  function priorityDiamond(priority, opts) {
    opts = opts || {};
    const cls = 'diamond ' + (opts.sm ? 'sm ' : '') + 'p-' + (priority || 'medium');
    const num = opts.num != null ? '<span class="dnum">' + opts.num + '</span>' : '';
    const wrap = num ? 'position:relative;' : '';
    return '<span class="' + cls + '" style="' + wrap + '">' + num + '</span>';
  }

  // ----- status pill -----
  function statusPill(status) {
    const s = status || 'proposed';
    return '<span class="status-pill status-' + s + '">' + esc(STATUS_LABEL[s] || s) + '</span>';
  }

  // ----- type badge -----
  function typeBadge(type) {
    const t = type || 'note';
    return '<span class="type-badge">' + (TYPE_ICON[t] || '') + ' ' + esc(TYPE_LABEL[t] || t) + '</span>';
  }

  // ----- people chips -----
  function peopleTags(people) {
    if (!people || !people.length) return '';
    return '<span class="people-tags">' + people.map(p =>
      '<span class="person-chip' + (p === 'כולם' ? ' all' : '') + '">' + esc(p) + '</span>'
    ).join('') + '</span>';
  }

  // ----- כפתור-תפריט פילטר נפתח -----
  // opts: { group, icon, label, options:[{value,label,count}], activeValue }
  function filterDropdown(opts) {
    const active = opts.activeValue;
    const activeLabel = active
      ? (opts.options.find(o => o.value === active) || {}).label || active
      : '';
    const triggerLabel = active
      ? opts.icon + ' ' + esc(opts.label) + ': <strong>' + esc(activeLabel) + '</strong>'
      : opts.icon + ' ' + esc(opts.label);
    const panel = opts.options.map(o =>
      '<button class="fd-opt' + (o.value === active ? ' active' : '') + '" ' +
        'data-fgroup="' + esc(opts.group) + '" data-fvalue="' + esc(o.value) + '">' +
        esc(o.label) + '<span class="fd-opt-count">' + (o.count || 0) + '</span>' +
      '</button>'
    ).join('');
    return '<div class="filter-dropdown' + (active ? ' has-active' : '') + '" data-fdgroup="' + esc(opts.group) + '">' +
      '<button class="fd-trigger" data-fdtoggle="' + esc(opts.group) + '">' + triggerLabel + ' <span class="fd-caret">▾</span></button>' +
      '<div class="fd-panel">' + panel +
        (active ? '<button class="fd-clear-one" data-fgroup="' + esc(opts.group) + '" data-fvalue="">✕ בטל בחירה</button>' : '') +
      '</div>' +
    '</div>';
  }

  // ----- כפתור פילטר (שורה — נשאר לתאימות) -----
  function filterButton(opts) {
    // opts: { label, value, group, active, count }
    const badge = opts.count != null ? '<span class="badge">' + opts.count + '</span>' : '';
    return '<button class="filter-btn' + (opts.active ? ' active' : '') + '" ' +
      'data-fgroup="' + esc(opts.group) + '" data-fvalue="' + esc(opts.value == null ? '' : opts.value) + '">' +
      (opts.dot ? '<span style="width:8px;height:8px;border-radius:50%;background:' + opts.dot + '"></span>' : '') +
      esc(opts.label) + badge + '</button>';
  }

  // ----- פורמט מחיר בין -----
  function yen(n) {
    n = Number(n) || 0;
    return '¥' + n.toLocaleString('en-US');
  }
  // עלות רשומה = cost × qty
  function itemTotal(item) {
    const m = item.meta || {};
    return (Number(m.cost) || 0) * (Number(m.qty) || 1);
  }

  // ----- רשומת עלות -----
  function costRow(item) {
    const m = item.meta || {};
    const qty = Number(m.qty) || 1;
    const cost = Number(m.cost) || 0;
    const total = cost * qty;
    const who = (item.people && item.people.length) ? item.people.join(', ') : 'כולם';
    return '<div class="cost-row" data-item="' + esc(item.id) + '">' +
      '<div class="cost-row-main">' +
        '<div class="cost-row-name">' + esc(item.nameHe) + '</div>' +
        '<div class="cost-row-sub muted">' + esc(who) +
          (qty > 1 ? ' · ' + qty + ' × ' + yen(cost) : '') +
          (m.note ? ' · ' + esc(m.note) : '') + '</div>' +
      '</div>' +
      '<div class="cost-row-total">' + yen(total) + '</div>' +
      '<button class="opt-btn detail-trigger" data-detail="' + esc(item.id) + '">✎</button>' +
    '</div>';
  }

  // ----- כרטיס טיפ חיסכון -----
  function costTipCard(cat) {
    const tip = COST_TIPS[cat];
    if (!tip) return '';
    return '<div class="cost-tip"><span class="cost-tip-icon">💡</span> ' + esc(tip) + '</div>';
  }

  // ----- קופסת מספר (סטטיסטיקה) -----
  function statBox(num, label, icon) {
    return '<div class="stat-box"><div class="stat-icon">' + (icon || '') + '</div>' +
      '<div class="stat-num">' + esc(num) + '</div>' +
      '<div class="stat-label">' + esc(label) + '</div></div>';
  }

  // ----- בלוק סיכום מתקפל (רכיב חוזר) -----
  function summaryBlock(id, icon, title, bodyHtml, opts) {
    opts = opts || {};
    const open = opts.open ? ' open' : '';
    const arrow = opts.open ? '▴' : '▾';
    return '<div class="sum-block" data-block="' + esc(id) + '">' +
      '<div class="sum-block-head" data-blocktoggle="' + esc(id) + '">' +
        '<span class="sum-block-title">' + icon + ' ' + esc(title) + '</span>' +
        (opts.extra || '') +
        '<span class="sum-block-arrow">' + arrow + '</span>' +
      '</div>' +
      '<div class="sum-block-body' + open + '">' + bodyHtml + '</div>' +
    '</div>';
  }

  // ----- שורת קישור -----
  function linkRow(item) {
    return '<div class="link-row">' +
      typeBadge(item.type) +
      '<span class="link-name">' + esc(item.nameHe) + '</span>' +
      '<a class="link-go" href="' + esc(item.externalLink) + '" target="_blank">פתח ↗</a>' +
    '</div>';
  }

  // ----- מקרא מרוכז (קופסה אחת על המפה) -----
  function legendBox() {
    return '<div class="mlo-title">מקרא</div>' +
      '<div class="mlo-row"><span class="mlo-start">▶</span> תחילת יום</div>' +
      '<div class="mlo-row"><span class="mlo-end">■</span> סוף יום</div>' +
      '<div class="mlo-row"><span class="mlo-hotel">🏨</span> לינה</div>' +
      '<div class="mlo-row"><span class="mlo-numd">1</span> יעד (לפי סדר)</div>' +
      '<div class="mlo-row">' + priorityDiamond('high', { sm: true }) + ' עדיפות גבוהה</div>' +
      '<div class="mlo-row">' + priorityDiamond('medium', { sm: true }) + ' בינונית</div>' +
      '<div class="mlo-row">' + priorityDiamond('low', { sm: true }) + ' נמוכה</div>' +
      '<div class="mlo-row"><span class="mlo-route"></span> מסלול היום</div>';
  }

  // ----- מקרא (שורה — בשימוש ב-chrome, נשאר לתאימות) -----
  function legend() {
    return [
      '<div class="legend-item">' + priorityDiamond('high', { sm: true }) + ' עדיפות גבוהה</div>',
      '<div class="legend-item">' + priorityDiamond('medium', { sm: true }) + ' בינונית</div>',
      '<div class="legend-item">' + priorityDiamond('low', { sm: true }) + ' נמוכה</div>',
      '<div class="legend-item">' + statusPill('selected') + '</div>',
      '<div class="legend-item">' + statusPill('alternative') + '</div>',
      '<div class="legend-item">' + statusPill('proposed') + '</div>',
    ].join('');
  }

  // ----- כרטיס מקום (עם כרטיסייה נפתחת לכל המידע) -----
  function placeCard(item, opts) {
    opts = opts || {};
    const i = item;
    const m = i.meta || {};
    const noLoc = !i.coordinates ? '<span class="muted" style="font-size:0.62rem">📍 חסר מיקום</span>' : '';
    const hasExtra = (m.streets && m.streets.length) || (m.activities && m.activities.length) ||
      (m.highlights && m.highlights.length) || m.book || m.bestTime || i.reasonToVisit || i.userNotes;

    let expand = '';
    if (opts.expandable && hasExtra) {
      expand = '<div class="card-expand">';
      if (m.bestTime) expand += '<div class="ce-line"><strong>🕐 מתי:</strong> ' + esc(m.bestTime) + '</div>';
      if (m.streets && m.streets.length) {
        expand += '<div class="ce-sec"><div class="ce-h">🛣 רחובות מרכזיים</div>' +
          m.streets.map(s => '<div class="ce-item"><strong>' + esc(s.name) + '</strong>' + (s.desc ? ' — ' + esc(s.desc) : '') + '</div>').join('') + '</div>';
      }
      if (m.activities && m.activities.length) {
        expand += '<div class="ce-sec"><div class="ce-h">✦ מה לעשות</div>' +
          m.activities.map(a => '<div class="ce-item"><strong>' + esc(a.name) + '</strong>' +
            (a.duration ? ' <span class="muted">⏱' + esc(a.duration) + '</span>' : '') +
            (a.desc ? '<br>' + esc(a.desc) : '') + '</div>').join('') + '</div>';
      }
      if (m.highlights && m.highlights.length) {
        expand += '<div class="ce-sec"><div class="ce-h">★ עיקרי</div>' +
          m.highlights.map(h => '<div class="ce-item"><strong>' + esc(h.name) + '</strong>' +
            (h.duration ? ' <span class="muted">⏱' + esc(h.duration) + '</span>' : '') +
            (h.desc ? '<br>' + esc(h.desc) : '') + '</div>').join('') + '</div>';
      }
      if (m.book) expand += '<div class="ce-line"><strong>📅 הזמנה:</strong> ' + esc(m.book) + '</div>';
      if (i.reasonToVisit) expand += '<div class="ce-line why-line"><strong>✨ למה דווקא כאן:</strong> ' + esc(i.reasonToVisit) + '</div>';
      if (m.isGem) expand += '<div class="ce-line gem-line"><strong>💎 פנינה נסתרת</strong></div>';
      if (i.userNotes) expand += '<div class="ce-line"><strong>הערות:</strong> ' + esc(i.userNotes) + '</div>';
      expand += '</div>';
    }

    return '<div class="card place-card' + (opts.active ? ' is-active' : '') + '" data-item="' + esc(i.id) + '">' +
      '<div class="card-head">' +
        priorityDiamond(i.priority, { sm: true }) +
        '<span class="card-title place-link" data-focus="' + esc(i.id) + '">' + esc(i.nameHe) + '</span>' +
        (i.nameEn ? '<span class="card-romaji">' + esc(i.nameEn) + '</span>' : '') +
      '</div>' +
      (i.shortDescription ? '<div class="card-desc">' + esc(i.shortDescription) + '</div>' : '') +
      '<div class="card-row">' + typeBadge(i.type) + statusPill(i.status) + peopleTags(i.people) + noLoc +
        (expand ? '<button class="opt-btn ce-toggle" data-expand="' + esc(i.id) + '">▾ עוד</button>' : '') +
        '<button class="opt-btn detail-trigger" data-detail="' + esc(i.id) + '" style="margin-right:auto">✎ פרטים</button>' +
      '</div>' +
      expand +
    '</div>';
  }

  // ----- כרטיס יום -----
  function dayCard(day, opts) {
    opts = opts || {};
    const d = day;
    const drive = d.drive ? '<span class="drive-badge">🚗 ' + esc(d.drive.time) + ' · ' + esc(d.drive.km) + ' ק"מ</span>' : '';
    const sleep = opts.sleepName ? '<span class="drive-badge" style="background:rgba(22,105,122,0.1);border-color:rgba(22,105,122,0.22);color:#16697a">🏨 ' + esc(opts.sleepName) + '</span>' : '';
    const cityLabel = d.cityEn === 'Hokkaido' ? '🏔 הוקאידו' : d.cityEn === 'Osaka' ? '🏯 אוסקה' : '🗼 טוקיו';
    return '<div class="card day-card" data-day="' + esc(d.id) + '">' +
      '<div class="day-card-hero">' + cityLabel + ' · יום ' + d.index + (d.date ? ' · ' + esc(d.dow || '') + ' ' + esc(d.date) : '') + '</div>' +
      '<div class="card-head"><span class="card-title">' + esc(d.title) + '</span>' +
        '<button class="opt-btn detail-trigger" data-editday="' + esc(d.id) + '">✎ ערוך יום</button></div>' +
      (d.subtitle ? '<div class="muted" style="font-size:0.72rem">' + esc(d.subtitle) + '</div>' : '') +
      (d.story ? '<div class="day-card-story">' + esc(d.story) + '</div>' : '') +
      '<div class="card-row">' + drive + sleep + '</div>' +
    '</div>';
  }

  // ----- רשומת לינה (מסך לינה) -----
  // hotel = פריט מלון, day = אובייקט היום המשויך
  function lodgingRow(hotel, day) {
    const m = hotel.meta || {};
    const num = day ? day.index : '?';
    const date = day ? (day.dow ? day.dow + ' ' + day.date : day.date) : '';
    const STATUS_BTNS = [
      { st: 'alternative', label: 'חלופה' },
      { st: 'proposed', label: 'לא סופי' },
      { st: 'selected', label: 'סופי' },
    ];
    const btns = STATUS_BTNS.map(b =>
      '<button class="lodge-st-btn st-' + b.st + (hotel.status === b.st ? ' active' : '') + '" ' +
        'data-lodgestatus="' + b.st + '" data-item="' + esc(hotel.id) + '">' + b.label + '</button>'
    ).join('');
    const dateRange = (m.checkinDate && m.checkoutDate)
      ? '<span class="lodge-dates">📅 ' + m.checkinDate.slice(5) + ' → ' + m.checkoutDate.slice(5) + '</span>' : '';
    const links =
      (m.bookingUrl ? '<a class="hotel-link book" href="' + esc(m.bookingUrl) + '" target="_blank">🛏 המלון</a>' : '') +
      (m.bookingAreaUrl ? '<a class="hotel-link book-area" href="' + esc(m.bookingAreaUrl) + '" target="_blank">🔍 מלונות באזור</a>' : '') +
      (m.mapsUrl ? '<a class="hotel-link maps" href="' + esc(m.mapsUrl) + '" target="_blank">📍 מפות</a>' : '');
    const details = [hotel.shortDescription, m.recommended, m.nearestStation].filter(Boolean).join(' · ');

    return '<div class="card lodging-row status-edge-' + hotel.status + '" data-item="' + esc(hotel.id) + '">' +
      '<div class="lodge-head">' +
        '<div class="lodge-num">' + num + '</div>' +
        '<div class="lodge-headinfo">' +
          '<div class="lodge-date">' + esc(date) + '</div>' +
          '<div class="lodge-area">' + esc(hotel.district || hotel.city || '') + '</div>' +
        '</div>' +
        statusPill(hotel.status) +
      '</div>' +
      '<div class="lodge-name">' + esc(hotel.nameHe) +
        (hotel.nameEn ? ' <span class="card-romaji">' + esc(hotel.nameEn) + '</span>' : '') + '</div>' +
      (dateRange ? '<div class="lodge-dates-row">' + dateRange + '</div>' : '') +
      (details ? '<div class="lodge-details">' + esc(details) + '</div>' : '') +
      '<div class="lodge-links">' + links +
        '<button class="opt-btn detail-trigger" data-detail="' + esc(hotel.id) + '">✎ פרטים</button>' +
      '</div>' +
      '<div class="lodge-st-btns">' + btns + '</div>' +
    '</div>';
  }

  // ----- לוח שנה חודשי עם סימון ימי טיול -----
  // dayByDate: { 'YYYY-MM-DD': dayObj }
  function calendar(year, month, dayByDate, activeDayId) {
    const DOW = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    const HE_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי',
      'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const first = new Date(year, month, 1).getDay();
    const daysIn = new Date(year, month + 1, 0).getDate();
    const cityClass = { 'Kansai': 'cal-osaka', 'Osaka': 'cal-osaka', 'Hokkaido': 'cal-hokkaido', 'Tokyo': 'cal-tokyo', 'Flight': 'cal-flight' };

    // האם יום הטיול בחודש זה? (להצגת idx נכון)

    let cells = DOW.map(d => '<div class="cal-dow">' + d + '</div>').join('');
    for (let i = 0; i < first; i++) cells += '<div class="cal-empty"></div>';
    for (let dd = 1; dd <= daysIn; dd++) {
      const key = year + '-' + pad2(month + 1) + '-' + pad2(dd);
      const day = dayByDate[key];
      if (day) {
        const cc = cityClass[day.cityEn] || '';
        const active = day.id === activeDayId ? ' active' : '';
        cells += '<div class="cal-day trip ' + cc + active + '" data-goday="' + day.id + '" title="' + esc(day.title) + '">' +
          '<span class="cal-num">' + dd + '</span><span class="cal-idx">י' + day.index + '</span></div>';
      } else {
        cells += '<div class="cal-day"><span class="cal-num muted">' + dd + '</span></div>';
      }
    }
    return '<div class="calendar"><div class="cal-title">' + HE_MONTHS[month] + ' ' + year + '</div>' +
      '<div class="cal-grid">' + cells + '</div></div>';
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  return {
    esc, priorityDiamond, statusPill, typeBadge, peopleTags,
    filterButton, filterDropdown, legend, legendBox, placeCard, dayCard, calendar, lodgingRow,
    costRow, costTipCard, yen, itemTotal, statBox, summaryBlock, linkRow,
    PRIORITY_LABEL, STATUS_LABEL, TYPE_LABEL, TYPE_ICON, COST_CATS, COST_TIPS,
  };
})();
