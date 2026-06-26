// ============================================================
// normalize.js — turn raw base/stored data into a clean model
// the screens can rely on. Fills missing coordinates from the
// COORDS_LOOKUP table, and annotates each day/place.
// ============================================================
window.Normalize = (function () {

  const ORDER = ['kansai', 'hokkaido', 'tokyo']; // leg order across all of Japan

  function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

  function hasCoords(o) {
    return o && num(o.lat) !== 0 && num(o.lng) !== 0;
  }

  function lookup(name, place) {
    const tbl = window.COORDS_LOOKUP || {};
    return tbl[name] || tbl[place] || null;
  }

  // Return ordered list of trips that actually exist in the source object.
  function trips(source) {
    const out = [];
    ORDER.forEach(function (id) { if (source[id]) out.push(source[id]); });
    // include any other trips not in ORDER
    for (const id in source) if (ORDER.indexOf(id) === -1) out.push(source[id]);
    return out;
  }

  // Flatten all days across all trips into one ordered itinerary.
  // Each day gets: tripId, tripTitle, gday (global 1-based), and points[].
  function itinerary(source) {
    const list = trips(source);
    const days = [];
    let g = 0;
    list.forEach(function (trip) {
      (trip.days || []).forEach(function (day, di) {
        g += 1;
        const points = collectPoints(day);
        days.push(Object.assign({}, day, {
          tripId: trip.id,
          tripTitle: trip.title,
          dayIndex: di,        // index within its trip (for editing)
          gday: g,             // global ordinal across whole trip
          points: points
        }));
      });
    });
    return { trips: list, days: days };
  }

  // Every place on a day that can sit on the map (timeline items + the night's sleep).
  function collectPoints(day) {
    const pts = [];
    (day.timeline || []).forEach(function (it, idx) {
      let lat = num(it.lat), lng = num(it.lng);
      if (!hasCoords({ lat: lat, lng: lng })) {
        const f = lookup(it.name, it.nameEn);
        if (f) { lat = f.lat; lng = f.lng; }
      }
      pts.push({
        kind: 'stop',
        itemIndex: idx,
        name: it.name, nameEn: it.nameEn,
        time: it.time, type: it.type, forWho: it.forWho,
        desc: it.desc, why: it.whyThisPlace, duration: it.duration,
        address: it.address, cost: num(it.cost),
        lat: lat, lng: lng,
        hasCoords: hasCoords({ lat: lat, lng: lng }),
        raw: it
      });
    });
    return pts;
  }

  // Sum of all costs on a day (timeline + that night's sleep).
  function dayCost(day) {
    let sum = 0;
    (day.timeline || []).forEach(function (it) { sum += num(it.cost); });
    if (day.sleep) sum += num(day.sleep.cost);
    return sum;
  }

  return {
    ORDER: ORDER,
    trips: trips,
    itinerary: itinerary,
    collectPoints: collectPoints,
    dayCost: dayCost,
    hasCoords: hasCoords,
    num: num
  };
})();
