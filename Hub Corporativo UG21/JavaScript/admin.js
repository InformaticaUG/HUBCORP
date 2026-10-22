/* People Hub · modo administrador (versión servidor PHP)
   - Login y sesión validados en api.php
   - Texto, enlaces e imágenes por subsección se guardan en PHP/content.json y Media/People-Hub/subidas/ */
(function () {
  'use strict';

  var PAGE = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index';
  var content = {}, blocks = [], admin = false;

  /* ---------- API ---------- */
  function api(action, payload) {
    return fetch('PHP/api.php?action=' + action, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'PeopleHub' },
      body: JSON.stringify(payload || {})
    }).then(handle);
  }
  function handle(r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok) throw new Error(j.error || 'Error del servidor (' + r.status + ')');
      return j;
    });
  }
  function uploadImage(blob) {
    var fd = new FormData();
    fd.append('file', blob, 'imagen.jpg');
    return fetch('PHP/api.php?action=upload', { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'PeopleHub' }, body: fd }).then(handle);
  }

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;
    if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return '';
    if (/^(\/|\.\/|\.\.\/|#)/.test(u) || /\.(html|pdf|docx?|xlsx?|pptx?)$/i.test(u)) return u;
    return 'https://' + u;
  }
  function safeImg(s) { return /^Media\/People-Hub\/subidas\/[\w-]+\.(jpe?g|png|webp|gif)$/i.test(s) || /^https:\/\//i.test(s) ? s : ''; }
  function hasContent(d) { return !!d && ((d.text && d.text.trim()) || (d.images && d.images.length) || (d.links && d.links.length)); }

  /* ---------- render de contenido ---------- */
  function richHTML(d) {
    var out = '';
    if (d.text && d.text.trim()) {
      out += d.text.trim().split(/\n\s*\n/).map(function (p) { return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
    }
    var imgs = (d.images || []).map(safeImg).filter(Boolean);
    if (imgs.length) out += '<div class="ph-gallery">' + imgs.map(function (s) { return '<img src="' + esc(s) + '" alt="" loading="lazy">'; }).join('') + '</div>';
    var links = (d.links || []).filter(function (l) { return l && safeUrl(l.url); });
    if (links.length) out += '<div class="ph-links">' + links.map(function (l) {
      return '<a href="' + esc(safeUrl(l.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label || l.url) + ' ↗</a>';
    }).join('') + '</div>';
    return out;
  }
  function getBlocks() {
    var list = [];
    document.querySelectorAll('#acc > details').forEach(function (d) {
      var host = d.querySelector(':scope > .content'), title = d.querySelector(':scope > summary .t').textContent.trim();
      list.push({ key: PAGE + '|' + title, title: title, host: host, original: host.innerHTML });
    });
    var panel = document.querySelector('.panel');
    if (panel) {
      var h = panel.querySelector('h2'), host2 = document.createElement('div');
      host2.className = 'ph-host';
      while (h.nextSibling) host2.appendChild(h.nextSibling);
      panel.appendChild(host2);
      list.push({ key: PAGE + '|panel', title: h.textContent.trim(), host: host2, original: host2.innerHTML });
    }
    return list;
  }
  function render(b) {
    var d = content[b.key];
    b.host.querySelectorAll(':scope > .ph-edit-row').forEach(function (r) { r.remove(); });
    if (hasContent(d)) { b.host.innerHTML = richHTML(d); b.replaced = true; }
    else if (b.replaced) { b.host.innerHTML = b.original; b.replaced = false; document.dispatchEvent(new CustomEvent('ph:restaurado', { detail: b.host })); }
    if (admin) {
      var row = document.createElement('div');
      row.className = 'ph-edit-row';
      row.innerHTML = '<button type="button" class="ph-btn ph-edit">Editar contenido</button>';
      row.firstChild.addEventListener('click', function () { openEditor(b); });
      b.host.appendChild(row);
    }
  }
  function renderAll() { blocks.forEach(render); updateChrome(); }

  /* ---------- modal ---------- */
  function modal(html, cls) {
    var ov = document.createElement('div');
    ov.className = 'ph-overlay';
    ov.innerHTML = '<div class="ph-modal ' + (cls || '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    document.body.appendChild(ov);
    function close() { ov.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    return { el: ov.firstChild, close: close };
  }

  /* ---------- login ---------- */
  function openLogin() {
    var m = modal('<h3>Acceso administrador</h3>' +
      '<label>Usuario<input type="text" id="phU" autocomplete="username"></label>' +
      '<label>Contraseña<input type="password" id="phP" autocomplete="current-password"></label>' +
      '<p class="ph-err" id="phErr" hidden></p>' +
      '<div class="ph-actions"><button type="button" class="ph-btn ph-ghost" id="phCancel">Cancelar</button><button type="button" class="ph-btn" id="phOk">Entrar</button></div>');
    var u = m.el.querySelector('#phU'), p = m.el.querySelector('#phP'), err = m.el.querySelector('#phErr'), ok = m.el.querySelector('#phOk');
    u.focus();
    function go() {
      ok.disabled = true;
      api('login', { user: u.value, pass: p.value }).then(function () {
        admin = true; m.close(); renderAll();
      }).catch(function (e) {
        err.textContent = e.message; err.hidden = false; p.value = ''; p.focus(); ok.disabled = false;
      });
    }
    ok.addEventListener('click', go);
    m.el.querySelector('#phCancel').addEventListener('click', m.close);
    m.el.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
  }
  function logout() { api('logout').catch(function () {}).then(function () { admin = false; renderAll(); }); }

  /* ---------- editor ---------- */
  function resizeImage(file, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var r = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(cb, 'image/jpeg', 0.82);
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function openEditor(b) {
    var cur = content[b.key] || {};
    var st = { text: cur.text || '', links: (cur.links || []).map(function (l) { return { label: l.label, url: l.url }; }), images: (cur.images || []).slice() };
    var m = modal('<h3>Editar: ' + esc(b.title) + '</h3>' +
      '<label>Texto <small>(deja una línea en blanco para separar párrafos)</small><textarea id="phT" rows="7"></textarea></label>' +
      '<div class="ph-sec"><strong>Imágenes</strong><div id="phImgs" class="ph-thumbs"></div>' +
      '<label class="ph-btn ph-ghost ph-file" id="phFL">+ Añadir fotos<input type="file" accept="image/*" multiple hidden id="phF"></label></div>' +
      '<div class="ph-sec"><strong>Enlaces</strong><div id="phLinks"></div><button type="button" class="ph-btn ph-ghost" id="phAddL">+ Añadir enlace</button></div>' +
      '<p class="ph-err" id="phErr" hidden></p>' +
      '<div class="ph-actions"><button type="button" class="ph-btn ph-danger" id="phDel">Quitar contenido</button><span class="ph-sp"></span>' +
      '<button type="button" class="ph-btn ph-ghost" id="phC">Cancelar</button><button type="button" class="ph-btn" id="phS">Guardar</button></div>', 'ph-wide');
    var el = m.el, ta = el.querySelector('#phT'), err = el.querySelector('#phErr'), busy = 0;
    ta.value = st.text;
    ta.addEventListener('input', function () { st.text = ta.value; });
    function showErr(msg) { err.textContent = msg; err.hidden = !msg; }

    function drawImgs() {
      var box = el.querySelector('#phImgs');
      box.innerHTML = st.images.map(function (s, i) { return '<div class="ph-th"><img src="' + esc(safeImg(s)) + '" alt=""><button type="button" data-i="' + i + '" aria-label="Quitar imagen">×</button></div>'; }).join('') +
        (busy ? '<span class="ph-up">Subiendo…</span>' : '');
      box.querySelectorAll('button').forEach(function (bt) { bt.addEventListener('click', function () { st.images.splice(+bt.dataset.i, 1); drawImgs(); }); });
    }
    function drawLinks() {
      var box = el.querySelector('#phLinks');
      box.innerHTML = st.links.map(function (l, i) {
        return '<div class="ph-lrow"><input type="text" placeholder="Texto del enlace" data-f="label" data-i="' + i + '" value="' + esc(l.label) + '">' +
          '<input type="text" placeholder="https://…" data-f="url" data-i="' + i + '" value="' + esc(l.url) + '">' +
          '<button type="button" class="ph-x" data-i="' + i + '" aria-label="Quitar enlace">×</button></div>';
      }).join('');
      box.querySelectorAll('input').forEach(function (inp) { inp.addEventListener('input', function () { st.links[+inp.dataset.i][inp.dataset.f] = inp.value; }); });
      box.querySelectorAll('.ph-x').forEach(function (bt) { bt.addEventListener('click', function () { st.links.splice(+bt.dataset.i, 1); drawLinks(); }); });
    }
    drawImgs(); drawLinks();
    el.querySelector('#phAddL').addEventListener('click', function () { st.links.push({ label: '', url: '' }); drawLinks(); });
    el.querySelector('#phF').addEventListener('change', function (e) {
      showErr('');
      Array.prototype.forEach.call(e.target.files, function (f) {
        if (!/^image\//.test(f.type)) return;
        busy++; drawImgs();
        resizeImage(f, function (blob) {
          uploadImage(blob).then(function (r) { st.images.push(r.path); })
            .catch(function (er) { showErr(er.message); })
            .then(function () { busy--; drawImgs(); });
        });
      });
      e.target.value = '';
    });
    function persist(data, done) {
      api('save', { key: b.key, data: data }).then(function (r) { content = r.content || content; renderAll(); done(); })
        .catch(function (er) { showErr(er.message); });
    }
    el.querySelector('#phC').addEventListener('click', m.close);
    el.querySelector('#phDel').addEventListener('click', function () {
      if (confirm('¿Quitar el contenido de este apartado?')) persist(null, m.close);
    });
    el.querySelector('#phS').addEventListener('click', function () {
      if (busy) { showErr('Espera a que terminen de subirse las imágenes.'); return; }
      persist({ text: st.text.trim(), images: st.images, links: st.links.filter(function (l) { return safeUrl(l.url); }).map(function (l) { return { label: (l.label || '').trim(), url: safeUrl(l.url) }; }) }, m.close);
    });
  }

  /* ---------- barra y pie ---------- */
  function updateChrome() {
    var bar = document.getElementById('phBar');
    if (bar) bar.remove();
    var f = document.getElementById('phFoot');
    if (f) f.textContent = admin ? 'Cerrar sesión de administrador' : 'Acceso administrador';
    if (!admin) return;
    bar = document.createElement('div');
    bar.id = 'phBar'; bar.className = 'ph-bar';
    bar.innerHTML = '<span class="ph-bar-t">Modo administrador</span>' +
      '<span class="ph-bar-s">' + (blocks.length ? 'Los cambios se publican al pulsar Guardar.' : 'Entra en una sección para editar sus apartados.') + '</span>' +
      '<button type="button" class="ph-btn ph-ghost" id="phOut">Cerrar sesión</button>';
    document.body.appendChild(bar);
    bar.querySelector('#phOut').addEventListener('click', logout);
  }
  function injectFooter() {
    var foot = document.querySelector('[data-admin-host]') || document.querySelector('footer');
    if (!foot) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'phFoot'; b.className = 'ph-foot';
    b.addEventListener('click', function () { admin ? logout() : openLogin(); });
    foot.appendChild(document.createTextNode(' · ')); foot.appendChild(b);
  }

  /* ---------- arranque ---------- */
  function start() {
    blocks = getBlocks(); injectFooter();
    var pContent = fetch('PHP/content.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    var pSession = fetch('PHP/api.php?action=session', { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { return !!j.admin; }).catch(function () { return false; });
    Promise.all([pContent, pSession]).then(function (res) {
      content = res[0] && typeof res[0] === 'object' && !Array.isArray(res[0]) ? res[0] : {};
      admin = res[1];
      renderAll();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
