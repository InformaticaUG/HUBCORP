/* UG21 · Cabecera interactiva: líneas ortogonales que se construyen despacio
   por toda la cabecera y se aceleran al acercar el ratón */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  var VEL = 1.1;                                   // unidades de retícula por segundo (ritmo lento)
  var COLOR = 'rgba(238,246,252,.92)', ACENTO = '#AFD3F1';

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(a, b) { return Math.floor(rnd(a, b + 1)); }

  function iniciar(hero) {
    var cv = document.createElement('canvas');
    cv.className = 'hero__ondas'; cv.setAttribute('aria-hidden', 'true');
    hero.insertBefore(cv, hero.firstChild);
    hero.classList.add('hero--ondas');
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, G = 28, cols = 0, rows = 0, MAX = 6, zona = 0, ymin = 3;
    var lineas = [], estela = [], proxNac = 0, prev = performance.now();
    var m = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, dentro: false };
    var visible = true, raf = 0;

    function medir() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      G = W < 700 ? 22 : 28; cols = Math.floor(W / G); rows = Math.floor(H / G);
      MAX = Math.max(4, Math.round(W / 160));
      ymin = Math.ceil(100 / G);                     // libre la franja del logo y el menú
      // zona del texto: hasta donde llegan el título y la entradilla
      var der = 0;
      hero.querySelectorAll('h1, h1 + p, .hero__lead, .hero__eyebrow').forEach(function (el) {
        var b = el.getBoundingClientRect(); if (b.width) der = Math.max(der, b.right - r.left);
      });
      zona = Math.min(der ? der + 40 : W * .55, W * .7);
      lineas = lineas.filter(function (l) { return l.pts.every(function (p) { return p[0] <= cols && p[1] <= rows; }); });
    }

    function ocupado(x, y) {
      for (var i = 0; i < lineas.length; i++) { var p = lineas[i].pts;
        for (var k = 0; k < p.length; k++) if (Math.abs(p[k][0] - x) + Math.abs(p[k][1] - y) < 5) return true; }
      return false;
    }

    // Una línea es un recorrido ortogonal de 2 a 4 tramos con giros de 90°
    function nueva(preavance) {
      var x0 = 2, x, y, t = 0;                    // nacen en todo el ancho de la cabecera
      do { x = ri(x0, cols - 2); y = ri(ymin + 1, rows - 2); t++; } while (ocupado(x, y) && t < 20);
      var d = ri(0, 3), pts = [[x, y]], n = ri(2, 4);
      for (var s = 0; s < n; s++) {
        var L = ri(3, 9), nx = Math.max(1, Math.min(cols - 1, x + DIRS[d][0] * L)), ny = Math.max(ymin, Math.min(rows - 1, y + DIRS[d][1] * L));
        if (nx === x && ny === y) break;
        x = nx; y = ny; pts.push([x, y]);
        d = (d + (Math.random() < .5 ? 1 : 3)) % 4;
      }
      if (pts.length < 2) return null;
      var tot = 0; for (var i = 1; i < pts.length; i++) tot += Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
      var l = { pts: pts, tot: tot, cab: 0, cola: 0, estado: 'crece', espera: rnd(3, 7), vel: 1, acento: Math.random() < .16 };
      if (preavance) { l.cab = tot * rnd(.3, 1); if (l.cab >= tot) { l.cab = tot; l.estado = 'quieto'; l.espera = rnd(0, 5); } }
      return l;
    }

    // punto a una distancia s a lo largo del recorrido
    function punto(l, s) {
      var p = l.pts;
      for (var i = 1; i < p.length; i++) {
        var L = Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]);
        if (s <= L || i === p.length - 1) { var f = L ? Math.min(1, s / L) : 0;
          return [(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f) * G, (p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f) * G, i]; }
        s -= L;
      }
    }
    function trazo(l) {
      var a = punto(l, l.cola), b = punto(l, l.cab);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      for (var i = a[2]; i < b[2]; i++) ctx.lineTo(l.pts[i][0] * G, l.pts[i][1] * G);
      ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // cercanía al rastro del ratón (radio amplio, unos 300 px)
    function cercania(x, y) {
      var c = 0;
      for (var k = 0; k < estela.length; k++) { var e = estela[k], dx = x - e.x, dy = y - e.y;
        c = Math.max(c, Math.exp(-(dx * dx + dy * dy) / 65000) * e.v); }
      return c;
    }

    function dibujar(now) {
      var dt = Math.min(.05, (now - prev) / 1000); prev = now;
      if (m.dentro) {
        m.x += (m.tx - m.x) * .08; m.y += (m.ty - m.y) * .08;
        var ul = estela[estela.length - 1];
        if (!ul || Math.abs(ul.x - m.x) + Math.abs(ul.y - m.y) > 14) estela.push({ x: m.x, y: m.y, e: 0 });
      }
      for (var q = estela.length - 1; q >= 0; q--) { var e = estela[q]; e.e++;
        e.v = Math.min(1, e.e / 12) * Math.max(0, 1 - e.e / 150); if (e.e > 150) estela.splice(q, 1); }

      proxNac -= dt;
      if (lineas.length < MAX && proxNac <= 0) { var n = nueva(false); if (n) lineas.push(n); proxNac = rnd(.5, 1.2); }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = Math.max(4, G * .24); ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
      for (var i = lineas.length - 1; i >= 0; i--) {
        var l = lineas[i], pc = punto(l, l.estado === 'recoge' ? l.cola : l.cab);
        // cerca del ratón la línea se acelera; al alejarse vuelve despacio a su ritmo
        var obj = 1 + 4 * cercania(pc[0], pc[1]);
        l.vel += (obj - l.vel) * (obj > l.vel ? .12 : .025);
        var paso = reduce ? 0 : VEL * l.vel * dt;
        if (l.estado === 'crece') { l.cab = Math.min(l.tot, l.cab + paso); if (l.cab >= l.tot) l.estado = 'quieto'; }
        else if (l.estado === 'quieto') { if (!reduce) l.espera -= dt * l.vel; if (l.espera <= 0) l.estado = 'recoge'; }
        else { l.cola = Math.min(l.tot, l.cola + paso); if (l.cola >= l.tot) { lineas.splice(i, 1); continue; } }
        ctx.strokeStyle = l.acento ? ACENTO : COLOR; trazo(l);
      }
      // atenuación ligera junto al texto (las líneas siguen viéndose, pero no compiten con el título)
      ctx.globalCompositeOperation = 'destination-out';
      var fin = W < 700 ? W : Math.min(W, zona + 90);
      var gz = ctx.createLinearGradient(0, 0, fin, 0);
      gz.addColorStop(0, 'rgba(0,0,0,.5)'); gz.addColorStop(Math.max(.5, (fin - 90) / fin), 'rgba(0,0,0,.4)'); gz.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gz; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    function bucle(now) { dibujar(now); if (visible && !reduce) raf = requestAnimationFrame(bucle); }
    function arrancar() { cancelAnimationFrame(raf); prev = performance.now(); if (reduce) dibujar(prev); else raf = requestAnimationFrame(bucle); }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      m.tx = e.clientX - r.left; m.ty = e.clientY - r.top;
      if (!m.dentro) { m.x = m.tx; m.y = m.ty; }
      m.dentro = true;
    });
    hero.addEventListener('pointerleave', function () { m.dentro = false; });

    medir();
    // al cargar ya hay algunas líneas a medio construir, para que no empiece vacía
    for (var s = 0; s < Math.ceil(MAX * .6); s++) { var n = nueva(true); if (n) lineas.push(n); }
    arrancar();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { medir(); if (reduce) arrancar(); }, 120); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) arrancar(); else cancelAnimationFrame(raf);
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else if (visible) arrancar(); });
  }

  function go() { document.querySelectorAll('header.hero').forEach(iniciar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
