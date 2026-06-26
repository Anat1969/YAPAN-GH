// ============================================================
// map.js — Leaflet map. Renders the currently-visible places as
// numbered markers, colour-coded by type, and connects them with
// a route line per day. Clicking a marker opens the place detail.
// ============================================================
window.MapView = (function () {

  let map = null;
  let layer = null;
  const JAPAN = [36.2, 138.2];

  // colour per activity type (kept in sync with the legend in filters.js)
  const TYPE_COLOR = {
    culture: '#b5651d', nature: '#2e7d32', food: '#c62828', shopping: '#6a1b9a',
    sport: '#1565c0', walk: '#00838f', architecture: '#37474f', temple: '#ad1457',
    market: '#ef6c00', workshop: '#5d4037', view: '#0277bd'
  };
  function colorFor(t) { return TYPE_COLOR[t] || '#555'; }

  function init(elId) {
    if (map) return map;
    if (typeof L === 'undefined') {            // Leaflet CDN unavailable (offline)
      const host = document.getElementById(elId);
      if (host && !host.querySelector('.map-fallback')) {
        host.innerHTML = '<div class="map-fallback">🗺️ המפה דורשת חיבור לאינטרנט (Leaflet).<br>שאר האפליקציה עובדת כרגיל.</div>';
      }
      return null;
    }
    map = L.map(elId, { scrollWheelZoom: true }).setView(JAPAN, 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
    return map;
  }

  function marker(pt, label, onClick) {
    const html = '<span class="pin" style="background:' + colorFor(pt.type) + '">' +
      C.esc(label) + '</span>';
    const icon = L.divIcon({ className: 'map-pin-wrap', html: html, iconSize: [26, 26], iconAnchor: [13, 13] });
    const m = L.marker([pt.lat, pt.lng], { icon: icon });
    m.bindTooltip((pt.time ? pt.time + ' · ' : '') + (pt.name || pt.nameEn || ''), { direction: 'top' });
    if (onClick) m.on('click', function () { onClick(pt); });
    return m;
  }

  // groups: array of { day, points:[...] } already filtered. onClick(pt) handler.
  function render(groups, onClick) {
    if (!map) return;
    layer.clearLayers();
    const bounds = [];
    groups.forEach(function (g) {
      const line = [];
      g.points.forEach(function (pt) {
        if (!pt.hasCoords) return;
        bounds.push([pt.lat, pt.lng]);
        line.push([pt.lat, pt.lng]);
        marker(pt, pt._label != null ? pt._label : '•', onClick).addTo(layer);
      });
      if (line.length > 1) {
        L.polyline(line, { color: '#888', weight: 2, opacity: 0.5, dashArray: '4,6' }).addTo(layer);
      }
    });
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    else map.setView(JAPAN, 6);
  }

  function focus(lat, lng) { if (map && lat && lng) map.setView([lat, lng], 15, { animate: true }); }

  return { init: init, render: render, focus: focus, colorFor: colorFor, TYPE_COLOR: TYPE_COLOR };
})();
