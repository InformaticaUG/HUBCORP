/* UG21 · Hub Corporativo v3.2.0 · Inicio, Comunicados y Calendario */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const CLAVES = { noticias: 'ug_news', festivos: 'ug_festives', accesos: 'ug_card_data_v5', avisos: 'ug_avisos', editor: 'ug_editor' };
  const datos = window.HUB_DATA || { accesos: {}, festivos: [], noticias: [] };
  const leer = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { aviso('No se ha podido guardar en este navegador.'); } };

  let noticias = leer(CLAVES.noticias, datos.noticias);
  let festivos = new Set(leer(CLAVES.festivos, datos.festivos));
  let accesos = leer(CLAVES.accesos, datos.accesos);
  let avisos = leer(CLAVES.avisos, datos.avisos || []);
  let esAdmin = false;

  const ICONOS = { team2go: 'i-users', web: 'i-globe', formacion: 'i-cap', imputacion: 'i-clock', linkedin: 'i-in', spotify: 'i-music' };
  const dec = document.createElement('textarea');
  const texto = s => { dec.innerHTML = String(s ?? ''); return dec.value; };
  const el = (tag, props = {}, ...hijos) => { const n = Object.assign(document.createElement(tag), props); hijos.flat().forEach(h => h != null && n.append(h)); return n; };
  const ico = (id, cls = 'ico') => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); s.innerHTML = `<use href="#${id}"/>`; return s; };
  const urlSegura = u => { if (!u || u === '#') return ''; try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  const parrafos = t => texto(t).split(/\n\s*\n/).map(p => el('p', { textContent: p.trim() }));

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const deIso = s => { const [a, m, d] = String(s).split('-').map(Number); return new Date(a, m - 1, d); };
  const fmt = (d, o) => new Intl.DateTimeFormat('es-ES', o).format(d);
  const fechaLarga = s => fmt(deIso(s), { day: 'numeric', month: 'long', year: 'numeric' });
  const may = s => s.charAt(0).toUpperCase() + s.slice(1);
  const finde = d => d.getDay() === 0 || d.getDay() === 6;
  const tipo = d => finde(d) ? 'finde' : festivos.has(iso(d)) ? 'festivo' : 'laborable';
  const proximos = () => [...festivos].map(deIso).filter(d => d > hoy && !finde(d)).sort((a, b) => a - b);
  const falta = d => { const n = Math.round((d - hoy) / 864e5); return n === 1 ? 'mañana' : `en ${n} días`; };
  const etiquetaDia = (d, k) => `${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}: ${k === 'finde' ? 'fin de semana' : k}${+d === +hoy ? ', hoy' : ''}`;
  const ordenadas = () => [...noticias].sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0) || String(b.date).localeCompare(String(a.date)));

  let tAviso;
  function aviso(msg) { const a = $('[data-aviso]'); if (!a) return; a.textContent = msg; a.classList.add('visible'); clearTimeout(tAviso); tAviso = setTimeout(() => a.classList.remove('visible'), 3600); }

  /* ---------- Resumen del día (Inicio) ---------- */
  function pintarHoy() {
    if ($('[data-anio]')) $('[data-anio]').textContent = hoy.getFullYear();
    if (!$('[data-semana]')) return;
    const t = tipo(hoy), p = proximos()[0];
    $('[data-jornada]').textContent = t === 'laborable' ? 'Día laborable' : t === 'festivo' ? 'Festivo' : 'Fin de semana';
    $('[data-hoy-texto]').textContent = may(fmt(hoy, { weekday: 'long', day: 'numeric', month: 'long' }));
    $('[data-prox-corto]').textContent = p ? fmt(p, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '') : 'Sin fechas';
    $('[data-prox-falta]').textContent = p ? `${may(fmt(p, { weekday: 'long' }))}, ${falta(p)}` : 'No hay festivos registrados';
    const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    const sem = $('[data-semana]'); sem.replaceChildren();
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes); d.setDate(lunes.getDate() + i);
      const k = tipo(d), div = el('div', { className: 'dia-s' }, fmt(d, { weekday: 'short' }).replace('.', ''), el('b', { className: 'num', textContent: d.getDate() }));
      div.dataset.t = k; if (+d === +hoy) div.dataset.hoy = '';
      div.setAttribute('aria-label', etiquetaDia(d, k));
      sem.append(div);
    }
  }

  /* ---------- Accesos (Inicio y Accesos) ---------- */
  function pintarAccesos() {
    $$('[data-accesos]').forEach(ul => {
      ul.replaceChildren();
      Object.entries(accesos).forEach(([id, a]) => {
        const url = urlSegura(a.url), titulo = texto(a.title), desc = texto(a.desc);
        let dominio = 'Sin enlace'; try { if (url) dominio = new URL(url).host.replace(/^www\./, ''); } catch {}
        const link = el(url ? 'a' : 'div', { className: 'acceso__link' },
          el('div', { className: 'acceso__top' }, el('span', { className: 'acceso__ico' }, ico(ICONOS[id] || 'i-link')), url ? el('span', { className: 'acceso__go' }, ico('i-ur')) : null),
          el('div', {}, el('h3', { textContent: titulo }), el('p', { textContent: desc })),
          el('span', { className: 'acceso__dom', textContent: dominio }));
        if (url) { link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.setAttribute('aria-label', `${titulo}: ${desc}. Se abre en una pestaña nueva`); }
        const li = el('li', { className: 'acceso' }, link);
        if (esAdmin) { const b = el('button', { type: 'button', className: 'btn btn--sec btn--s acceso__editar' }, ico('i-edit', 'ico ico--s'), 'Editar'); b.addEventListener('click', () => abrirAcceso(id)); li.append(b); }
        ul.append(li);
      });
    });
  }
  function abrirAcceso(id) {
    const f = $('[data-form="acceso"]'), a = accesos[id];
    f.id.value = id; f.title.value = texto(a.title); f.desc.value = texto(a.desc); f.url.value = a.url === '#' ? '' : a.url;
    $('#modal-acceso').showModal();
  }

  /* ---------- Comunicados ---------- */
  function accionesAdmin(n, enModal) {
    const caja = [];
    if (!esAdmin) return caja;
    const d = el('button', { type: 'button', className: 'btn btn--sec btn--s' }, ico('i-star', 'ico ico--s'), n.destacado ? 'Quitar de destacados' : 'Destacar en Inicio');
    d.addEventListener('click', () => { n.destacado = !n.destacado; guardar(CLAVES.noticias, noticias); pintarComunicados(); if (enModal) $('#modal-leer').close(); aviso(n.destacado ? 'Comunicado destacado en Inicio.' : 'Comunicado quitado de destacados.'); });
    const b = el('button', { type: 'button', className: 'btn btn--peligro btn--s' }, ico('i-trash', 'ico ico--s'), 'Eliminar');
    b.addEventListener('click', () => {
      if (!b.dataset.confirmar) { b.dataset.confirmar = '1'; b.lastChild.textContent = 'Pulsa otra vez para eliminar'; setTimeout(() => { if (b.isConnected) { delete b.dataset.confirmar; b.lastChild.textContent = 'Eliminar'; } }, 4000); return; }
      noticias = noticias.filter(x => x.id !== n.id); guardar(CLAVES.noticias, noticias); pintarComunicados(); if (enModal) $('#modal-leer').close(); aviso('Comunicado eliminado.');
    });
    caja.push(d, b);
    return caja;
  }
  function pintarComunicados() {
    const lista = ordenadas();
    // Inicio: los destacados del momento (máx. 2)
    const dest = $('[data-destacados]');
    if (dest) {
      dest.replaceChildren();
      const top = lista.slice(0, 2);
      if (!top.length) dest.append(el('p', { className: 'vacio', textContent: 'Todavía no hay comunicados publicados.' }));
      top.forEach((n, i) => {
        const card = el('article', { className: 'com-card' + (i === 0 ? ' com-card--prin' : '') },
          el('div', { className: 'com-card__meta' }, el('time', { dateTime: n.date, textContent: fechaLarga(n.date) }), n.destacado ? el('span', { className: 'pastilla-dest' }, 'Destacado') : null),
          el('h3', { textContent: texto(n.title) }),
          el('p', { className: 'com-card__ext', textContent: texto(n.content).replace(/\s+/g, ' ').slice(0, i === 0 ? 220 : 140) + (texto(n.content).length > (i === 0 ? 220 : 140) ? '…' : '') }),
          el('button', { type: 'button', className: 'com-card__leer' }, 'Leer comunicado', ico('i-r', 'ico ico--s')));
        card.querySelector('.com-card__leer').addEventListener('click', () => abrirComunicado(n));
        dest.append(card);
      });
    }
    // Página Comunicados: todos
    const todos = $('[data-comunicados]');
    if (todos) {
      todos.replaceChildren();
      $('[data-com-total]') && ($('[data-com-total]').textContent = lista.length === 1 ? '1 comunicado' : `${lista.length} comunicados`);
      if (!lista.length) todos.append(el('p', { className: 'vacio', textContent: 'Todavía no hay comunicados publicados.' }));
      lista.forEach(n => {
        const url = urlSegura(n.url), acc = el('div', { className: 'com__acc' });
        if (url) acc.append(el('a', { className: 'btn btn--sec btn--s', href: url, target: '_blank', rel: 'noopener' }, 'Abrir enlace', ico('i-ur', 'ico ico--s')));
        acc.append(...accionesAdmin(n, false));
        todos.append(el('article', { className: 'com', id: 'comunicado-' + n.id },
          el('div', { className: 'com__lado' }, el('time', { dateTime: n.date, textContent: fechaLarga(n.date) }), n.destacado ? el('span', { className: 'pastilla-dest' }, 'Destacado en Inicio') : null),
          el('div', { className: 'com__cuerpo' }, el('h2', { textContent: texto(n.title) }), el('div', { className: 'com__texto' }, parrafos(n.content)), acc.children.length ? acc : null)));
      });
    }
    // Calendario: lista breve
    const breve = $('[data-noticias]');
    if (breve) {
      breve.replaceChildren();
      if (!lista.length) breve.append(el('li', { className: 'agenda__vacio' }, el('span', { textContent: 'Todavía no hay comunicados publicados.' })));
      lista.slice(0, 3).forEach(n => {
        const b = el('button', { type: 'button' }, el('b', { textContent: texto(n.title) }), el('small', { textContent: fechaLarga(n.date) }));
        b.addEventListener('click', () => abrirComunicado(n));
        breve.append(el('li', {}, b));
      });
    }
  }
  function abrirComunicado(n) {
    $('[data-leer-fecha]').textContent = fechaLarga(n.date);
    $('[data-leer-fecha]').dateTime = n.date;
    $('[data-leer-titulo]').textContent = texto(n.title);
    $('[data-leer-cuerpo]').replaceChildren(...parrafos(n.content));
    const acc = $('[data-leer-acc]'); acc.replaceChildren(...accionesAdmin(n, true));
    const url = urlSegura(n.url);
    if (url) acc.append(el('a', { className: 'btn btn--sec', href: url, target: '_blank', rel: 'noopener' }, 'Abrir enlace', ico('i-ur', 'ico ico--s')));
    const c = el('button', { type: 'button', className: 'btn' }, 'Cerrar'); c.setAttribute('data-cerrar', ''); acc.append(c);
    $('#modal-leer').showModal();
  }

  /* ---------- Calendario ---------- */
  let mes = hoy.getMonth(), anio = hoy.getFullYear(), sel = new Date(hoy);
  const anima = n => { n.classList.remove('cambia'); void n.offsetWidth; n.classList.add('cambia'); };
  function pintarFecha() {
    if (!$('[data-fecha]')) return;
    const k = tipo(sel), esHoy = +sel === +hoy;
    $('[data-sel-num]').textContent = sel.getDate();
    $('[data-sel-mes]').textContent = may(fmt(sel, { month: 'long' })) + (sel.getFullYear() !== hoy.getFullYear() ? ' ' + sel.getFullYear() : '');
    $('[data-sel-punto]').dataset.t = k;
    $('[data-sel-estado]').textContent = `${may(fmt(sel, { weekday: 'long' }))} · ${k === 'laborable' ? 'día laborable' : k === 'festivo' ? 'festivo' : 'fin de semana'}${esHoy ? ' · hoy' : ''}`;
    anima($('[data-fecha]'));
  }
  function pintarMes() {
    const g = $('[data-mes]'); if (!g) return;
    const pri = new Date(anio, mes, 1), dias = new Date(anio, mes + 1, 0).getDate(), hueco = (pri.getDay() + 6) % 7;
    $('[data-mes-titulo]').textContent = fmt(pri, { month: 'long', year: 'numeric' }).replace(' de ', ' ');
    g.replaceChildren();
    ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((x, i) => g.append(el('div', { className: 'h', textContent: x, title: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i] })));
    for (let i = 0; i < hueco; i++) g.append(el('div'));
    for (let d = 1; d <= dias; d++) {
      const f = new Date(anio, mes, d), k = tipo(f);
      const c = el('button', { type: 'button', className: 'd num', textContent: d });
      c.dataset.t = k; if (+f === +hoy) c.dataset.hoy = '';
      c.setAttribute('aria-pressed', String(+f === +sel));
      c.setAttribute('aria-label', etiquetaDia(f, k) + (esAdmin && k !== 'finde' ? '. Pulsa para cambiar festivo' : ''));
      c.addEventListener('click', () => elegirDia(f, d));
      g.append(c);
    }
  }
  function elegirDia(f, d) {
    sel = f;
    if (esAdmin && !finde(f)) {
      const s = iso(f); festivos.has(s) ? festivos.delete(s) : festivos.add(s);
      guardar(CLAVES.festivos, [...festivos].sort()); pintarProximos(); pintarAvisos();
    }
    pintarMes(); pintarFecha();
    $$('[data-mes] button.d').find(b => b.textContent === String(d))?.focus();
  }
  function pintarProximos() {
    const ul = $('[data-proximos]'); if (!ul) return;
    ul.replaceChildren();
    const lista = proximos().slice(0, 5);
    if (!lista.length) { ul.append(el('li', { className: 'agenda__vacio' }, el('span', { textContent: 'No hay festivos registrados a partir de hoy.' }))); return; }
    lista.forEach(d => ul.append(el('li', {}, el('span', { textContent: may(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })) }), el('span', { textContent: falta(d) }))));
  }


  /* ---------- Avisos (Calendario) ---------- */
  let filtro = 'proximos';
  const rangoTexto = (a, b) => {
    const A = deIso(a), B = b ? deIso(b) : null;
    if (!B || +A === +B) return may(fmt(A, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, ''));
    const mismoAnio = A.getFullYear() === B.getFullYear();
    return `${fmt(A, mismoAnio ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')} – ${fmt(B, { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}`;
  };
  function filasAvisos() {
    const propias = avisos.map(a => ({ ...a, propia: true }));
    const fest = [...festivos].map(deIso).filter(d => !finde(d) && d.getFullYear() >= hoy.getFullYear()).map(d => ({ id: 'f' + iso(d), desde: iso(d), hasta: '', texto: 'Día no laborable', tipo: 'Festivo' }));
    return [...propias, ...fest].sort((a, b) => a.desde.localeCompare(b.desde));
  }
  function pintarAvisos() {
    const tb = $('[data-avisos]'); if (!tb) return;
    const hoyIso = iso(hoy);
    const fin = a => a.hasta || a.desde;
    let filas = filasAvisos();
    if (filtro === 'proximos') filas = filas.filter(a => fin(a) >= hoyIso);
    if (filtro === 'anteriores') filas = filas.filter(a => fin(a) < hoyIso).reverse();
    tb.replaceChildren();
    if (!filas.length) { tb.append(el('tr', { className: 'tabla__vacia' }, el('td', { colSpan: 4, textContent: filtro === 'anteriores' ? 'No hay avisos anteriores.' : 'No hay avisos próximos.' }))); return; }
    filas.forEach(a => {
      const enCurso = a.desde <= hoyIso && fin(a) >= hoyIso;
      const tr = el('tr', { tabIndex: 0 },
        el('td', { className: 'tabla__fecha num' }, rangoTexto(a.desde, a.hasta), enCurso ? el('span', { className: 'en-curso' }, 'En curso') : null),
        el('td', { className: 'tabla__aviso', textContent: texto(a.texto) }),
        el('td', {}, el('span', { className: 'tipo tipo--' + a.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') }, a.tipo)),
        el('td', { className: 'tabla__acc' }));
      tr.dataset.desde = a.desde;
      tr.setAttribute('aria-label', `${rangoTexto(a.desde, a.hasta)}: ${texto(a.texto)}. Pulsa para verlo en el calendario`);
      if (esAdmin && a.propia) {
        const b = el('button', { type: 'button', className: 'ib ib--s', title: 'Eliminar aviso' }, ico('i-trash', 'ico ico--s'));
        b.setAttribute('aria-label', 'Eliminar aviso');
        b.addEventListener('click', e => {
          e.stopPropagation();
          if (!b.dataset.confirmar) { b.dataset.confirmar = '1'; b.classList.add('ib--peligro'); b.title = 'Pulsa otra vez para eliminar'; aviso('Pulsa otra vez para eliminar el aviso.'); return; }
          avisos = avisos.filter(x => x.id !== a.id); guardar(CLAVES.avisos, avisos); pintarAvisos(); aviso('Aviso eliminado.');
        });
        tr.lastChild.append(b);
      }
      const ir = () => { const d = deIso(a.desde); sel = d; mes = d.getMonth(); anio = d.getFullYear(); pintarMes(); pintarFecha(); $('#calendario').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); };
      tr.addEventListener('click', ir);
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } });
      tb.append(tr);
    });
  }
  $$('[data-filtro]').forEach(b => b.addEventListener('click', () => { filtro = b.dataset.filtro; $$('[data-filtro]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); pintarAvisos(); }));
  $('[data-form="aviso"]')?.addEventListener('submit', e => {
    const f = e.target; if (!esAdmin) return;
    if (f.hasta.value && f.hasta.value < f.desde.value) { e.preventDefault(); $('[data-error-aviso]').classList.add('visible'); f.hasta.focus(); return; }
    $('[data-error-aviso]').classList.remove('visible');
    avisos.push({ id: Date.now(), desde: f.desde.value, hasta: f.hasta.value && f.hasta.value !== f.desde.value ? f.hasta.value : '', texto: f.texto.value.trim(), tipo: f.tipo.value });
    guardar(CLAVES.avisos, avisos); f.reset(); pintarAvisos(); aviso('Aviso añadido en este navegador.');
  });

  /* ---------- Modo editor ---------- */
  function setAdmin(v, silencioso) {
    esAdmin = v; document.body.classList.toggle('is-admin', v);
    try { v ? sessionStorage.setItem(CLAVES.editor, '1') : sessionStorage.removeItem(CLAVES.editor); } catch {}
    pintarAccesos(); pintarMes(); pintarComunicados(); pintarAvisos();
    if (!silencioso) aviso(v ? 'Modo editor activado.' : 'Sesión de editor cerrada.');
  }
  function exportar() {
    if (!esAdmin) return;
    const json = JSON.stringify({ accesos, festivos: [...festivos].sort(), noticias, avisos }, null, 2).replace(/</g, '\\u003c');
    const js = '/* Contenido editable del Hub Corporativo. Generado con «Exportar para servidor». Súbelo a la carpeta JavaScript/. */\nwindow.HUB_DATA = ' + json + ';\n';
    const a = el('a', { href: URL.createObjectURL(new Blob([js], { type: 'text/javascript' })), download: 'hub-data.js' });
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    aviso('Archivo hub-data.js generado. Súbelo a la carpeta JavaScript del servidor.');
  }
  $('[data-form="login"]')?.addEventListener('submit', e => {
    const f = e.target;
    // AVISO: credencial heredada de v1.1.0, visible en el código fuente. Sustituir por autenticación en servidor.
    if (f.usuario.value === 'Administrador' && f.clave.value === 'Sevilla-2026') { f.reset(); $('[data-error]', f).classList.remove('visible'); setAdmin(true); }
    else { e.preventDefault(); $('[data-error]', f).classList.add('visible'); f.clave.value = ''; f.clave.focus(); }
  });
  $('[data-form="noticia"]')?.addEventListener('submit', e => {
    const f = e.target; if (!esAdmin) return;
    noticias.unshift({ id: Date.now(), title: f.title.value.trim(), content: f.content.value.trim(), url: urlSegura(f.url.value.trim()), date: iso(new Date()), destacado: f.destacado.checked });
    guardar(CLAVES.noticias, noticias); pintarComunicados(); f.reset(); aviso('Comunicado publicado en este navegador.');
  });
  $('[data-form="acceso"]')?.addEventListener('submit', e => {
    const f = e.target; if (!esAdmin) return;
    accesos[f.id.value] = { ...accesos[f.id.value], title: f.title.value.trim(), desc: f.desc.value.trim(), url: f.url.value.trim() || '#' };
    guardar(CLAVES.accesos, accesos); pintarAccesos(); aviso('Acceso actualizado.');
  });

  const video = $('#video');
  const acciones = {
    login: () => { $('#modal-login').showModal(); $('#admin-usuario').focus(); },
    salir: () => setAdmin(false),
    exportar,
    'nueva-noticia': () => $('#modal-noticia').showModal(),
    'nuevo-aviso': () => { const f = $('[data-form="aviso"]'); if (!f.desde.value) f.desde.value = iso(sel); $('#modal-aviso').showModal(); f.texto.focus(); },
    'mes-ant': () => { if (--mes < 0) { mes = 11; anio--; } pintarMes(); },
    'mes-sig': () => { if (++mes > 11) { mes = 0; anio++; } pintarMes(); },
    'ir-hoy': () => { mes = hoy.getMonth(); anio = hoy.getFullYear(); sel = new Date(hoy); pintarMes(); pintarFecha(); },
    video: () => { $('#modal-video').showModal(); video?.play().catch(() => {}); }
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-accion]'); if (a && acciones[a.dataset.accion]) acciones[a.dataset.accion]();
    if (e.target.closest('[data-cerrar]')) e.target.closest('dialog').close();
    if (e.target.tagName === 'DIALOG') e.target.close();
  });
  $('#modal-video')?.addEventListener('close', () => video?.pause());

  /* ---------- Menú ---------- */
  const links = $('#nav-links'), bMenu = $('.nav__menu');
  if (links && bMenu) {
    const cerrarMenu = () => { links.classList.remove('abierto'); bMenu.setAttribute('aria-expanded', 'false'); bMenu.setAttribute('aria-label', 'Abrir menú'); };
    bMenu.addEventListener('click', () => { const ab = links.classList.toggle('abierto'); bMenu.setAttribute('aria-expanded', ab); bMenu.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); });
    links.addEventListener('click', e => { if (e.target.closest('a')) cerrarMenu(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('abierto')) { cerrarMenu(); bMenu.focus(); } });
  }

  let editor = false; try { editor = sessionStorage.getItem(CLAVES.editor) === '1'; } catch {}
  if (editor) setAdmin(true, true);
  else { pintarAccesos(); pintarMes(); pintarComunicados(); pintarAvisos(); }
  pintarHoy(); pintarFecha(); pintarProximos();

  /* ---------- Entradas animadas ---------- */
  $$('[data-entra]').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--i', i)));
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('anim');
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('visto'); io.unobserve(x.target); } }), { threshold: .1 });
    $$('[data-entra]').forEach(g => io.observe(g));
  }
})();
