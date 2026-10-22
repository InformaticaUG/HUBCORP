/* UG21 · Mapa interactivo del Polígono PISA (Leaflet + OpenStreetMap) */
(function () {
  'use strict';
  var LUGARES = [{"n": "UG21 Engineering", "t": "sede", "d": "Nuestra oficina · C. Artesanía, 18", "ll": [37.3556732, -6.0587593]}, {"n": "Nueva sede UG21 Engineering", "t": "nueva", "d": "Ubicación aproximada", "ll": [37.353956, -6.054027]}, {"n": "Bar Mesón Casa Pablo III", "t": "bar", "d": "Bar", "ll": [37.3562931, -6.0590761]}, {"n": "Bar Don Curro", "t": "bar", "d": "C. Brújula, 49", "ll": [37.355958, -6.0560277]}, {"n": "Bar Tostapa", "t": "bar", "d": "C. Comercio, 16", "ll": [37.3551136, -6.0554361]}, {"n": "Bar Las Palmeras", "t": "bar", "d": "C. Brújula, 3", "ll": [37.3542237, -6.0615078]}, {"n": "Casa Family", "t": "compra", "d": "Bazar · C. Horizonte, 14", "ll": [37.35567, -6.0580021]}, {"n": "Cash", "t": "compra", "d": "Supermercado · C. Artesanía, 10", "ll": [37.3552882, -6.0604887]}, {"n": "Club Deportivo Fit in", "t": "gym", "d": "Gimnasio y pádel · C. Artesanía, 9", "ll": [37.3561324, -6.0593281]}, {"n": "Parada de autobús 155", "t": "bus", "d": "Polígono PISA", "ll": [37.356074, -6.059173]}, {"n": "Parada de autobús 155", "t": "bus", "d": "Ciudad Expo", "ll": [37.350205, -6.050549]}, {"n": "Metro Ciudad Expo", "t": "metro", "d": "Línea 1 · Av. de las Américas", "ll": [37.3494529, -6.0514297]}];
  var RUTA = [[37.355621, -6.058669], [37.355254, -6.058221], [37.35491, -6.05786], [37.354546, -6.057243], [37.354281, -6.056716], [37.354003, -6.056189], [37.353797, -6.055836], [37.353454, -6.055475], [37.354765, -6.057256], [37.354525, -6.056731], [37.354252, -6.056289], [37.353885, -6.055842], [37.353516, -6.055479], [37.353196, -6.055187], [37.35296, -6.055122], [37.352708, -6.055174], [37.352453, -6.055414], [37.352135, -6.055734], [37.351849, -6.055929], [37.351695, -6.055793], [37.351391, -6.055349], [37.351271, -6.055086], [37.351249, -6.054575], [37.351193, -6.054231], [37.350798, -6.053612], [37.350433, -6.053079], [37.350223, -6.052556], [37.34995, -6.052114], [37.349582, -6.051752]];
  var ICONOS = {"bar": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2\" /> <path d=\"M7 2v20\" /> <path d=\"M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7\" /></svg>", "compra": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"8\" cy=\"21\" r=\"1\" /> <circle cx=\"19\" cy=\"21\" r=\"1\" /> <path d=\"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12\" /></svg>", "gym": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M14.4 14.4 9.6 9.6\" /> <path d=\"M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z\" /> <path d=\"m21.5 21.5-1.4-1.4\" /> <path d=\"M3.9 3.9 2.5 2.5\" /> <path d=\"M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z\" /></svg>", "bus": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 6v6\" /> <path d=\"M15 6v6\" /> <path d=\"M2 12h19.6\" /> <path d=\"M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3\" /> <circle cx=\"7\" cy=\"18\" r=\"2\" /> <path d=\"M9 18h5\" /> <circle cx=\"16\" cy=\"18\" r=\"2\" /></svg>", "metro": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 3.1V7a4 4 0 0 0 8 0V3.1\" /> <path d=\"m9 15-1-1\" /> <path d=\"m15 15 1-1\" /> <path d=\"M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z\" /> <path d=\"m8 19-2 3\" /> <path d=\"m16 19 2 3\" /></svg>", "sede": "<svg viewBox=\"0 0 380.78 380.78\" aria-hidden=\"true\"> <defs> </defs> <g id=\"Capa_1-2\" data-name=\"Capa 1\"> <g> <g id=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M34.31,81.36c61.15,26.9,131.22,24.46,190.36-6.61,31.85-16.74,68.42-22.19,103.77-15.48C256.02-16.97,135.52-20.07,59.27,52.34c-9.28,8.81-17.64,18.53-24.97,29.02Z\"></path> </g> <g id=\"LWPOLYLINE-2\" data-name=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M345.9,300.22c-12.51,17.71-27.95,33.15-45.67,45.66-85.89,60.66-204.69,40.22-265.35-45.66,103.4,10.68,207.62,10.68,311.02,0Z\"></path> </g> <g id=\"LWPOLYLINE-3\" data-name=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M379.46,212.76c-123.3,37.34-254.9,37.29-378.16-.16-2.82-23.95-1.05-48.22,5.19-71.52,118.31,45.9,249.49,45.98,367.85.2,6.22,23.29,7.95,47.54,5.12,71.48Z\"></path> </g> </g> </g> </svg>", "nueva": "<svg viewBox=\"0 0 380.78 380.78\" aria-hidden=\"true\"> <defs> </defs> <g id=\"Capa_1-2\" data-name=\"Capa 1\"> <g> <g id=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M34.31,81.36c61.15,26.9,131.22,24.46,190.36-6.61,31.85-16.74,68.42-22.19,103.77-15.48C256.02-16.97,135.52-20.07,59.27,52.34c-9.28,8.81-17.64,18.53-24.97,29.02Z\"></path> </g> <g id=\"LWPOLYLINE-2\" data-name=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M345.9,300.22c-12.51,17.71-27.95,33.15-45.67,45.66-85.89,60.66-204.69,40.22-265.35-45.66,103.4,10.68,207.62,10.68,311.02,0Z\"></path> </g> <g id=\"LWPOLYLINE-3\" data-name=\"LWPOLYLINE\"> <path fill=\"#1E2F56\" d=\"M379.46,212.76c-123.3,37.34-254.9,37.29-378.16-.16-2.82-23.95-1.05-48.22,5.19-71.52,118.31,45.9,249.49,45.98,367.85.2,6.22,23.29,7.95,47.54,5.12,71.48Z\"></path> </g> </g> </g> </svg>"};
  var mapa = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function init() {
    var el = document.getElementById('mapa-pisa');
    if (!el || !window.L || el._leaflet_id) return;
    mapa = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    // Fondo del mapa: OpenStreetMap. Funciona con la web servida por http/https
    // (abierta como archivo local, file://, OpenStreetMap bloquea las teselas).
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(mapa);
    mapa.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');
    function etiquetas() { el.classList.toggle('mp-zoom-cerca', mapa.getZoom() >= 17); }
    mapa.on('zoomend', etiquetas);
    var capas = {};
    function capa(t) { return capas[t] || (capas[t] = L.layerGroup().addTo(mapa)); }
    var ruta = L.polyline(RUTA, { color: '#004996', weight: 5, opacity: .9, dashArray: '2 10', lineCap: 'round' });
    capa('ruta').addLayer(ruta);
    ruta.bindTooltip('Andando desde el metro Ciudad Expo · 15 min aprox.', { sticky: true, className: 'mp-tip' });
    LUGARES.forEach(function (p) {
      var sede = p.t === 'sede' || p.t === 'nueva';
      var icon = L.divIcon({ className: 'mp mp--' + p.t, html: '<span class="mp__pin">' + ICONOS[p.t] + '</span>', iconSize: sede ? [44, 54] : [34, 42], iconAnchor: sede ? [22, 54] : [17, 42], tooltipAnchor: sede ? [0, -48] : [0, -38] });
      var m = L.marker(p.ll, { icon: icon, title: p.n, keyboard: true, zIndexOffset: p.t === 'sede' ? 1000 : 0 });
      m.bindTooltip(esc(p.n), { permanent: true, direction: 'top', className: 'mp-et mp-et--' + p.t + (p.t === 'sede' || p.t === 'nueva' || p.t === 'metro' ? ' mp-et--fija' : '') });
      m.bindPopup('<b>' + esc(p.n) + '</b><span>' + esc(p.d) + '</span><a href="https://www.google.com/maps/dir/?api=1&destination=' + p.ll.join(',') + '" target="_blank" rel="noopener">Cómo llegar ↗</a>', { className: 'mp-pop' });
      m.on('mouseover focus', function () { var t = m.getTooltip() && m.getTooltip().getElement(); if (t) t.classList.add('mp-ver'); });
      m.on('mouseout blur', function () { var t = m.getTooltip() && m.getTooltip().getElement(); if (t) t.classList.remove('mp-ver'); });
      capa(p.t === 'nueva' ? 'sede' : p.t === 'metro' ? 'bus' : p.t).addLayer(m);
    });
    var todo = L.latLngBounds(LUGARES.map(function (p) { return p.ll; }));
    mapa.fitBounds(todo, { padding: [40, 40] }); etiquetas();
    // Filtros
    document.querySelectorAll('[data-mp-filtro]').forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-mp-filtro');
        el.classList.toggle('mp-filtrado', f !== 'todo');
        document.querySelectorAll('[data-mp-filtro]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        Object.keys(capas).forEach(function (t) {
          var ver = f === 'todo' || t === f || t === 'sede' || (f === 'bus' && t === 'ruta');
          if (ver) mapa.addLayer(capas[t]); else mapa.removeLayer(capas[t]);
        });
        var sel = LUGARES.filter(function (p) { return f === 'todo' || p.t === f || (f === 'bus' && p.t === 'metro') || p.t === 'sede'; }).map(function (p) { return p.ll; });
        if (f === 'todo') mapa.flyToBounds(todo, { padding: [40, 40], duration: .6 });
        else mapa.flyToBounds(L.latLngBounds(sel), { padding: [60, 60], maxZoom: 18, duration: .6 });
      });
    });
    // Activar zoom con la rueda al hacer clic en el mapa
    mapa.on('click', function () { mapa.scrollWheelZoom.enable(); });
    mapa.on('mouseout', function () { mapa.scrollWheelZoom.disable(); });
  }
  function cuandoVisible() {
    var el = document.getElementById('mapa-pisa'); if (!el) return;
    var d = el.closest('details');
    if (d && !d.open) { d.addEventListener('toggle', function h() { if (d.open) { d.removeEventListener('toggle', h); init(); } }); }
    else init();
    if (d) d.addEventListener('toggle', function () { if (d.open && mapa) setTimeout(function () { mapa.invalidateSize(); }, 50); });
  }
  document.addEventListener('ph:restaurado', function () { mapa = null; cuandoVisible(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cuandoVisible); else cuandoVisible();
})();
