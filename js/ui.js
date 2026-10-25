/* Componentes y utilidades de interfaz compartidos. */
(function (NG) {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = x => Math.round(+x || 0).toLocaleString('es-AR');
  const n1 = x => (Math.round((+x || 0) * 10) / 10).toLocaleString('es-AR');

  const P = {
    plus: 'M12 5v14M5 12h14', x: 'M18 6 6 18M6 6l12 12', check: 'M20 6 9 17l-5-5',
    chevR: 'm9 18 6-6-6-6', chevL: 'm15 18-6-6 6-6', chevD: 'm6 9 6 6 6-6', chevU: 'm18 15-6-6-6 6',
    trash: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6', copy: 'M8 8h12v12H8zM4 16V4h12',
    share: 'M4 12v8h16v-8M12 3v13M7 8l5-5 5 5', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5', dl: 'M12 3v12M7 10l5 5 5-5M5 21h14', up: 'M12 21V9M7 14l5-5 5 5M5 3h14',
    send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z', chat: 'M21 11.5a8.4 8.4 0 0 1-12.3 7.5L3 21l2-5.5A8.4 8.4 0 1 1 21 11.5z',
    wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8 19 13M17.8 6.2 19 5M3 21l9-9M12.2 6.2 11 5',
    arrU: 'M12 19V5M5 12l7-7 7 7', arrD: 'M12 5v14M19 12l-7 7-7-7', swap: 'M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  };
  const ic = (k, s = 18) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[k]}"/></svg>`;

  // Anillo de progreso (0–100)
  function ring(pct, o = {}) {
    const s = o.size || 64, p = Math.max(0, Math.min(100, pct || 0));
    return `<div class="ring" style="width:${s}px;height:${s}px">
      <svg viewBox="0 0 36 36" width="${s}" height="${s}"><circle cx="18" cy="18" r="15.915" class="ring-bg"/>
      <circle cx="18" cy="18" r="15.915" class="ring-fg" style="stroke:${o.color || 'var(--acc)'}" stroke-dasharray="${p} 100" transform="rotate(-90 18 18)"/></svg>
      <div class="ring-c">${o.label != null ? o.label : Math.round(p) + '%'}${o.sub ? `<small>${o.sub}</small>` : ''}</div></div>`;
  }
  const bar = (v, max, color) => `<div class="mbar"><i style="width:${Math.min(100, max > 0 ? v / max * 100 : 0)}%;background:${color}"></i></div>`;
  const pills = (t, o = {}) => `<div class="pills${o.sm ? ' sm' : ''}">
      ${o.noK ? '' : `<span class="pill k">${n0(t.k)} kcal</span>`}
      <span class="pill p">P ${n0(t.p)} g</span><span class="pill c">C ${n0(t.c)} g</span><span class="pill f">G ${n0(t.f)} g</span></div>`;

  // Cantidades amigables: "2 huevos", "150 g ≈ 1 taza"
  function frac(n) {
    const q = Math.round(n * 4) / 4, w = Math.floor(q), r = q - w;
    const fr = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }[r] || '';
    return (w ? String(w) : '') + fr || '0';
  }
  const plw = w => (w === 'scoop' ? 'scoops' : /[aeiouáéíóú]$/i.test(w) ? w + 's' : /ón$/.test(w) ? w.replace(/ón$/, 'ones') : /z$/.test(w) ? w.slice(0, -1) + 'ces' : w + 'es');
  const plural = (u, n) => (n <= 1.01 || /^[¼½¾]/.test(u) ? u : u.split(' ').map(plw).join(' '));
  function qty(f, g) {
    const unit = f && f.ml ? 'ml' : 'g', main = `${n0(g)} ${unit}`;
    if (!f || !f.u || !f.ug) return { main, sub: '' };
    const n = g / f.ug, fr = frac(n);
    if (f.uf && fr !== '0') return { main: `${fr} ${plural(f.u, n)}`, sub: main };
    if (n >= 0.2 && n <= 12 && fr !== '0') return { main, sub: `≈ ${fr} ${plural(f.u, n)}` };
    return { main, sub: '' };
  }

  const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const fdate = (key, long) => {
    const d = new Date(key + 'T12:00:00');
    if (isNaN(d)) return key;
    return long ? d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : `${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
  };

  /* ── Capas: hojas inferiores, diálogos y avisos ────────────────── */
  const stack = [];
  function open(html, o = {}) {
    const layer = $('#layer');
    const el = document.createElement('div');
    el.className = 'ov' + (o.center ? ' center' : '');
    el.innerHTML = `<div class="sheet${o.wide ? ' wide' : ''}" role="dialog" aria-modal="true">${o.noClose ? '' : `<button class="sheet-x" data-ui="close" aria-label="Cerrar">${ic('x', 20)}</button>`}<div class="sheet-b">${html}</div></div>`;
    el.addEventListener('click', e => { if (e.target === el && !o.noClose) close(); });
    layer.appendChild(el);
    stack.push({ el, o });
    requestAnimationFrame(() => el.classList.add('on'));
    document.body.classList.add('noscroll');
    const first = el.querySelector('[autofocus]');
    if (first) setTimeout(() => first.focus(), 60);
    return el;
  }
  function update(html) { const top = stack[stack.length - 1]; if (top) { const b = top.el.querySelector('.sheet-b'); const st = b.parentElement.scrollTop; b.innerHTML = html; b.parentElement.scrollTop = st; } }
  function close() {
    const top = stack.pop(); if (!top) return;
    top.el.classList.remove('on');
    setTimeout(() => top.el.remove(), 220);
    if (!stack.length) document.body.classList.remove('noscroll');
    if (top.o.onClose) top.o.onClose();
  }
  const closeAll = () => { while (stack.length) close(); };
  const isOpen = () => stack.length > 0;

  function confirm(msg, o = {}) {
    return new Promise(res => {
      const el = open(`<h3>${esc(o.title || '¿Seguro?')}</h3><p class="mut">${esc(msg)}</p>
        <div class="row end gap"><button class="btn ghost" data-ui="no">${esc(o.no || 'Cancelar')}</button>
        <button class="btn ${o.danger ? 'danger' : 'pri'}" data-ui="yes">${esc(o.yes || 'Aceptar')}</button></div>`, { center: true, onClose: () => res(false) });
      el.querySelector('[data-ui=yes]').onclick = () => { const t = stack[stack.length - 1]; t.o.onClose = null; close(); res(true); };
      el.querySelector('[data-ui=no]').onclick = () => close();
    });
  }

  let toastT;
  function toast(msg, ms = 2600) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.innerHTML = esc(msg); t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('✅ Copiado'); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove(); toast(ok ? '✅ Copiado' : 'No se pudo copiar: seleccioná el texto a mano'); return ok;
    }
  }
  // Normaliza teléfonos al formato internacional de WhatsApp (asume Argentina si falta el código de país)
  function phone(num) {
    let d = String(num || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length === 10) d = '549' + d;
    else if (d.length === 12 && d.startsWith('54') && !d.startsWith('549')) d = '549' + d.slice(2);
    return d;
  }
  function wa(num, text) {
    window.open(`https://wa.me/${phone(num)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  async function share(o) {
    if (navigator.share) { try { await navigator.share(o); return true; } catch (e) { if (e.name === 'AbortError') return false; } }
    return copy([o.text, o.url].filter(Boolean).join('\n'));
  }

  // Repinta conservando foco, cursor y scroll (para editar sin perder el lugar)
  function paint(root, html) {
    const ae = document.activeElement, key = ae && ae.dataset ? ae.dataset.k : null;
    let sel = null; try { if (key) sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) {}
    const sy = window.scrollY;
    root.innerHTML = html;
    if (key) {
      const el = root.querySelector(`[data-k="${CSS.escape(key)}"]`);
      if (el) { el.focus({ preventScroll: true }); try { if (sel && sel[0] != null) el.setSelectionRange(sel[0], sel[1]); } catch (e) {} }
    }
    window.scrollTo(0, sy);
  }

  // Color de acento de la marca del entrenador
  function accent(hex) {
    if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return;
    const r = document.documentElement.style;
    r.setProperty('--acc', hex);
    const n = parseInt(hex.slice(1), 16);
    const dk = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * 0.72));
    r.setProperty('--acc2', `rgb(${dk.join(',')})`);
    const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    r.setProperty('--onacc', lum > 0.62 ? '#0b1020' : '#ffffff');
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = hex;
  }
  function theme(t) {
    const h = document.documentElement;
    if (t === 'light' || t === 'dark') h.dataset.theme = t; else delete h.dataset.theme;
  }

  NG.UI = { $, esc, n0, n1, ic, ring, bar, pills, qty, frac, fdate, open, update, close, closeAll, isOpen, confirm, toast, copy, wa, phone, share, paint, accent, theme };

  document.addEventListener('click', e => { const b = e.target.closest('[data-ui=close]'); if (b) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length && !stack[stack.length - 1].o.noClose) close(); });
})(window.NG);
