// ============================================================
//  normalize.js — App.normalize
//  ממיר את נתוני ה-BASE (data/base-*.js, פורמט יומי) למודל
//  של items + days שהאפליקציה עובדת איתו, ומספק makeItem.
// ============================================================
window.App = window.App || {};
App.normalize = (function () {

  const PEOPLE = ['ענת', 'עילאי', 'לוטם', 'נתן'];

  // ברירות מחדל של פריט
  const ITEM_DEFAULTS = {
    nameHe: '', nameEn: '', type: 'note', priority: 'medium', status: 'proposed',
    people: ['כולם'], shortDescription: '', reasonToVisit: '', userNotes: '',
    recommendedTime: '', duration: '', externalLink: '', dayId: '',
    coordinates: null, city: '', district: '', meta: {},
  };

  function makeItem(over) {
    const it = Object.assign({}, ITEM_DEFAULTS, over || {});
    it.meta = Object.assign({}, over && over.meta);
    it.people = (over && over.people) ? over.people.slice() : ['כולם'];
    return it;
  }

  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
  function coords(lat, lng) {
    lat = num(lat); lng = num(lng);
    return (lat && lng) ? { lat: lat, lng: lng } : null;
  }

  // "ענת, נתן" → ['ענת','נתן'] ; "כולם"/ריק → ['כולם']
  function parsePeople(forWho) {
    if (!forWho) return ['כולם'];
    if (forWho.indexOf('כולם') !== -1) return ['כולם'];
    const parts = forWho.split(/[,،/]| ו| או/).map(s => s.trim()).filter(Boolean);
    const ppl = parts.filter(p => PEOPLE.indexOf(p) !== -1);
    return ppl.length ? ppl : ['כולם'];
  }

  const ORDER = ['kansai', 'hokkaido', 'tokyo'];
  const CITY_EN = { 'Osaka': 'Osaka', 'Kyoto': 'Kyoto', 'Kanazawa': 'Kanazawa', 'Kobe': 'Kobe' };

  // בונה state נקי מ-window.__BASE_TRIPS
  function build() {
    const base = window.__BASE_TRIPS || {};
    const lookup = window.COORDS_LOOKUP || {};
    const state = { dayOrder: [], days: {}, items: {}, meta: {} };
    let gIndex = 0;

    ORDER.concat(Object.keys(base).filter(k => ORDER.indexOf(k) === -1)).forEach(function (tripId) {
      const trip = base[tripId];
      if (!trip) return;
      state.meta[tripId] = {
        title: trip.title, subtitle: trip.subtitle, season: trip.season,
        entry: trip.entry, exit: trip.exit, transport: trip.transport,
        experienceCurve: trip.experienceCurve,
      };
      const regionHe = trip.title || tripId;

      (trip.days || []).forEach(function (day) {
        gIndex += 1;
        const dayId = tripId + '-d' + gIndex;
        const sleep = day.sleep || {};

        // פריט מלון ללילה (אם יש)
        let sleepRef = '';
        if (sleep.hotel || sleep.place) {
          const hid = dayId + '-hotel';
          state.items[hid] = makeItem({
            id: hid, nameHe: sleep.hotel || sleep.place, nameEn: sleep.placeEn || '',
            type: 'hotel', priority: 'high', status: 'selected', people: ['כולם'],
            shortDescription: sleep.place || '', dayId: dayId, city: regionHe,
            district: sleep.place || '',
            coordinates: coords(sleep.lat, sleep.lng),
            meta: { cost: num(sleep.cost), qty: 1, address: sleep.address || '',
              bookingUrl: sleep.bookingUrl || '', nearestStation: '' },
          });
          sleepRef = hid;
        }

        const itemOrder = [];
        (day.timeline || []).forEach(function (t, idx) {
          const id = dayId + '-i' + idx;
          let c = coords(t.lat, t.lng);
          if (!c && (lookup[t.name] || lookup[t.nameEn])) {
            const f = lookup[t.name] || lookup[t.nameEn]; c = { lat: f.lat, lng: f.lng };
          }
          state.items[id] = makeItem({
            id: id, nameHe: t.name || '', nameEn: t.nameEn || '',
            type: t.type || 'note', priority: 'medium', status: 'selected',
            people: parsePeople(t.forWho),
            shortDescription: t.desc || '', reasonToVisit: t.whyThisPlace || '',
            recommendedTime: t.time || '', duration: t.duration || '',
            dayId: dayId, city: regionHe, coordinates: c,
            meta: { cost: num(t.cost), qty: 1, address: t.address || '', forWhoRaw: t.forWho || '' },
          });
          itemOrder.push(id);
        });

        // פריטי אוכל/פנינה כהערות (אופציונלי — נשמרים כפריטים מסוג מתאים)
        state.days[dayId] = {
          id: dayId, index: gIndex, title: day.title || '', subtitle: day.subtitle || '',
          date: '', dow: '', city: sleep.place || regionHe,
          cityEn: CITY_EN[sleep.placeEn] || sleep.placeEn || '',
          story: day.story || '', notes: day.transportTip || '',
          area: day.area || '',
          drive: (day.drive && (day.drive.km || day.drive.time)) ? { time: day.drive.time, km: day.drive.km } : null,
          sleepRef: sleepRef, itemOrder: itemOrder,
          coordinates: coords(sleep.lat, sleep.lng),
        };
        state.dayOrder.push(dayId);
      });

      // פריטי לינה מתוך trip.lodging (סיכום לינה) — אם אין days, עדיין מוצג
      (trip.lodging || []).forEach(function (l, li) {
        const hid = tripId + '-lodge' + li;
        if (state.items[hid]) return;
        // נשמר רק אם אין כבר מלונות יומיים לאזור
      });
    });

    return state;
  }

  return { PEOPLE: PEOPLE, makeItem: makeItem, build: build, parsePeople: parsePeople, coords: coords };
})();
