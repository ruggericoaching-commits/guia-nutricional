/* App del alumno: Hoy · Plan · Afuera · Hábitos · Progreso */
(function (NG) {
  const U = NG.UI, S = NG.S, E = NG.E;
  const { esc, n0, n1, ic, ring, bar, pills, qty, fdate } = U;
  let st = null, root = null;

  /* ── Datos ─────────────────────────────────────────────────────── */
  function foodsFromPlan(pl) {
    const fd = {};
    Object.entries(pl.fd || {}).forEach(([id, a]) => { fd[id] = NG.unpackFood(id, a); });
    return fd;
  }
  // Recomendaciones: se recalculan con el mismo motor a partir del perfil y lo que activó el entrenador
  function planRecs(pl) {
    if (!pl.pr) return [];
    const cl = { profile: pl.pr, calc: pl.ca || {}, plan: { meals: (pl.m || []).map(m => ({ ctx: m.x })), recState: pl.rs || {}, customRecs: pl.cr || [], free: pl.fr || 0 } };
    return E.activeRecs(cl, E.targets(cl)).map(x => [x.e, x.t, x.x]);
  }
  const PL = () => st.data.plan;
  const meals = () => PL().m || [];
  const tgt = m => ({ k: m.t[0], p: m.t[1], c: m.t[2], f: m.t[3] });
  const items = o => (o.it || []).map(([f, g]) => ({ f, g }));
  const rules = () => ({ diet: PL().cl.d, allergens: PL().cl.al || [], exclude: PL().cl.ex || [] });
  const log = d => (st.data.logs[d] = st.data.logs[d] || { m: {}, w: 0, h: {} });
  const peek = d => st.data.logs[d] || { m: {}, w: 0, h: {} };
  const glasses = () => Math.max(4, Math.round((PL().t.w || 2000) / 250));
  // Arranque por fases (si el entrenador lo activó) y comida libre semanal
  const phase = () => (PL().ph ? E.phaseOf(PL().ph, S.today()) : null);
  const habitList = () => (phase() ? phase().ph.habits : HABITS);
  const freePerWeek = () => +(PL().fr || 0);
  const countFree = L => Object.values((L && L.m) || {}).filter(v => v === -3).length;
  function freeLeft(d) {
    const mon = S.addDays(d, -((new Date(d + 'T12:00:00').getDay() + 6) % 7));
    let used = 0;
    for (let i = 0; i < 7; i++) used += countFree(st.data.logs[S.addDays(mon, i)]);
    return Math.max(0, freePerWeek() - used);
  }
  const leftTxt = n => (n === 1 ? 'te queda 1' : `te quedan ${n}`);
  function save() { if (!st.preview) S.saveAlumno(st.data); }

  function dayTotals(d) {
    const L = peek(d), t = { k: 0, p: 0, c: 0, f: 0 };
    meals().forEach(m => {
      const v = L.m[m.i]; if (v == null || v === -2) return;
      const o = m.o[v], add = v >= 0 && o && !o.y ? E.sum(items(o)) : tgt(m);
      t.k += add.k; t.p += add.p; t.c += add.c; t.f += add.f;
    });
    return t;
  }
  const doneCount = d => meals().filter(m => { const v = peek(d).m[m.i]; return v != null && v !== -2; }).length;

  function weekStats(endKey) {
    const ws = st.data.weights || [];
    const inR = (a, b) => ws.filter(w => w.d >= a && w.d <= b);
    const avg = arr => (arr.length ? arr.reduce((s, w) => s + w.kg, 0) / arr.length : null);
    const a1 = S.addDays(endKey, -6), p1 = S.addDays(endKey, -13), p2 = S.addDays(endKey, -7);
    const cur = inR(a1, endKey), prev = inR(p1, p2);
    let done = 0, tot = 0, wsum = 0, wdays = 0, hsum = 0, hdays = 0, lib = 0;
    for (let i = 0; i < 7; i++) {
      const d = S.addDays(endKey, -i), L = st.data.logs[d];
      if (!L) continue;
      lib += countFree(L);
      const any = Object.keys(L.m || {}).length;
      if (any) { tot += meals().length; done += doneCount(d); }
      if (L.w) { wsum += L.w; wdays++; }
      const hc = Object.values(L.h || {}).filter(Boolean).length;
      if (hc || any) { hsum += hc / 3; hdays++; }
    }
    const cins = cur.filter(w => w.cin).map(w => w.cin);
    return {
      from: a1, to: endKey, avg: avg(cur), prev: avg(prev), nW: cur.length,
      adh: tot ? Math.round(done / tot * 100) : null, done, tot, lib,
      water: wdays ? wsum / wdays : null, habits: hdays ? Math.round(hsum / hdays * 100) : null,
      cin: cins.length ? cins[cins.length - 1] : null,
    };
  }

  // Tres semanas de uso simulado para la vista previa del alumno de ejemplo
  function demoData(plan) {
    let s = 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const logs = {}, weights = [], today = S.today(), ms = plan.m || [];
    for (let i = 20; i >= 0; i--) {
      const d = S.addDays(today, -i), L = { m: {}, w: 0, h: {} };
      const sat = new Date(d + 'T12:00:00').getDay() === 6;
      ms.forEach((m, k) => {
        if (i === 0 && k > 1) return;
        const r = rnd();
        if (sat && k === ms.length - 1 && plan.fr) { L.m[m.i] = -3; return; } // comida libre del sábado
        L.m[m.i] = r < 0.06 ? -2 : m.x !== 'casa' && r < 0.3 ? -1 : Math.floor(rnd() * m.o.length);
      });
      L.w = i === 0 ? 4 : 5 + Math.floor(rnd() * 5);
      L.h = {};
      ['prot', 'hor', 'veg', 'porc', 'sueno', 'mov', 'planif'].forEach(h => { L.h[h] = rnd() < 0.75; });
      logs[d] = L;
      if (rnd() < 0.75 || i === 0) weights.push({ d, kg: Math.round((82.4 - (20 - i) * 0.07 + (rnd() - 0.5) * 0.6) * 10) / 10, ...(i % 7 === 0 ? { cin: 91 - (20 - i) * 0.12 } : {}) });
    }
    return { plan, logs, weights, checks: [{ d: S.addDays(today, -14) }, { d: S.addDays(today, -7) }], shop: {}, ui: {} };
  }

  /* ── Montaje ───────────────────────────────────────────────────── */
  function mount(o = {}) {
    root = document.getElementById('app');
    const data = o.preview ? (o.demo ? demoData(o.plan) : { plan: o.plan, logs: {}, weights: [], checks: [], shop: {}, ui: {} }) : S.alumno();
    if (!data || !data.plan) return welcome();
    st = { data, preview: !!o.preview, demo: !!o.demo, onExit: o.onExit, tab: st && !o.preview && st.tab ? st.tab : 'hoy', day: S.today(), open: {}, sel: {}, place: -1, hm: null };
    st.data.logs = st.data.logs || {}; st.data.weights = st.data.weights || []; st.data.checks = st.data.checks || []; st.data.shop = st.data.shop || {}; st.data.ui = st.data.ui || {};
    NG.extraFoods = foodsFromPlan(data.plan);
    if (!data.plan.r) data.plan.r = planRecs(data.plan);
    U.accent((data.plan.co || {}).a);
    if (!o.preview) U.theme(st.data.ui.theme);
    NG.handlers = { click, input, change };
    document.title = ((data.plan.co || {}).b || 'Guía Nutricional');
    window.scrollTo(0, 0);
    render();
  }

  async function importCode(code, silent) {
    let pl;
    try { pl = await S.unpack(code); } catch (e) { pl = null; }
    if (!pl || pl.v !== 1 || !Array.isArray(pl.m)) { U.toast('⚠️ El link del plan no es válido o está incompleto'); return false; }
    const cur = S.alumno();
    if (cur && cur.plan && cur.plan.id === pl.id) {
      if ((pl.ver || 0) > (cur.plan.ver || 0)) { cur.plan = pl; S.saveAlumno(cur); U.toast(`✅ Plan actualizado (versión ${pl.ver})`); }
      else if ((pl.ver || 0) < (cur.plan.ver || 0) && !silent) U.toast('Ya tenés una versión más nueva de tu plan');
    } else {
      if (cur && cur.plan && cur.plan.id !== pl.id && Object.keys(cur.logs || {}).length) {
        const ok = await U.confirm('En este dispositivo ya hay otro plan con registros. ¿Reemplazarlo por este?', { yes: 'Reemplazar' });
        if (!ok) return false;
      }
      S.saveAlumno({ plan: pl, logs: {}, weights: [], checks: [], shop: {}, ui: {} });
      U.toast('🎉 ¡Tu plan está listo!');
    }
    S.persist();
    return true;
  }
  async function fromHash(code) {
    const ok = await importCode(code, true);
    if (!ok && !S.alumno()) { location.hash = ''; return; }
    mount();
  }

  /* ── Bienvenida (sin plan) ─────────────────────────────────────── */
  function welcome() {
    st = null;
    NG.handlers = {
      click: async (a, el) => {
        if (a === 'w-import') { const v = (document.getElementById('w-code').value || '').trim(); const m = v.match(/#p=([\w-]+)/) || v.match(/^([01][\w-]{20,})$/); if (!m) return U.toast('Pegá el link completo que te envió tu entrenador'); if (await importCode(m[1])) mount(); }
        if (a === 'w-coach') location.hash = '#coach';
      },
    };
    root.innerHTML = `<div class="wrap narrow welcome">
      <div class="logo-big">🥗</div>
      <h1>Tu guía nutricional</h1>
      <p class="mut">Para ver tu plan, abrí el link que te envió tu entrenador.<br>Si instalaste la app y aparece vacía, pegá ese link acá:</p>
      <div class="card"><textarea id="w-code" rows="3" placeholder="Pegá aquí el link de tu plan"></textarea>
      <button class="btn pri block" data-a="w-import">${ic('dl')} Cargar mi plan</button></div>
      <button class="link mut sm" data-a="w-coach">${ic('lock', 14)} Acceso entrenador</button>
    </div>`;
  }

  /* ── Render ────────────────────────────────────────────────────── */
  const TABS = [['hoy', '🏠', 'Hoy'], ['plan', '🍽️', 'Plan'], ['afuera', '🧭', 'Afuera'], ['habitos', '💡', 'Hábitos'], ['progreso', '📈', 'Progreso']];
  function render() {
    if (!st) return;
    const v = { hoy: vHoy, plan: vPlan, afuera: vAfuera, habitos: vHabitos, progreso: vProgreso }[st.tab] || vHoy;
    U.paint(root, `${st.preview ? `<div class="pvbar">👀 Vista previa del alumno${st.demo ? ' · datos simulados' : ''} <button class="btn sm" data-a="exitpv">${ic('chevL', 14)} Volver al panel</button></div>` : ''}
      <div class="wrap narrow cl">${v()}</div>
      <nav class="navb">${TABS.map(([k, e, n]) => `<button class="${st.tab === k ? 'on' : ''}" data-a="tab" data-t="${k}"><span>${e}</span>${n}</button>`).join('')}</nav>`);
  }

  function hero(title, sub, right = '') {
    const co = PL().co || {};
    return `<header class="hero"><div class="hero-top"><span class="brand">${esc(co.b || co.n || 'Tu guía nutricional')}</span>
      <span class="row gap-s">${NG.installEvt && !st.preview ? `<button class="chip on" data-a="install">📲 Instalar</button>` : ''}<button class="ib" data-a="settings" aria-label="Ajustes">${ic('gear', 20)}</button></span></div>
      <div class="hero-main"><div><h1>${title}</h1>${sub ? `<div class="hsub">${sub}</div>` : ''}</div>${right}</div></header>`;
  }

  /* HOY */
  function vHoy() {
    const P = PL(), d = st.day, L = peek(d), ms = meals(), today = S.today();
    const done = doneCount(d), pct = ms.length ? done / ms.length * 100 : 0;
    const h = new Date().getHours(), hi = h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    const tt = dayTotals(d), T = P.t;
    const tips = (P.r || []);
    const tip = tips.length ? tips[(Math.floor(Date.now() / 864e5)) % tips.length] : null;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.navigator.standalone;
    const g = glasses(), w = L.w || 0, ph = phase(), fl = freePerWeek() ? freeLeft(d) : 0;
    return `${hero(`${hi},${esc(P.cl.n || '')} 👋`, fdate(d, true), ring(pct, { size: 76, label: `${done}/${ms.length}`, sub: 'comidas', color: 'var(--onacc)' }))}
      <div class="daynav"><button class="ib" data-a="day" data-d="-1">${ic('chevL')}</button>
        <span>${d === today ? 'Hoy' : d === S.addDays(today, -1) ? 'Ayer' : fdate(d)}</span>
        <button class="ib" data-a="day" data-d="1" ${d >= today ? 'disabled' : ''}>${ic('chevR')}</button></div>
      ${ph && d === today ? phaseCard(ph) : ''}
      ${d === today && photoDue() ? `<section class="card tipc"><b>📸 Esta semana tocan tus fotos de progreso</b><p class="sm">De frente, de costado y de espalda, con la misma luz, lugar y ropa que la vez anterior. Subilas a tu carpeta de Drive, en «03 Fotos de Progreso» (la misma carpeta de tus videos).</p></section>` : ''}
      ${isIOS && !st.data.ui.iosTip && !st.preview ? `<div class="card tipc"><b>📲 Instalala en tu iPhone</b><p class="sm mut">Tocá <b>Compartir</b> ⬆️ y después <b>«Agregar a inicio»</b>. Así la abrís como una app y tus datos quedan guardados.</p><button class="link sm" data-a="iosx">Entendido</button></div>` : ''}
      <section class="card">
        <div class="row between"><h3>Tu día</h3><span class="mut sm">objetivo ${n0(T.k)} kcal</span></div>
        <div class="kc"><b>${n0(tt.k)}</b><span>/ ${n0(T.k)} kcal (estimado según lo que marcaste)</span></div>
        ${bar(tt.k, T.k, 'var(--acc)')}
        <div class="mgrid">
          <div><span class="dot p"></span>Proteína<b>${n0(tt.p)} / ${n0(T.p)} g</b>${bar(tt.p, T.p, 'var(--P)')}</div>
          <div><span class="dot c"></span>Carbos<b>${n0(tt.c)} / ${n0(T.c)} g</b>${bar(tt.c, T.c, 'var(--C)')}</div>
          <div><span class="dot f"></span>Grasas<b>${n0(tt.f)} / ${n0(T.f)} g</b>${bar(tt.f, T.f, 'var(--F)')}</div>
        </div>
      </section>
      <section class="card">
        <div class="row between"><h3>Comidas</h3><span class="mut sm">tocá ✓ cuando la hagas</span></div>
        <div class="tl">${ms.map(m => {
          const v = L.m[m.i], o = v >= 0 ? m.o[v] : null;
          const lbl = v == null ? '' : v === -1 ? '🧭 Comí afuera' : v === -2 ? '😅 Me salí del plan' : v === -3 ? '🍕 Comida libre' : (o ? o.n : '');
          return `<div class="tli ${v == null ? '' : v === -2 ? 'off' : v === -3 ? 'done free' : 'done'}">
            <button class="tck" data-a="mcheck" data-m="${m.i}" aria-label="Marcar">${v == null ? '' : v === -2 ? '–' : v === -3 ? '🍕' : ic('check', 18)}</button>
            <div class="tlb" data-a="mopen" data-m="${m.i}"><div class="row between"><b>${(NG.MEAL_TYPES[m.y] || {}).e || '🍽️'} ${esc(m.n)}</b><span class="mut sm">${esc(m.h || '')}</span></div>
            <div class="sm ${lbl ? '' : 'mut'}">${lbl ? esc(lbl) : `${m.o.length} ${m.o.length === 1 ? 'opción' : 'opciones'} · ${n0(m.t[0])} kcal`}${m.g && m.g !== 'normal' ? ` <span class="tag">${NG.TAGS[m.g]}</span>` : ''}</div></div>
            ${ic('chevR', 16)}</div>`;
        }).join('')}</div>
        ${freePerWeek() ? `<button class="freeline" data-a="free">🍕 Comida libre planificada <b>${fl ? leftTxt(fl) + ' esta semana' : 'ya la usaste esta semana'}</b></button>` : ''}
      </section>
      <section class="card">
        <div class="row between"><h3>💧 Agua</h3><span class="mut sm">${n1(w * 0.25)} / ${n1(g * 0.25)} L</span></div>
        <div class="glasses">${Array.from({ length: g }, (_, i) => `<button class="gl ${i < w ? 'on' : ''}" data-a="wset" data-n="${i < w && i === w - 1 ? i : i + 1}" aria-label="Vaso ${i + 1}"></button>`).join('')}</div>
        <div class="row center gap"><button class="btn ghost sm" data-a="water" data-d="-1">− vaso</button><button class="btn pri sm" data-a="water" data-d="1">+ vaso</button></div>
      </section>
      ${tip ? `<section class="card tip"><div class="tip-e">${tip[0]}</div><div><b>${esc(tip[1])}</b><p class="sm">${esc(tip[2])}</p></div></section>` : ''}
      ${P.ms ? `<section class="card coachmsg"><b>💬 Mensaje de ${esc((P.co || {}).n || 'tu entrenador')}</b><p>${esc(P.ms).replace(/\n/g, '<br>')}</p></section>` : ''}
      <p class="disc">Esta guía es orientativa y no reemplaza la consulta médica. Ante cualquier condición de salud, consultá con tu médico.</p>`;
  }

  /* PLAN */
  function itemRow(it) {
    const f = NG.food(it.f); if (!f) return '';
    const q = qty(f, it.g), m = E.mac(it.f, it.g);
    return `<button class="it" data-a="swap" data-f="${it.f}" data-g="${it.g}">
      <span class="it-e">${f.e}</span><span class="it-n">${esc(f.n)}${f.ap ? ' <small class="mut">(aprox.)</small>' : ''}<small>${n0(m.k)} kcal · P ${n0(m.p)} · C ${n0(m.c)} · G ${n0(m.f)}</small></span>
      <span class="it-q"><b>${q.main}</b>${q.sub ? `<small>${q.sub}</small>` : ''}</span><span class="it-s">${ic('swap', 15)}</span></button>`;
  }
  function handsBlock(t, type, compact) {
    const hd = E.hands(t, type);
    const pn = { palm: 'Palmas', fist: 'Puños', cup: 'Manos ahuecadas', thumb: 'Pulgares' };
    return `<div class="hands${compact ? ' compact' : ''}">${NG.HANDS.map(x => hd[x.k] ? `<div class="hand"><span class="he">${x.e}</span><b>${U.frac(hd[x.k])}</b><small>${hd[x.k] > 1 ? pn[x.k] : x.n}<br>${x.w}</small></div>` : '').join('')}</div>`;
  }
  function optionBody(m, o) {
    if (o.y) return `<div class="flex-o">${handsBlock(tgt(m), m.y)}<p class="sm pre">${esc(o.tx || '')}</p></div>`;
    const t = E.sum(items(o));
    return `<div class="items">${items(o).map(itemRow).join('')}</div>
      <div class="otot">Total: ${pills(t, { sm: true })}</div>
      ${o.tx ? `<p class="sm mut pre">${esc(o.tx)}</p>` : ''}`;
  }
  // Comida abierta en "Plan": la elegida, o por defecto la próxima sin marcar hoy
  function openId() {
    if (st.openId !== undefined) return st.openId;
    const L = peek(S.today()), next = meals().find(m => L.m[m.i] == null) || meals()[0];
    return next ? next.i : null;
  }
  function vPlan() {
    const P = PL(), T = P.t;
    return `${hero('Tu plan', `${n0(T.k)} kcal por día · ${meals().length} comidas`)}
      <section class="card targets">
        <div class="tg"><b>${n0(T.p)} g</b><span><i class="dot p"></i>Proteína</span></div>
        <div class="tg"><b>${n0(T.c)} g</b><span><i class="dot c"></i>Carbohidratos</span></div>
        <div class="tg"><b>${n0(T.f)} g</b><span><i class="dot f"></i>Grasas</span></div>
        <div class="tg"><b>${n0(T.fi)} g</b><span>🌾 Fibra</span></div>
        <div class="tg"><b>${n1(T.w / 1000)} L</b><span>💧 Agua</span></div>
      </section>
      <p class="sm mut center">Cada comida tiene opciones equivalentes: elegí la que quieras. Tocá un alimento para ver con qué reemplazarlo.</p>
      <details class="card measures"><summary>📏 ¿No tenés balanza? Medidas caseras</summary>
        <p class="sm mut">No hace falta pesar todo. Las primeras semanas usá estas medidas y después ya lo vas a calcular a ojo.</p>
        <div class="mlist">${NG.MEASURES.map(([e, t, x]) => `<div><span>${e}</span><p class="sm"><b>${esc(t)}:</b> ${esc(x)}</p></div>`).join('')}</div></details>
      ${meals().map(m => {
        const open = openId() === m.i;
        const sel = Math.min(st.sel[m.i] ?? Math.max(0, peek(S.today()).m[m.i] ?? 0), m.o.length - 1);
        const o = m.o[sel];
        return `<section class="card meal ${open ? 'open' : ''}" id="meal-${m.i}">
          <button class="meal-h" data-a="mtoggle" data-m="${m.i}"><span class="me">${(NG.MEAL_TYPES[m.y] || {}).e || '🍽️'}</span>
            <span class="mn"><b>${esc(m.n)}</b><small>${esc(m.h || '')}${m.g && m.g !== 'normal' ? ` · ${NG.TAGS[m.g]}` : ''} · ${(NG.CTX[m.x] || {}).e || ''} ${(NG.CTX[m.x] || {}).n || ''}</small></span>
            <span class="mk">${n0(m.t[0])}<small>kcal</small></span>${ic(open ? 'chevU' : 'chevD', 18)}</button>
          ${open ? `<div class="meal-b">
            ${pills(tgt(m), { sm: true })}
            ${m.o.length > 1 ? `<div class="seg">${m.o.map((x, i) => `<button class="${i === sel ? 'on' : ''}" data-a="opt" data-m="${m.i}" data-o="${i}">${x.y ? '🧭 ' : ''}Opción ${String.fromCharCode(65 + i)}</button>`).join('')}</div>` : ''}
            ${o ? `<h4 class="oname">${o.y ? '🧭 ' : ''}${esc(o.n)}</h4>${optionBody(m, o)}` : ''}
            ${m.no ? `<div class="note">📝 ${esc(m.no)}</div>` : ''}
            <details class="out"><summary>🧭 ¿Comés afuera? Armá tu plato con la mano</summary>${handsBlock(tgt(m), m.y)}<p class="sm pre">${esc(NG.FLEX[m.y === 'almuerzo' || m.y === 'cena' ? 'ac' : m.y === 'colacion' ? 'sn' : 'dm'])}</p></details>
          </div>` : ''}
        </section>`;
      }).join('')}
      <button class="btn ghost block" data-a="shop">🛒 Ver lista de compras de la semana</button>`;
  }

  /* AFUERA */
  function vAfuera() {
    const ms = meals(), hm = ms.find(m => m.i === st.hm) || ms.find(m => m.y === 'almuerzo') || ms[0];
    const g = PL().cl.g, plate = g === 'ganar' || g === 'rend'
      ? [['🥦', 'Verduras', 34, 'var(--ok)'], ['🍗', 'Proteína', 33, 'var(--P)'], ['🍚', 'Carbohidratos', 33, 'var(--C)']]
      : [['🥦', 'Verduras', 50, 'var(--ok)'], ['🍗', 'Proteína', 25, 'var(--P)'], ['🍚', 'Carbohidratos', 25, 'var(--C)']];
    let acc = 0;
    const stops = plate.map(([, , p, c]) => { const s = `${c} ${acc}% ${acc + p}%`; acc += p; return s; }).join(',');
    return `${hero('Comer afuera', 'Cómo seguir tu plan en cualquier lugar')}
      <section class="card">
        <h3>🖐️ El método de la mano</h3>
        <p class="sm mut">Tu mano es tu medida: siempre la llevás y es proporcional a tu cuerpo. Elegí una comida y mirá tus porciones:</p>
        <div class="chips">${ms.map(m => `<button class="chip ${m === hm ? 'on' : ''}" data-a="hm" data-m="${m.i}">${esc(m.n)}</button>`).join('')}</div>
        ${hm ? handsBlock(tgt(hm), hm.y) : ''}
        <div class="hlegend">${NG.HANDS.map(x => `<div><span>${x.e}</span><p class="sm"><b>${x.n} = ${x.w}.</b> ${esc(x.d)}</p></div>`).join('')}</div>
      </section>
      <section class="card">
        <h3>🍽️ El plato ideal</h3>
        <div class="plate-w"><div class="plate" style="background:conic-gradient(${stops})"></div>
          <div class="plate-l">${plate.map(([e, n, p, c]) => `<div><i style="background:${c}"></i>${e} ${n} <b>${p === 34 || p === 33 ? '⅓' : p === 50 ? '½' : '¼'}</b></div>`).join('')}<div><i style="background:var(--F)"></i>🫒 + 1 porción de grasa saludable</div></div></div>
      </section>
      <h3 class="sec">📍 Según dónde estés</h3>
      ${NG.PLACES.map((p, i) => `<section class="card acc ${st.place === i ? 'open' : ''}">
        <button class="acc-h" data-a="place" data-i="${i}"><span>${p.e}</span><b>${esc(p.t)}</b>${ic(st.place === i ? 'chevU' : 'chevD', 18)}</button>
        ${st.place === i ? `<div class="acc-b"><div class="good"><b>✅ Mejores elecciones</b><ul>${p.best.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div class="mod"><b>⚠️ Con moderación</b><ul>${p.mod.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          ${p.tip ? `<p class="sm tipline">💡 ${esc(p.tip)}</p>` : ''}</div>` : ''}</section>`).join('')}
      <section class="card"><h3>🏷️ Cómo leer etiquetas</h3><ul class="clean">${NG.LABELS.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="card"><h3>🍷 Alcohol</h3><ul class="clean">${NG.ALCOHOL_TIPS.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`;
  }

  /* HÁBITOS */
  const HABITS = [['veg', '🥦', 'Comí verduras en almuerzo y cena'], ['sueno', '😴', 'Dormí 7 horas o más'], ['mov', '🚶', 'Me moví / hice mis pasos']];
  function phaseCard(ph, full) {
    return `<section class="card phase"><div class="row between"><b>${ph.ph.e} Fase ${ph.idx + 1} de 3 · ${ph.ph.n}</b><span class="mut sm">${ph.idx < 2 ? `semana ${ph.inPhase} de 2` : `semana ${ph.week}`}</span></div>
      <div class="phbar">${NG.PHASES.map((_, i) => `<i class="${i < ph.idx ? 'done' : i === ph.idx ? 'on' : ''}"></i>`).join('')}</div>
      <p class="sm"><b>Tu foco:</b> ${esc(ph.ph.focus)}</p>
      <div class="row between sm mut"><span>Meta: ${ph.ph.goal}% de las comidas</span>${full ? '' : `<button class="link sm" data-a="tab" data-t="habitos">Mis hábitos de la fase ›</button>`}</div>
      ${full ? `<div class="phases">${NG.PHASES.map((x, i) => `<div class="phs ${i === ph.idx ? 'on' : ''}"><b>${x.e} ${x.n}</b><small>${x.w}</small></div>`).join('')}</div>` : ''}</section>`;
  }
  function vHabitos() {
    const P = PL(), L = peek(S.today()), ph = phase();
    return `${hero('Hábitos', ph ? `Fase ${ph.idx + 1}: ${ph.ph.n}` : 'Lo que más impacto tiene en tus resultados')}
      ${ph ? phaseCard(ph, true) : ''}
      ${P.ms ? `<section class="card coachmsg"><b>💬 Mensaje de ${esc((P.co || {}).n || 'tu entrenador')}</b><p>${esc(P.ms).replace(/\n/g, '<br>')}</p></section>` : ''}
      <section class="card"><h3>✅ Hoy</h3>
        ${habitList().map(([k, e, n]) => `<button class="hab ${L.h && L.h[k] ? 'on' : ''}" data-a="habit" data-h="${k}"><span class="tck">${L.h && L.h[k] ? ic('check', 16) : ''}</span>${e} ${n}</button>`).join('')}
        <button class="hab ${(L.w || 0) >= glasses() ? 'on' : ''}" data-a="tab" data-t="hoy"><span class="tck">${(L.w || 0) >= glasses() ? ic('check', 16) : ''}</span>💧 Tomé mi agua (${L.w || 0}/${glasses()} vasos)</button>
      </section>
      <h3 class="sec">💡 Tus recomendaciones</h3>
      ${(P.r || []).map(([e, t, x]) => `<section class="card rec"><span class="rec-e">${e}</span><div><b>${esc(t)}</b><p class="sm">${esc(x)}</p></div></section>`).join('')}
      <p class="disc">Ante cualquier duda sobre suplementos o condiciones de salud, consultá con tu médico.</p>`;
  }

  /* PROGRESO */
  function chart(ws) {
    if (ws.length < 2) return `<div class="empty sm">Registrá tu peso varios días para ver el gráfico 📉</div>`;
    const pts = ws.slice(-45), W = 320, H = 140, pad = 22;
    const ys = pts.map(p => p.kg), mn = Math.min(...ys) - 0.4, mx = Math.max(...ys) + 0.4;
    const t0 = new Date(pts[0].d).getTime(), t1 = new Date(pts[pts.length - 1].d).getTime() || t0 + 1;
    const X = d => pad + (new Date(d).getTime() - t0) / Math.max(1, t1 - t0) * (W - pad * 2);
    const Y = v => H - pad - (v - mn) / (mx - mn) * (H - pad * 2);
    const line = pts.map(p => `${X(p.d).toFixed(1)},${Y(p.kg).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Evolución del peso">
      <line x1="${pad}" x2="${W - pad}" y1="${Y(mx - 0.4)}" y2="${Y(mx - 0.4)}" class="gridl"/><line x1="${pad}" x2="${W - pad}" y1="${Y(mn + 0.4)}" y2="${Y(mn + 0.4)}" class="gridl"/>
      <text x="2" y="${Y(mx - 0.4) + 4}" class="axl">${n1(mx - 0.4)}</text><text x="2" y="${Y(mn + 0.4) + 4}" class="axl">${n1(mn + 0.4)}</text>
      <polyline points="${line}" class="cline"/>${pts.map(p => `<circle cx="${X(p.d).toFixed(1)}" cy="${Y(p.kg).toFixed(1)}" r="3" class="cdot"/>`).join('')}
      <text x="${pad}" y="${H - 4}" class="axl">${fdate(pts[0].d)}</text><text x="${W - pad}" y="${H - 4}" class="axl" text-anchor="end">${fdate(pts[pts.length - 1].d)}</text></svg>`;
  }
  function vProgreso() {
    const ws = (st.data.weights || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
    const today = S.today(), tw = ws.find(w => w.d === today), wk = weekStats(today);
    const diff = wk.avg && wk.prev ? wk.avg - wk.prev : null;
    const cells = Array.from({ length: 28 }, (_, i) => S.addDays(today, i - 27));
    return `${hero('Tu progreso', 'Lo que se mide, se mejora')}
      <section class="card">
        <h3>⚖️ Registrar peso de hoy</h3>
        <div class="row gap"><label class="fld grow"><span>Peso (kg)</span><input id="wkg" type="text" inputmode="decimal" autocomplete="off" value="${tw ? tw.kg : ''}" placeholder="Ej: 72,5"></label>
        <label class="fld grow"><span>Cintura (cm, opcional)</span><input id="wcin" type="text" inputmode="decimal" autocomplete="off" value="${tw && tw.cin ? tw.cin : ''}" placeholder="Ej: 84"></label></div>
        <button class="btn pri block" data-a="wsave">Guardar</button>
        <p class="sm mut">En ayunas, después de ir al baño. Lo importante es el promedio de la semana.</p>
      </section>
      <section class="card stats">
        <div><small>Promedio 7 días</small><b>${wk.avg ? n1(wk.avg) + ' kg' : '—'}</b></div>
        <div><small>vs semana anterior</small><b class="${diff == null ? '' : diff < 0 ? 'down' : 'up'}">${diff == null ? '—' : (diff > 0 ? '+' : '') + n1(diff) + ' kg'}</b></div>
        <div><small>Adherencia 7 días</small><b>${wk.adh == null ? '—' : wk.adh + '%'}</b></div>
      </section>
      <section class="card"><h3>📉 Evolución</h3>${chart(ws)}</section>
      <section class="card"><h3>🗓️ Últimas 4 semanas</h3>
        <div class="heat">${cells.map(d => { const n = meals().length, dn = st.data.logs[d] && Object.keys(st.data.logs[d].m || {}).length ? doneCount(d) / n : -1; return `<i title="${fdate(d)}" class="${dn < 0 ? '' : dn >= 0.9 ? 'l4' : dn >= 0.6 ? 'l3' : dn >= 0.3 ? 'l2' : 'l1'}${d === today ? ' today' : ''}"></i>`; }).join('')}</div>
        <div class="row between sm mut"><span>Menos</span><span class="heat-k"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>Más</span></div>
      </section>
      <button class="btn pri block big" data-a="checkin">📤 Enviar check-in semanal a ${esc((PL().co || {}).n || 'tu entrenador')}</button>
      ${st.data.checks.length ? `<p class="sm mut center">Último check-in enviado: ${fdate(st.data.checks[st.data.checks.length - 1].d)}</p>` : ''}
      ${ws.length ? `<section class="card"><h3>Registros</h3><div class="wlist">${ws.slice(-10).reverse().map(w => `<div class="row between"><span>${fdate(w.d)}</span><span><b>${n1(w.kg)} kg</b>${w.cin ? ` · ${n1(w.cin)} cm` : ''} <button class="ib sm" data-a="wdel" data-d="${w.d}" aria-label="Borrar">${ic('x', 14)}</button></span></div>`).join('')}</div></section>` : ''}`;
  }

  /* ── Hojas ─────────────────────────────────────────────────────── */
  function sheetCheck(mid) {
    const m = meals().find(x => x.i === mid); if (!m) return;
    U.open(`<h3>${(NG.MEAL_TYPES[m.y] || {}).e || ''} ${esc(m.n)}</h3><p class="mut sm">¿Qué comiste?</p>
      <div class="stack">${m.o.map((o, i) => `<button class="btn ghost block left" data-a="mset" data-m="${m.i}" data-o="${i}">${o.y ? '🧭' : '✅'} Opción ${String.fromCharCode(65 + i)} · ${esc(o.n)}</button>`).join('')}
      ${m.o.some(o => o.y) ? '' : `<button class="btn ghost block left" data-a="mset" data-m="${m.i}" data-o="-1">🧭 Comí afuera con el método de la mano</button>`}
      ${freePerWeek() ? (freeLeft(st.day) ? `<button class="btn ghost block left" data-a="mset" data-m="${m.i}" data-o="-3">🍕 Comida libre planificada (${leftTxt(freeLeft(st.day))} esta semana)</button>` : '<p class="sm mut center">🍕 Ya usaste tu comida libre de esta semana</p>') : ''}
      <button class="btn ghost block left" data-a="mset" data-m="${m.i}" data-o="-2">😅 Me salí del plan (¡pasa! seguimos)</button></div>`);
  }
  function sheetFree() {
    const n = freePerWeek(), left = freeLeft(st.day);
    U.open(`<h3>🍕 Tu comida libre</h3>
      <p>Tenés ${n === 1 ? '1 comida libre' : `${n} comidas libres`} por semana: <b>${left ? leftTxt(left) : 'ya la usaste'}</b> esta semana.</p>
      <ul class="clean">${NG.FREE_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="sm mut">Para usarla, tocá ✓ en la comida y elegí «Comida libre planificada». Cuenta como comida cumplida.</p>`);
  }
  function sheetSwap(fid, g) {
    const f = NG.food(fid); if (!f) return;
    const list = E.exchanges(fid, g, rules()).slice(0, 14), q = qty(f, g);
    U.open(`<h3>${f.e} ${esc(f.n)}</h3><p class="mut sm">${q.main}${q.sub ? ' · ' + q.sub : ''} — podés reemplazarlo por:</p>
      ${list.length ? `<div class="items">${list.map(x => { const ff = NG.food(x.f), qq = qty(ff, x.g); return `<div class="it static"><span class="it-e">${ff.e}</span><span class="it-n">${esc(ff.n)}<small>${n0(x.m.k)} kcal · P ${n0(x.m.p)} · C ${n0(x.m.c)} · G ${n0(x.m.f)}</small></span><span class="it-q"><b>${qq.main}</b>${qq.sub ? `<small>${qq.sub}</small>` : ''}</span></div>`; }).join('')}</div>`
        : '<div class="empty sm">No hay equivalencias para este alimento.</div>'}
      <p class="sm mut">Las equivalencias igualan el nutriente principal del grupo (proteína, carbohidratos o grasas).</p>`);
  }
  function sheetShop() {
    const W = {};
    meals().forEach(m => {
      const ex = m.o.filter(o => !o.y); if (!ex.length) return;
      ex.forEach(o => items(o).forEach(it => { W[it.f] = (W[it.f] || 0) + it.g / ex.length * 7; }));
    });
    const groups = {};
    Object.entries(W).forEach(([id, g]) => { const f = NG.food(id); if (!f || f.g === 'libre') return; (groups[f.g] = groups[f.g] || []).push([f, g]); });
    const fmtW = (f, g) => (f.uf && f.ug ? `~${Math.ceil(g / f.ug)} ${f.u}${Math.ceil(g / f.ug) > 1 ? 's' : ''}` : g >= 1000 ? `~${n1(g / 1000)} ${f.ml ? 'L' : 'kg'}` : `~${Math.ceil(g / 50) * 50} ${f.ml ? 'ml' : 'g'}`);
    const body = () => `<h3>🛒 Lista de compras semanal</h3><p class="sm mut">Estimada si rotás tus opciones durante 7 días. Ajustala a lo que realmente vas a cocinar.</p>
      ${Object.keys(NG.GRUPOS).filter(k => groups[k]).map(k => `<h4>${NG.GRUPOS[k].e} ${NG.GRUPOS[k].n}</h4>${groups[k].sort((a, b) => b[1] - a[1]).map(([f, g]) => `<button class="shop ${st.data.shop[f.id] ? 'on' : ''}" data-a="shopchk" data-f="${f.id}"><span class="tck">${st.data.shop[f.id] ? ic('check', 14) : ''}</span>${f.e} ${esc(f.n)} <b>${fmtW(f, g)}</b></button>`).join('')}`).join('') || '<div class="empty sm">Tu plan no tiene alimentos para comprar.</div>'}
      <button class="btn ghost block sm" data-a="shopclear">Desmarcar todo</button>`;
    st.shopBody = body;
    U.open(body());
  }
  // Entrenamientos planificados por semana (según el perfil que cargó el entrenador)
  const plannedTrainings = () => ((PL().pr || {}).training || []).reduce((s, t) => s + (+t.days || 0), 0);
  const photoDue = () => E.photoDue(PL().sd || PL().ph, S.today());
  // Check-in único de la semana: entrenamiento + alimentación + bienestar
  function sheetCheckin() {
    const wk = weekStats(S.today()), pr = PL().pr || {}, planned = plannedTrainings();
    st.ck = { e: 3, hu: 3, s: 3, dg: 3, fa: 3, es: 3, tr: null, tp: planned, mo: null, me: null };
    const slider = (k, n, hint) => `<label class="fld"><span>${n}: <b id="ckv-${k}">3</b>/5${hint ? ` <small class="mut">(${hint})</small>` : ''}</span><input type="range" min="1" max="5" value="3" data-live="ck" data-c="${k}"></label>`;
    const chips = (c, opts) => `<div class="chips">${opts.map(([v, n]) => `<button class="chip" data-a="ckset" data-c="${c}" data-v="${v}">${n}</button>`).join('')}</div>`;
    U.open(`<h3>📤 Check-in semanal</h3>
      <p class="sm mut">Uno solo por semana, con entrenamiento y alimentación. Te lleva 2 minutos.</p>
      <div class="ckres">
        <div><small>Peso promedio</small><b>${wk.avg ? n1(wk.avg) + ' kg' : 'sin datos'}</b></div>
        <div><small>Comidas cumplidas</small><b>${wk.adh == null ? '—' : wk.adh + '%'}</b></div>
        <div><small>Agua</small><b>${wk.water ? n1(wk.water) + ' vasos' : '—'}</b></div></div>
      <h4>🏋️ Entrenamiento</h4>
      <div class="fld"><span>¿Cuántos entrenamientos hiciste esta semana?${planned ? ` (tenías ${planned})` : ''}</span>${chips('tr', Array.from({ length: Math.max(planned, 5) + 1 }, (_, i) => [i, String(i)]))}</div>
      ${slider('fa', '😮‍💨 Fatiga', '1 fresco · 5 agotado')}${slider('es', '🧠 Estrés', '1 bajo · 5 alto')}
      <div class="fld"><span>🤕 ¿Sentiste alguna molestia o dolor?</span>${chips('mo', [[0, 'No'], [1, 'Sí']])}</div>
      <label class="fld" id="ck-md-wrap" style="display:none"><span>¿Dónde y en qué ejercicio?</span><input id="ck-md" placeholder="Ej: hombro derecho en press banca"></label>
      <label class="fld"><span>💪 ¿Algún ejercicio te resultó muy fácil o muy difícil? <small class="mut">(opcional)</small></span><input id="ck-ej" placeholder="Ej: la sentadilla se sintió liviana"></label>
      <h4>🍽️ Alimentación y bienestar</h4>
      ${slider('e', '⚡ Energía')}${slider('hu', '😋 Hambre', '1 poca · 5 mucha')}${slider('s', '😴 Descanso')}${slider('dg', '🌿 Digestión')}
      ${pr.sex === 'F' ? `<div class="fld"><span>🩸 ¿Estuviste en la semana previa o durante la menstruación?</span>${chips('me', [[0, 'No'], [1, 'Sí']])}</div>` : ''}
      <label class="fld"><span>💬 ¿Algo más que quieras contarme?</span><textarea id="ck-no" rows="2" placeholder="Cómo te sentiste, qué te costó, dudas…"></textarea></label>
      ${photoDue() ? `<div class="card tipc"><b>📸 Esta semana tocan tus fotos</b><p class="sm">De frente, de costado y de espalda, con la misma luz, lugar y ropa que la vez anterior. Cuando termines este check-in, subilas a tu carpeta de Drive, en «03 Fotos de Progreso».</p></div>` : ''}
      ${!wk.avg ? '<p class="sm warnline">Tip: registrá tu peso en Progreso para que el check-in sea más útil.</p>' : ''}
      <div class="stack">${(PL().co || {}).w ? `<button class="btn wa block" data-a="ck-send">${ic('chat')} Enviar por WhatsApp</button>` : ''}
      <button class="btn ${(PL().co || {}).w ? 'ghost' : 'pri'} block" data-a="ck-copy">${ic('copy')} Copiar mensaje</button></div>`);
  }
  async function checkinText() {
    const P = PL(), wk = weekStats(S.today()), c = st.ck;
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    c.no = val('ck-no'); c.md = c.mo ? val('ck-md') : ''; c.ej = val('ck-ej');
    const ws = (st.data.weights || []).filter(w => w.d >= S.addDays(S.today(), -20)).map(w => [w.d, w.kg]);
    const ph = phase(), ft = photoDue();
    const code = await S.pack({
      v: 1, id: P.id, ver: P.ver, d: S.today(), avg: wk.avg ? Math.round(wk.avg * 10) / 10 : null, prev: wk.prev ? Math.round(wk.prev * 10) / 10 : null,
      adh: wk.adh, done: wk.done, tot: wk.tot, lib: wk.lib, ph: ph ? ph.idx + 1 : null, w: wk.water ? Math.round(wk.water * 10) / 10 : null, hab: wk.habits, cin: wk.cin,
      e: c.e, hu: c.hu, s: c.s, dg: c.dg, tr: c.tr, tp: c.tp, fa: c.fa, es: c.es, mo: c.mo, md: c.md.slice(0, 200), ej: c.ej.slice(0, 200), me: c.me, ft: ft ? 1 : 0,
      no: c.no.slice(0, 600), ws,
    });
    const diff = wk.avg && wk.prev ? wk.avg - wk.prev : null;
    const lines = [
      `📋 *Check-in semanal* – ${P.cl.n || ''}`,
      `📅 ${fdate(wk.from)} al ${fdate(wk.to)}`,
      ph ? `🚦 Fase ${ph.idx + 1} · ${ph.ph.n} (semana ${ph.week})` : null,
      `⚖️ Peso promedio: ${wk.avg ? n1(wk.avg) + ' kg' : 'sin registrar'}${diff != null ? ` (${diff > 0 ? '+' : ''}${n1(diff)} kg vs semana anterior)` : ''}`,
      wk.cin ? `📏 Cintura: ${n1(wk.cin)} cm` : null,
      '', '*Entrenamiento*',
      `🏋️ Entrenamientos: ${c.tr == null ? 'sin registrar' : c.tr + (c.tp ? ` de ${c.tp}` : '')}`,
      `😮‍💨 Fatiga ${c.fa}/5 · 🧠 Estrés ${c.es}/5`,
      `🤕 Molestias: ${c.mo == null ? 'sin responder' : c.mo ? `Sí — ${c.md || 'sin detalle'}` : 'No'}`,
      c.ej ? `💪 ${c.ej}` : null,
      '', '*Alimentación*',
      `✅ Comidas cumplidas: ${wk.adh == null ? 'sin registrar' : `${wk.adh}% (${wk.done}/${wk.tot})`}`,
      freePerWeek() ? `🍕 Comidas libres: ${wk.lib} de ${freePerWeek()}` : null,
      `💧 Agua: ${wk.water ? n1(wk.water) + ' vasos/día' : 'sin registrar'}`,
      `⚡ Energía ${c.e}/5 · 😋 Hambre ${c.hu}/5 · 😴 Descanso ${c.s}/5 · 🌿 Digestión ${c.dg}/5`,
      c.me === 1 ? '🩸 Semana premenstrual o menstrual' : null,
      ft ? '📸 Esta semana tocan fotos: las subo a mi carpeta de Drive' : null,
      c.no ? `💬 ${c.no}` : null,
      '', 'Código para el panel (no lo borres):', `#CHK:${code}`,
    ];
    return lines.filter(l => l !== null).join('\n');
  }
  function sheetSettings() {
    const th = st.data.ui.theme || 'auto';
    U.open(`<h3>⚙️ Ajustes</h3>
      <label class="fld"><span>Apariencia</span></label>
      <div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Oscuro']].map(([k, n]) => `<button class="${th === k ? 'on' : ''}" data-a="theme" data-v="${k}">${n}</button>`).join('')}</div>
      <h4>📥 ¿Te mandaron un plan nuevo?</h4>
      <p class="sm mut">Si tenés la app instalada, pegá acá el link nuevo. Tus registros se mantienen.</p>
      <textarea id="s-code" rows="2" placeholder="Pegá el link del plan"></textarea>
      <button class="btn pri block" data-a="s-import">Actualizar plan</button>
      <h4>📲 Instalar en el celular</h4>
      <p class="sm"><b>Android (Chrome):</b> menú ⋮ → «Instalar app» o «Agregar a pantalla principal».<br><b>iPhone (Safari):</b> botón Compartir ⬆️ → «Agregar a inicio».</p>
      <h4>💾 Tus datos</h4>
      <p class="sm mut">Tus registros se guardan solo en este dispositivo. Podés hacer una copia por las dudas.</p>
      <div class="row gap wrapr"><button class="btn ghost sm" data-a="s-export">${ic('dl', 15)} Guardar copia</button><button class="btn ghost sm" data-a="s-restore">${ic('up', 15)} Restaurar copia</button><button class="btn ghost sm danger-t" data-a="s-reset">${ic('trash', 15)} Borrar todo</button></div>
      <p class="sm mut center">Plan versión ${PL().ver || 1} · ${esc((PL().co || {}).b || '')}</p>`);
  }

  /* ── Eventos ───────────────────────────────────────────────────── */
  async function click(a, el) {
    const ds = el.dataset;
    switch (a) {
      case 'tab': st.tab = ds.t; window.scrollTo(0, 0); return render();
      case 'day': { const nd = S.addDays(st.day, +ds.d); if (nd <= S.today()) st.day = nd; return render(); }
      case 'mcheck': {
        const L = log(st.day);
        if (L.m[ds.m] != null) { delete L.m[ds.m]; save(); return render(); }
        return sheetCheck(ds.m);
      }
      case 'mset': {
        const L = log(st.day); L.m[ds.m] = +ds.o; save(); U.close();
        if (+ds.o === -3) U.toast('🍕 ¡Disfrutala! Volvé al plan en la comida siguiente');
        else if (doneCount(st.day) === meals().length) U.toast('🎉 ¡Día completo! Excelente trabajo');
        return render();
      }
      case 'free': return sheetFree();
      case 'ckset': {
        st.ck[ds.c] = +ds.v;
        el.parentElement.querySelectorAll('.chip').forEach(b => b.classList.toggle('on', b === el));
        if (ds.c === 'mo') { const w = document.getElementById('ck-md-wrap'); if (w) w.style.display = +ds.v ? '' : 'none'; }
        return;
      }
      case 'mopen': st.tab = 'plan'; st.openId = ds.m; render(); setTimeout(() => { const e = document.getElementById('meal-' + ds.m); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); return;
      case 'mtoggle': st.openId = openId() === ds.m ? null : ds.m; return render();
      case 'opt': st.sel[ds.m] = +ds.o; return render();
      case 'swap': return sheetSwap(ds.f, +ds.g);
      case 'water': { const L = log(st.day); L.w = Math.max(0, Math.min(30, (L.w || 0) + +ds.d)); save(); if (+ds.d > 0 && L.w === glasses()) U.toast('💧 ¡Meta de agua cumplida!'); return render(); }
      case 'wset': { const L = log(st.day); L.w = +ds.n; save(); return render(); }
      case 'habit': { const L = log(S.today()); L.h = L.h || {}; L.h[ds.h] = !L.h[ds.h]; save(); return render(); }
      case 'hm': st.hm = ds.m; return render();
      case 'place': st.place = st.place === +ds.i ? -1 : +ds.i; return render();
      case 'wsave': {
        const kg = parseFloat(String(document.getElementById('wkg').value).replace(',', '.'));
        const cin = parseFloat(String(document.getElementById('wcin').value).replace(',', '.'));
        if (!(kg > 20 && kg < 350)) return U.toast('Ingresá un peso válido');
        const d = S.today(), ws = st.data.weights.filter(w => w.d !== d);
        ws.push({ d, kg: Math.round(kg * 10) / 10, ...(cin > 30 && cin < 250 ? { cin: Math.round(cin * 2) / 2 } : {}) });
        st.data.weights = ws.sort((x, y) => (x.d < y.d ? -1 : 1)); save(); U.toast('✅ Peso guardado'); return render();
      }
      case 'wdel': st.data.weights = st.data.weights.filter(w => w.d !== ds.d); save(); return render();
      case 'checkin': return sheetCheckin();
      case 'ck-send': case 'ck-copy': {
        const txt = await checkinText();
        if (!st.preview) { st.data.checks.push({ d: S.today() }); save(); }
        if (a === 'ck-send') U.wa((PL().co || {}).w, txt); else U.copy(txt);
        U.close(); return render();
      }
      case 'shop': return sheetShop();
      case 'shopchk': st.data.shop[ds.f] = !st.data.shop[ds.f]; save(); return U.update(st.shopBody());
      case 'shopclear': st.data.shop = {}; save(); return U.update(st.shopBody());
      case 'settings': return sheetSettings();
      case 'theme': st.data.ui.theme = ds.v === 'auto' ? '' : ds.v; U.theme(st.data.ui.theme); save(); U.close(); return sheetSettings();
      case 's-import': {
        const v = (document.getElementById('s-code').value || '').trim(), m = v.match(/#p=([\w-]+)/);
        if (!m) return U.toast('Pegá el link completo del plan');
        if (st.preview) return U.toast('En la vista previa no se importan planes');
        if (await importCode(m[1])) { U.closeAll(); mount(); }
        return;
      }
      case 's-export': return S.saveFile(`mis-registros-${S.today()}.json`, JSON.stringify(st.data));
      case 's-restore': {
        const txt = await S.pickFile(); if (!txt) return;
        try { const d = JSON.parse(txt); if (!d.plan || !d.plan.m) throw 0; S.saveAlumno(d); U.closeAll(); U.toast('✅ Datos restaurados'); mount(); } catch (e) { U.toast('⚠️ El archivo no es una copia válida'); }
        return;
      }
      case 's-reset': {
        if (st.preview) return;
        if (await U.confirm('Se borran tu plan y tus registros de este dispositivo. Vas a poder volver a cargar el plan con el link de tu entrenador.', { yes: 'Borrar todo', danger: true })) { S.clearAlumno(); U.closeAll(); location.hash = ''; welcome(); }
        return;
      }
      case 'install': if (NG.installEvt) { NG.installEvt.prompt(); NG.installEvt = null; render(); } return;
      case 'iosx': st.data.ui.iosTip = 1; save(); return render();
      case 'exitpv': if (st.onExit) st.onExit(); return;
    }
  }
  function input(el) {
    if (el.dataset.live === 'ck') { st.ck[el.dataset.c] = +el.value; const o = document.getElementById('ckv-' + el.dataset.c); if (o) o.textContent = el.value; }
  }
  function change() {}

  NG.Client = { mount, fromHash, importCode, render: () => render() };
})(window.NG);
