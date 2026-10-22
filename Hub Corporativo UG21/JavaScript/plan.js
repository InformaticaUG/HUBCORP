/* UG21 · People Hub v2.0.0 · interacción común */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Menú en móvil y tableta
  const links = $('#nav-links'), bMenu = $('.nav__menu');
  if (links && bMenu) {
    const cerrar = () => { links.classList.remove('abierto'); bMenu.setAttribute('aria-expanded', 'false'); bMenu.setAttribute('aria-label', 'Abrir menú'); };
    bMenu.addEventListener('click', () => { const ab = links.classList.toggle('abierto'); bMenu.setAttribute('aria-expanded', ab); bMenu.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); });
    links.addEventListener('click', e => { if (e.target.closest('a')) cerrar(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('abierto')) { cerrar(); bMenu.focus(); } });
  }

  // Expandir / contraer todo
  const btn = $('#toggleAll'), items = $$('#acc > details');
  if (btn && items.length) {
    const sync = () => { const todos = items.every(d => d.open); btn.textContent = todos ? 'Contraer todo' : 'Expandir todo'; btn.setAttribute('aria-pressed', String(todos)); };
    btn.addEventListener('click', () => { const abrir = !items.every(d => d.open); items.forEach(d => d.open = abrir); sync(); });
    items.forEach(d => d.addEventListener('toggle', sync));
    // Abrir el apartado indicado en la dirección (#apartado-03)
    const m = location.hash.match(/^#apartado-(\d+)$/);
    if (m && items[+m[1] - 1]) items[+m[1] - 1].open = true;
    sync();
  }


  // Carruseles
  $$('[data-carrusel]').forEach(car => {
    const pista = $('.car__pista', car), items = $$('.car__item', car), puntos = $('.car__puntos', car);
    const prev = $('[data-car="prev"]', car), next = $('[data-car="next"]', car);
    puntos.innerHTML = items.map(() => '<i></i>').join('');
    const dots = $$('i', puntos);
    const paso = () => (items[1] ? items[1].offsetLeft - items[0].offsetLeft : pista.clientWidth);
    const sync = () => {
      const i = Math.round(pista.scrollLeft / paso());
      dots.forEach((d, k) => d.classList.toggle('on', k === Math.min(i, dots.length - 1)));
      prev.disabled = pista.scrollLeft <= 2;
      next.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 2;
    };
    prev.addEventListener('click', () => pista.scrollBy({ left: -paso() }));
    next.addEventListener('click', () => pista.scrollBy({ left: paso() }));
    pista.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    addEventListener('resize', sync);
    car.closest('details')?.addEventListener('toggle', sync);
    sync();
  });



  // Trayectoria: una sola descripción visible; cambia al desplazar la gráfica o al pasar el ratón
  $$('.tn').forEach(tn => {
    const marco = $('.tn__marco', tn), hitos = $$('.tn__hito', tn);
    const xs = hitos.map(h => parseFloat(h.style.left));
    let fijado = null;
    const marcar = h => hitos.forEach(x => x.classList.toggle('on', x === h));
    const segunScroll = () => {
      const max = marco.scrollWidth - marco.clientWidth;
      const prog = max > 0 ? marco.scrollLeft / max : 0;
      const ref = marco.scrollLeft + 40 + prog * (marco.clientWidth - 80);
      let k = 0, d = Infinity;
      xs.forEach((x, i) => { const dd = Math.abs(x - ref); if (dd < d) { d = dd; k = i; } });
      marcar(hitos[k]);
    };
    marco.addEventListener('scroll', () => { if (!fijado) requestAnimationFrame(segunScroll); }, { passive: true });
    hitos.forEach(h => {
      h.addEventListener('mouseenter', () => { fijado = h; marcar(h); });
      $('.tn__punto', h).addEventListener('focus', () => { fijado = h; marcar(h); });
      $('.tn__punto', h).addEventListener('click', () => { fijado = h; marcar(h); });
    });
    marco.addEventListener('mouseleave', () => { fijado = null; segunScroll(); });
    // Rueda del ratón sobre la gráfica: desplaza en horizontal hasta llegar a un extremo
    marco.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { fijado = null; return; }
      const max = marco.scrollWidth - marco.clientWidth;
      if ((e.deltaY > 0 && marco.scrollLeft < max - 1) || (e.deltaY < 0 && marco.scrollLeft > 1)) {
        e.preventDefault(); fijado = null; marco.scrollLeft += e.deltaY;
      }
    }, { passive: false });
    let ini = null;
    marco.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('button')) return; ini = { x: e.clientX, s: marco.scrollLeft }; fijado = null; marco.classList.add('arrastra'); });
    addEventListener('pointermove', e => { if (ini) marco.scrollLeft = ini.s - (e.clientX - ini.x); });
    addEventListener('pointerup', () => { ini = null; marco.classList.remove('arrastra'); });
    marco.addEventListener('touchstart', () => { fijado = null; }, { passive: true });
    segunScroll();
  });

  // Mapa del mundo: la animación arranca cuando se ve
  $$('[data-mapa]').forEach(m => {
    const go = () => m.classList.add('visto');
    if (!('IntersectionObserver' in window)) return go();
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.target.offsetWidth) { go(); io.disconnect(); } }), { threshold: .35 });
    io.observe(m);
    m.closest('details')?.addEventListener('toggle', e => { if (!e.target.open) { m.classList.remove('visto'); io.observe(m); } });
  });

  // Visor de imágenes: cualquier foto de los apartados se puede ver en grande
  const SEL = '#acc img:not(.cumple__logo):not(.marca__logo img)';
  const visor = document.createElement('dialog');
  visor.className = 'visor';
  visor.setAttribute('aria-label', 'Imagen ampliada');
  visor.innerHTML = '<figure class="visor__fig"><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="visor__btn visor__cerrar" aria-label="Cerrar"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
    '<button type="button" class="visor__btn visor__prev" aria-label="Imagen anterior"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button>' +
    '<button type="button" class="visor__btn visor__next" aria-label="Imagen siguiente"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>';
  document.body.appendChild(visor);
  const vImg = $('img', visor), vCap = $('figcaption', visor);
  let grupo = [], pos = 0;
  const pie = img => { const f = img.closest('figure'); const c = f && $('figcaption', f); return (c && c.textContent.trim()) || img.alt || ''; };
  const mostrar = i => {
    pos = (i + grupo.length) % grupo.length;
    const img = grupo[pos];
    vImg.src = img.currentSrc || img.src; vImg.alt = img.alt || '';
    vCap.textContent = pie(img);
    vCap.hidden = !vCap.textContent;
    visor.classList.toggle('visor--solo', grupo.length < 2);
  };
  const abrir = img => {
    const ap = img.closest('#acc > details') || document;
    grupo = $$('img', ap).filter(x => x.closest('#acc'));
    mostrar(grupo.indexOf(img));
    if (typeof visor.showModal === 'function') visor.showModal(); else visor.setAttribute('open', '');
    document.documentElement.classList.add('visor-abierto');
  };
  const cerrar = () => { visor.close ? visor.close() : visor.removeAttribute('open'); };
  visor.addEventListener('close', () => document.documentElement.classList.remove('visor-abierto'));
  $('.visor__cerrar', visor).addEventListener('click', cerrar);
  $('.visor__prev', visor).addEventListener('click', () => mostrar(pos - 1));
  $('.visor__next', visor).addEventListener('click', () => mostrar(pos + 1));
  visor.addEventListener('click', e => { if (e.target === visor || e.target.classList.contains('visor__fig')) cerrar(); });
  visor.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') mostrar(pos - 1); if (e.key === 'ArrowRight') mostrar(pos + 1); });
  const preparar = () => $$(SEL).forEach(img => {
    if (img.dataset.ampliar) return;
    img.dataset.ampliar = '1';
    img.tabIndex = 0; img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Ver en grande' + (img.alt ? ': ' + img.alt : ''));
  });
  document.addEventListener('click', e => {
    const img = e.target.closest(SEL) || (e.target.closest('#acc .car__item') && $('img', e.target.closest('.car__item')));
    if (!img || e.target.closest('a[href]:not(.mapa-img)')) return;
    e.preventDefault(); abrir(img);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.matches(SEL + ', #acc .car__item')) {
      const img = document.activeElement.matches('img') ? document.activeElement : $('img', document.activeElement);
      if (img) { e.preventDefault(); abrir(img); }
    }
  });
  preparar();
  new MutationObserver(preparar).observe($('#acc') || document.body, { childList: true, subtree: true });

  // Tarjetas: destacada por defecto y entrada escalonada
  $$('[data-ph]').forEach(ph => {
    $$('li', ph).forEach((li, i) => li.style.setProperty('--i', i));
    if (ph.hasAttribute('data-destacar')) {
      const primera = () => $('a', ph);
      primera().classList.add('dest');
      ph.addEventListener('mouseover', e => { const a = e.target.closest('a'); if (a && !a.classList.contains('dest')) $('a.dest', ph)?.classList.remove('dest'); });
      ph.addEventListener('mouseleave', () => { if (!$('a.dest', ph)) primera().classList.add('dest'); });
    }
  });
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('anim');
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('visto'); io.unobserve(x.target); } }), { threshold: .1 });
    $$('[data-ph]').forEach(p => io.observe(p));
  }
})();
