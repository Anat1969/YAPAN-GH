// ============================================================
//  map.js — App.map (Leaflet)
//  סיכות ממוספרות לפי הפריטים המוצגים, קו מסלול ליום, בחירה.
// ============================================================
window.App = window.App || {};
App.map = (function () {

  let map = null, layer = null, cbs = {};
  const JAPAN = [36.2, 138.2];

  const TYPE_COLOR = {
    culture: '#b5651d', nature: '#2e7d32', food: '#c62828', shopping: '#6a1b9a',
    sport: '#1565c0', walk: '#00838f', architecture: '#37474f', temple: '#ad1457',
    market: '#ef6c00', workshop: '#5d4037', view: '#0277bd', hotel: '#16697a',
    restaurant: '#c62828', attraction: '#b5651d', hike: '#2e7d32', onsen: '#ad1457',
  };
  function colorFor(t) { return TYPE_COLOR[t] || '#555'; }

  function init(callbacks) {
    cbs = callbacks || {};
    if (map) return map;
    const host = document.getElementById('leafletMap');
    if (typeof L === 'undefined') {
      if (host) host.innerHTML = '<div class="map-fallback">🗺️ המפה דורשת חיבור לאינטרנט.<br>שאר האפליקציה עובדת רגיל.</div>';
      return null;
    }
    map = L.map('leafletMap', { scrollWheelZoom: true }).setView(JAPAN, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    return map;
  }

  function get() { return map; }
  function invalidate() { if (map) setTimeout(() => map.invalidateSize(), 100); }

  function pin(item, label) {
    const html = '<span class="pin" style="background:' + colorFor(item.type) + '">' +
      (label != null ? label : (item.type === 'hotel' ? '🏨' : '•')) + '</span>';
    const icon = L.divIcon({ className: 'map-pin-wrap', html: html, iconSize: [26, 26], iconAnchor: [13, 13] });
    const m = L.marker([item.coordinates.lat, item.coordinates.lng], { icon: icon });
    m.bindTooltip((item.recommendedTime ? item.recommendedTime + ' · ' : '') + (item.nameHe || ''), { direction: 'top' });
    m.on('click', () => { if (cbs.onSelect) cbs.onSelect(item.id); });
    m.on('mouseover', () => { if (cbs.onHover) cbs.onHover(item.id); });
    return m;
  }

  // items = הפריטים המוצגים כרגע (כבר מסוננים). מציירים אלה עם קואורדינטות.
  function render(items) {
    if (!map) return;
    layer.clearLayers();
    const bounds = [];
    const line = [];
    let n = 0;
    (items || []).forEach(function (it) {
      if (!it.coordinates) return;
      bounds.push([it.coordinates.lat, it.coordinates.lng]);
      const label = it.type === 'hotel' ? '🏨' : (++n);
      if (it.type !== 'hotel') line.push([it.coordinates.lat, it.coordinates.lng]);
      pin(it, label).addTo(layer);
    });
    if (line.length > 1) L.polyline(line, { color: '#888', weight: 2, opacity: 0.5, dashArray: '4,6' }).addTo(layer);
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }

  function focus(item) {
    if (map && item && item.coordinates) map.setView([item.coordinates.lat, item.coordinates.lng], 15, { animate: true });
  }

  return { init, get, invalidate, render, focus, colorFor };
})();
