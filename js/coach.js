/* Panel del entrenador: alumnos, perfil, cálculo, editor de planes, consejos, envío y progreso. */
(function (NG) {
  const U = NG.UI, S = NG.S, E = NG.E;
  const { esc, n0, n1, ic, pills, qty, fdate } = U;
  let D = null, root = null;
  const cs = { route: [], tab: 'perfil', q: '', optSel: {}, pick: null, link: null };
  const later = fn => setTimeout(fn, 0);

  /* ── Datos ─────────────────────────────────────────────────────── */
  function save() { NG.extraFoods = D.customFoods || {}; S.saveCoach(D); dashSync(); }
  const first = n => String(n || '').trim().split(/\s+/)[0] || '';
  const allergensOf = p => (p.allergens || []).concat((p.medical || []).includes('celiaquia') && !(p.allergens || []).includes('g') ? ['g'] : []);
  function blankProfile() {
    return {
      name: '', phone: '', sex: 'M', age: 30, height: 170, weight: 70, bf: '', waist: '', goal: 'perder', rate: 'moderado', targetWeight: '', motivation: '',
      activity: 'sed', training: [{ type: 'fuerza', days: 3, min: 60 }], trainTime: 'tarde', meals: E.defaultMeals(4),
      cooking: 'cocina', tupper: true, micro: true, diet: 3, allergens: [], exclude: [], dislikes: '', likes: '', budget: 'medio', alcohol: 'ocasional', supplements: '',
      medical: [], medicalText: '', sleep: 7, stress: 3, notes: '',
      planType: 'online', experience: '', equipment: '', injuries: '', lifts: '', goal2: '', occupation: '', instagram: '', drive: '',
    };
  }
  function newClient(profile) {
    return {
      id: E.uid(), createdAt: Date.now(), updatedAt: Date.now(), profile: Object.assign(blankProfile(), profile || {}), calc: {},
      plan: { version: 0, sentVersion: 0, dirty: true, meals: [], recState: {}, customRecs: [], msg: '', phases: true, start: '', free: 1 }, checkins: [],
    };
  }
  // Alumno de ejemplo: caso típico de quien come afuera y casi no cocina, con 3 semanas de seguimiento simulado
  function loadDemo() {
    const meals = E.defaultMeals(4);
    const ctx = { desayuno: 'casa', almuerzo: 'afuera', merienda: 'trabajo', cena: 'casa' };
    const times = { desayuno: '07:00', almuerzo: '13:30', merienda: '17:30', cena: '21:30' };
    meals.forEach(m => { m.ctx = ctx[m.type]; m.time = times[m.type]; });
    const cl = newClient({
      name: 'Martín Gómez (ejemplo)', phone: '', sex: 'M', age: 28, height: 176, weight: 82.4, waist: 91,
      goal: 'perder', rate: 'moderado', targetWeight: 76, motivation: 'Bajar la panza y tener más energía en el trabajo',
      activity: 'lig', training: [{ type: 'fuerza', days: 4, min: 60 }], trainTime: 'manana', meals,
      cooking: 'basico', tupper: false, micro: true, diet: 3, allergens: [], exclude: NG.DISLIKES['Pescado'].slice(),
      dislikes: 'Pescado', likes: 'Milanesas, pastas, asado', budget: 'medio', alcohol: 'semanal', supplements: 'Ninguno',
      medical: [], medicalText: '', sleep: 6, stress: 3,
      notes: 'Vendedor: almuerza en la calle y merienda en la oficina. Entrena 8 h antes de trabajar.',
    });
    cl.demo = 1;
    cl.plan.meals = E.genPlan(cl, 'demo');
    cl.plan.msg = '¡Bienvenido Martín! Esta semana el foco es uno solo: proteína en cada comida y 8 vasos de agua. El resto, de a poco 💪';
    const d = n => S.addDays(S.today(), -n);
    Object.assign(cl.plan, { version: 1, sentVersion: 1, dirty: false, sentAt: Date.now() - 21 * 864e5, phases: true, start: d(21), free: 1 });
    cl.checkins = [
      { date: d(14), avg: 81.9, prev: 82.4, adh: 78, done: 22, tot: 28, lib: 1, w: 6.1, cin: 90, e: 3, hu: 4, s: 3, dg: 4, tr: 3, tp: 4, fa: 3, es: 3, mo: 0, no: 'Me costó el almuerzo en la calle los primeros días.' },
      { date: d(7), avg: 81.4, prev: 81.9, adh: 86, done: 24, tot: 28, lib: 1, w: 7.4, cin: 89, e: 4, hu: 3, s: 3, dg: 4, tr: 4, tp: 4, fa: 3, es: 2, mo: 0, ej: 'La sentadilla se sintió liviana', no: 'Con el método de la mano me resulta más fácil comer afuera.' },
      { date: d(0), avg: 81.0, prev: 81.4, adh: 89, done: 25, tot: 28, lib: 1, w: 7.9, cin: 88.5, e: 4, hu: 3, s: 4, dg: 5, tr: 4, tp: 4, fa: 4, es: 3, mo: 1, md: 'Hombro derecho en press banca', no: 'Bien! Usé la comida libre en un asado y elegí colita de cuadril con ensalada.' },
    ];
    D.clients[cl.id] = cl; save();
    return cl;
  }
  const cur = () => D.clients[cs.route[2]];
  function recalc(cl) { if (cl.plan.meals.length) E.distribute(cl.plan.meals, E.targets(cl)); }
  function touch(cl) { cl.updatedAt = Date.now(); cl.plan.dirty = true; save(); }
  function refitAll(cl) {
    recalc(cl);
    cl.plan.meals.forEach(m => m.options.forEach(o => { if (o.type !== 'flex' && o.items.length) o.items = E.fit(o.items, m.target); }));
  }
  function setPath(o, path, v) { const k = path.split('.'); let x = o; for (let i = 0; i < k.length - 1; i++) x = x[k[i]]; x[k[k.length - 1]] = v; }
  const getPath = (o, path) => path.split('.').reduce((x, k) => (x == null ? undefined : x[k]), o);
  function status(cl) {
    if (!cl.plan.meals.length) return ['gray', 'Sin plan'];
    if (cl.plan.dirty || !cl.plan.sentVersion) return ['warn', cl.plan.sentVersion ? 'Cambios sin enviar' : 'Plan sin enviar'];
    return ['ok', `Enviado v${cl.plan.sentVersion}`];
  }
  const dcls = (v, t) => { const d = t ? Math.abs(v - t) / t : 0; return d <= 0.08 ? 'ok' : d <= 0.15 ? 'warn' : 'bad'; };
  const medAlert = cl => E.warnings(cl, E.targets(cl)).some(w => w.lv === 'bad');

  /* ── Link del plan ─────────────────────────────────────────────── */
  // Datos que viajan en el link. Para que sea corto: solo viajan los alimentos propios (los de la base ya
  // están en la app) y las recomendaciones se recalculan en el celular del alumno a partir del perfil.
  function payload(cl) {
    const T = E.targets(cl), P = cl.plan, s = D.settings, used = new Set(), fd = {};
    P.meals.forEach(m => m.options.forEach(o => (o.items || []).forEach(it => used.add(it.f))));
    used.forEach(id => { const f = NG.food(id); if (f && !NG.FOODS[id]) fd[id] = NG.packFood(f); });
    const pr = Object.assign({}, cl.profile); delete pr.notes; delete pr.meals;
    return {
      v: 1, id: cl.id, ver: P.version || 1, ts: Date.now(),
      co: { n: s.name, b: s.brand, w: U.phone(s.whatsapp) },
      cl: { n: first(cl.profile.name), g: cl.profile.goal, d: +cl.profile.diet, al: allergensOf(cl.profile), ex: cl.profile.exclude || [] },
      t: { k: T.kcal, p: T.p, c: T.c, f: T.f, fi: T.fi, w: T.water, wt: T.waterTrain },
      m: P.meals.map(m => ({
        i: m.id, n: m.name, y: m.type, h: m.time, p: m.pct, g: m.tag, x: m.ctx, no: m.note || '',
        t: [m.target.k, m.target.p, m.target.c, m.target.f],
        o: m.options.map(o => ({ n: o.name, y: o.type === 'flex' ? 1 : 0, it: o.type === 'flex' ? [] : (o.items || []).map(it => [it.f, it.g]), tx: o.text || '' })),
      })),
      ms: P.msg || '', fd, pr, ca: cl.calc || {}, rs: P.recState || {}, cr: P.customRecs || [],
      ph: P.phases === false ? '' : (P.start || ''), fr: P.free ?? 1, sd: P.start || '',
    };
  }
  function clientFromPayload(pl) {
    const cl = newClient(pl.pr || { name: pl.cl && pl.cl.n });
    cl.id = pl.id; cl.calc = pl.ca || {};
    cl.plan.meals = (pl.m || []).map(m => ({
      id: m.i, name: m.n, type: m.y, time: m.h, pct: m.p || 20, tag: m.g || 'normal', ctx: m.x || 'casa', note: m.no || '',
      target: { k: m.t[0], p: m.t[1], c: m.t[2], f: m.t[3] },
      options: (m.o || []).map(o => ({ id: E.uid(), name: o.n, type: o.y ? 'flex' : 'exact', items: (o.it || []).map(([f, g]) => ({ f, g })), text: o.tx || '' })),
    }));
    Object.assign(cl.plan, { version: pl.ver || 1, sentVersion: pl.ver || 1, dirty: false, msg: pl.ms || '', recState: pl.rs || {}, customRecs: pl.cr || [], phases: !!pl.ph, start: pl.sd || pl.ph || '', free: pl.fr ?? 1 });
    cl.profile.meals = cl.plan.meals.map(m => ({ id: m.id, type: m.type, name: m.name, time: m.time, pct: m.pct, ctx: m.ctx }));
    Object.entries(pl.fd || {}).forEach(([id, a]) => { if (/^u_/.test(id) && !D.customFoods[id]) D.customFoods[id] = NG.unpackFood(id, a); });
    return cl;
  }
  async function makeLink(cl) {
    const P = cl.plan;
    if (P.dirty || !P.version) { P.version = (P.version || 0) + 1; P.dirty = false; }
    if (!P.start) P.start = S.today(); // fases y fotos se cuentan desde el día que le mandás el primer link
    P.sentVersion = P.version; P.sentAt = Date.now();
    save();
    return S.baseUrl(D.settings) + '#p=' + (await S.pack(payload(cl)));
  }
  async function formLink() {
    const s = D.settings;
    return S.baseUrl(s) + '#form=' + (await S.pack({ n: s.name, b: s.brand, w: U.phone(s.whatsapp) }));
  }

  /* ── Montaje y acceso ──────────────────────────────────────────── */
  function mount(parts) {
    root = document.getElementById('app');
    D = S.coach();
    cs.route = parts;
    NG.handlers = { click, change, input };
    document.title = 'Panel del entrenador';
    U.theme('');
    if (!D) return vSetup();
    D.customFoods = D.customFoods || {}; D.clients = D.clients || {};
    NG.extraFoods = D.customFoods;
    if (D.settings.pin && sessionStorage.getItem('ng_unlock') !== D.settings.pin) return vLock();
    S.persist();
    if (parts[1] === 'pv' && D.clients[parts[2]]) {
      const pc = D.clients[parts[2]];
      return NG.Client.mount({ preview: true, demo: !!pc.demo, plan: payload(pc), onExit: () => { location.hash = '#coach/c/' + parts[2] + '/enviar'; } });
    }
    if (parts[1] === 'c' && !D.clients[parts[2]]) { location.hash = '#coach'; return; }
    if (parts[1] === 'c' && parts[3]) cs.tab = parts[3];
    render();
  }
  function vSetup() {
    NG.handlers = {
      click: async a => {
        if (a !== 'setup') return;
        const v = id => (document.getElementById(id).value || '').trim();
        const pin = v('su-pin'), pin2 = v('su-pin2');
        if (!v('su-name')) return U.toast('Poné tu nombre');
        if (pin && !/^\d{4,8}$/.test(pin)) return U.toast('El PIN debe tener de 4 a 8 números');
        if (pin !== pin2) return U.toast('Los PIN no coinciden');
        const hp = pin ? await S.sha(pin) : '';
        D = { v: 1, settings: { name: v('su-name'), brand: v('su-brand') || v('su-name'), whatsapp: U.phone(v('su-wa')), pin: hp, appUrl: '' }, clients: {}, customFoods: {}, lastBackup: 0 };
        S.saveCoach(D); if (hp) sessionStorage.setItem('ng_unlock', hp);
        U.toast('🎉 ¡Panel listo!'); mount(['coach']);
      },
    };
    root.innerHTML = `<div class="wrap narrow"><div class="center"><div class="logo-big">🥗</div><h1>Configurá tu panel</h1>
      <p class="mut">Esto se hace una sola vez. Tus datos quedan guardados en este dispositivo.</p></div>
      <div class="card">
        <label class="fld"><span>Tu nombre *</span><input id="su-name" value="Valentino Ruggeri"></label>
        <label class="fld"><span>Nombre de tu marca</span><input id="su-brand" value="Ruggeri Coaching"></label>
        <label class="fld"><span>Tu WhatsApp</span><input id="su-wa" inputmode="tel" placeholder="Ej: 5491122334455"><small class="mut">Formato internacional (54 9 + código de área + número). Ahí te llegan los formularios y check-ins de tus alumnos.</small></label>
        <div class="grid2"><label class="fld"><span>PIN de acceso (4 a 8 números)</span><input id="su-pin" type="password" inputmode="numeric" placeholder="Recomendado"></label>
        <label class="fld"><span>Repetí el PIN</span><input id="su-pin2" type="password" inputmode="numeric"></label></div>
        <button class="btn pri block big" data-a="setup">Crear mi panel</button>
      </div></div>`;
  }
  function vLock() {
    NG.handlers = {
      click: async a => {
        if (a !== 'unlock') return;
        const h = await S.sha(document.getElementById('lk-pin').value.trim());
        if (h === D.settings.pin) { sessionStorage.setItem('ng_unlock', h); mount(cs.route); } else U.toast('PIN incorrecto');
      },
    };
    root.innerHTML = `<div class="wrap narrow center"><div class="logo-big">🔒</div><h1>${esc(D.settings.brand || 'Panel')}</h1>
      <div class="card"><label class="fld"><span>PIN</span><input id="lk-pin" type="password" inputmode="numeric" autofocus></label>
      <button class="btn pri block" data-a="unlock">Entrar</button></div>
      <p class="sm mut">¿Te olvidaste el PIN? Restaurá un respaldo desde otro dispositivo o borrá los datos del navegador.</p></div>`;
    const i = document.getElementById('lk-pin'); i.focus();
    i.addEventListener('keydown', e => { if (e.key === 'Enter') NG.handlers.click('unlock'); });
  }

  /* ── Render ────────────────────────────────────────────────────── */
  function render() {
    dashSync();
    const r = cs.route[1];
    const html = r === 'c' ? vClient() : r === 'ajustes' ? vSettings() : vDash();
    U.paint(root, `<div class="wrap coach">${html}</div>`);
  }

  function backupBanner() {
    const n = Object.keys(D.clients).length, days = D.lastBackup ? (Date.now() - D.lastBackup) / 864e5 : Infinity;
    if (!n || days < 7) return '';
    return `<div class="banner warn"><span>💾 ${D.lastBackup ? `Tu último respaldo fue hace ${Math.floor(days)} días.` : 'Todavía no hiciste ningún respaldo.'} Descargalo y guardalo en Drive → 01_COACHING → 04_RESPALDOS APP.</span><button class="btn sm pri" data-a="backup">Respaldar ahora</button></div>`;
  }
  const driveBtn = (url, label = '📁 Drive') => (/^https:\/\//i.test(url || '') ? `<a class="btn ghost sm" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : '');
  const lastCheckin = c => (c.checkins || []).reduce((m, x) => (!m || x.date > m.date ? x : m), null);
  // Tablero "Esta semana": todo lo pendiente en un solo lugar, para no tener que acordarse de nada
  // Lo pendiente de la semana (lo usan el tablero y el dashboard)
  const recentCheckin = c => { const l = lastCheckin(c); return l && l.date >= S.addDays(S.today(), -6) ? l : null; };
  function pendings() {
    const all = Object.values(D.clients), active = all.filter(c => c.plan.sentVersion);
    return {
      missing: active.filter(c => (E.weekOf(c.plan.start) || 0) > 1 && !recentCheckin(c)),
      pain: active.filter(c => (recentCheckin(c) || {}).mo === 1),
      photos: active.filter(c => E.photoDue(c.plan.start)),
      unsent: all.filter(c => c.plan.meals.length && (c.plan.dirty || !c.plan.sentVersion)),
      feedback: active.filter(c => (lastCheckin(c) || {}).date >= S.addDays(S.today(), -2)),
    };
  }
  // Manda los pendientes al dashboard de esta PC (si está activado en Ajustes). Si no responde, no pasa nada.
  let dashTimer, dashState = '';
  function dashSync() {
    if (!D.settings.dashSync) return;
    clearTimeout(dashTimer);
    dashTimer = setTimeout(() => {
      const P = pendings(), real = c => !c.demo, item = (c, detail) => ({ id: c.id, name: c.profile.name || 'Sin nombre', url: c.profile.drive || '', detail: detail || '' });
      const body = { panelUrl: location.href.replace(/#.*$/, '') + '#coach', backupDays: D.lastBackup ? Math.floor((Date.now() - D.lastBackup) / 864e5) : null,
        clients: Object.values(D.clients).filter(c => real(c) && c.plan.sentVersion).map(c => item(c)) };
      for (const k in P) body[k] = P[k].filter(real).map(c => item(c, k === 'pain' ? recentCheckin(c).md : ''));
      fetch('http://127.0.0.1:3000/api/coaching/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(r => r.ok ? '✅ Conectado · último envío ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '⚠️ El dashboard respondió con un error')
        .catch(() => '⚠️ No se encontró el dashboard en esta PC (¿está prendido?)')
        .then(txt => { dashState = txt; const el = document.getElementById('dash-st'); if (el) el.textContent = txt; }); // sin render(): volvería a enviar
    }, 1500);
  }
  function weekBoard() {
    const today = S.today(), P = pendings(), recent = recentCheckin;
    const blocks = [
      ['📋', 'Check-ins que faltan', P.missing, c => `<button class="btn wa sm" data-a="remind" data-id="${c.id}">Recordar</button>`],
      ['🤕', 'Reportaron molestias', P.pain, c => `<span class="sm mut">${esc(recent(c).md || '')}</span>`],
      ['📸', 'Tocan fotos esta semana', P.photos, c => driveBtn(c.profile.drive) || '<span class="sm mut">cargá su carpeta de Drive</span>'],
      ['📤', 'Planes con cambios sin enviar', P.unsent, c => `<button class="btn ghost sm" data-a="go" data-h="#coach/c/${c.id}/enviar">Enviar</button>`],
    ].filter(b => b[2].length);
    if (!Object.keys(D.clients).length) return '';
    return `<section class="card wboard"><div class="row between"><h3>🗓️ Esta semana</h3><span class="sm mut">${fdate(today, true)}</span></div>
      ${blocks.length ? blocks.map(([e, t, arr, act]) => `<div class="wbsec"><b>${e} ${t} (${arr.length})</b>${arr.map(c => `<div class="wbrow"><button class="link" data-a="open" data-id="${c.id}">${esc(c.profile.name || 'Sin nombre')}</button>${act(c)}</div>`).join('')}</div>`).join('')
        : '<p class="sm">✅ Todo al día: no hay nada pendiente.</p>'}
    </section>`;
  }
  function vDash() {
    const list = Object.values(D.clients).sort((a, b) => b.updatedAt - a.updatedAt)
      .filter(c => !cs.q || c.profile.name.toLowerCase().includes(cs.q.toLowerCase()));
    const local = location.protocol === 'file:' && !D.settings.appUrl;
    return `<header class="chead"><div><span class="brand">${esc(D.settings.brand)}</span><h1>Panel del entrenador</h1></div>
        <div class="row gap-s">${driveBtn(D.settings.driveUrl, '📁')}<button class="ib" data-a="go" data-h="#coach/ajustes" aria-label="Ajustes">${ic('gear', 20)}</button><button class="ib" data-a="lock" aria-label="Bloquear">${ic('lock', 20)}</button></div></header>
      ${backupBanner()}
      ${weekBoard()}
      ${local ? `<div class="banner info"><span>🌐 Estás usando la app desde un archivo de tu PC. Para que los links funcionen en el celular de tus alumnos, publicala gratis (ver LEEME) y cargá la dirección en <b>Ajustes</b>.</span></div>` : ''}
      <div class="qa">
        <button class="qab" data-a="newc"><span>➕</span><b>Nuevo alumno</b><small>Cargar datos a mano</small></button>
        <button class="qab" data-a="paste"><span>📥</span><b>Pegar mensaje</b><small>Formulario, check-in o link</small></button>
        <button class="qab" data-a="formlink"><span>📝</span><b>Link del formulario</b><small>Para alumnos nuevos</small></button>
      </div>
      <div class="row between"><h2>Alumnos <span class="mut">(${Object.keys(D.clients).length})</span></h2>
        <input class="search" type="search" placeholder="Buscar…" value="${esc(cs.q)}" data-live="q" data-k="q"></div>
      ${list.length ? `<div class="cgrid">${list.map(c => {
        const T = E.targets(c), [sc, stx] = status(c), g = NG.GOALS[c.profile.goal] || {}, lc = (c.checkins || []).slice(-1)[0];
        return `<button class="ccard" data-a="open" data-id="${c.id}">
          <div class="row between"><b>${esc(c.profile.name || 'Sin nombre')}</b><span class="badge ${sc}">${stx}</span></div>
          <div class="sm mut">${g.e || ''} ${g.n || ''} · ${n1(c.profile.weight)} kg</div>
          <div class="sm">${n0(T.kcal)} kcal · P ${T.p} · C ${T.c} · G ${T.f}</div>
          <div class="sm mut">${lc ? `Último check-in: ${fdate(lc.date)}${lc.avg ? ` · ${n1(lc.avg)} kg` : ''}` : 'Sin check-ins todavía'}</div>
          ${medAlert(c) ? '<div class="sm bad-t">⚠️ Revisar alertas de salud</div>' : ''}</button>`;
      }).join('')}</div>` : `<div class="empty">${cs.q ? 'Sin resultados.' : '👋 Todavía no tenés alumnos.<br>Enviá el <b>link del formulario</b> a tu primer asesorado o creá uno a mano.'}</div>`}
      ${!cs.q && !Object.values(D.clients).some(c => c.demo) ? `<div class="center"><button class="btn ghost sm" data-a="demo">🧪 Cargar un alumno de ejemplo para explorar la app</button></div>` : ''}`;
  }

  /* ── Ficha del alumno ──────────────────────────────────────────── */
  const TABS = [['perfil', '👤', 'Perfil'], ['objetivos', '🎯', 'Objetivos'], ['plan', '🍽️', 'Plan'], ['consejos', '💡', 'Consejos'], ['enviar', '📤', 'Enviar'], ['progreso', '📈', 'Progreso']];
  function vClient() {
    const cl = cur(), [sc, stx] = status(cl), g = NG.GOALS[cl.profile.goal] || {};
    const body = { perfil: tPerfil, objetivos: tObjetivos, plan: tPlan, consejos: tConsejos, enviar: tEnviar, progreso: tProgreso }[cs.tab] || tPerfil;
    return `<header class="chead"><button class="ib" data-a="go" data-h="#coach" aria-label="Volver">${ic('chevL', 22)}</button>
        <div class="grow"><h1>${esc(cl.profile.name || 'Nuevo alumno')}</h1><span class="sm mut">${g.e || ''} ${g.n || ''} · <span class="badge ${sc}">${stx}</span></span></div>
        <div class="row gap-s">${driveBtn(cl.profile.drive)}<button class="btn ghost sm hide-m" data-a="preview">${ic('eye', 16)} Ver como alumno</button><button class="btn pri sm" data-a="tab" data-t="enviar">${ic('send', 16)} Enviar</button></div></header>
      <nav class="ctabs">${TABS.map(([k, e, n]) => `<button class="${cs.tab === k ? 'on' : ''}" data-a="tab" data-t="${k}">${e} ${n}</button>`).join('')}</nav>
      ${warnBox(cl, cs.tab === 'perfil' || cs.tab === 'objetivos')}
      ${body(cl)}`;
  }
  function warnBox(cl, all) {
    const W = E.warnings(cl, E.targets(cl)).filter(w => all || w.lv === 'bad');
    if (!W.length) return '';
    return `<div class="warns">${W.map(w => `<div class="wn ${w.lv}">${w.lv === 'bad' ? '⛔' : w.lv === 'warn' ? '⚠️' : 'ℹ️'} ${esc(w.t)}</div>`).join('')}</div>`;
  }

  // Campos de formulario enlazados a la ficha
  const fi = (label, path, o = {}) => {
    const v = getPath(cur(), path);
    return `<label class="fld${o.cls ? ' ' + o.cls : ''}"><span>${label}</span><input data-b="${path}" data-k="${path}" ${o.num ? 'type="text" inputmode="decimal" autocomplete="off" data-t="num"' : `type="${o.type || 'text'}"`} value="${esc(v == null ? '' : v)}" placeholder="${esc(o.ph || '')}">${o.hint ? `<small class="mut">${o.hint}</small>` : ''}</label>`;
  };
  const fsel = (label, path, opts, o = {}) => {
    const v = getPath(cur(), path);
    return `<label class="fld"><span>${label}</span><select data-b="${path}" data-k="${path}" ${o.num ? 'data-t="num"' : ''}>${opts.map(([k, n]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
  };
  const fchips = (label, path, opts, multi, vt) => {
    const v = getPath(cur(), path);
    return `<div class="fld"><span>${label}</span><div class="chips">${opts.map(([k, n]) => {
      const on = multi ? (v || []).includes(k) : String(v) === String(k);
      return `<button class="chip ${on ? 'on' : ''}" data-a="${multi ? 'ptog' : 'pset'}" data-b="${path}" data-v="${esc(k)}" ${vt ? `data-vt="${vt}"` : ''}>${n}</button>`;
    }).join('')}</div></div>`;
  };
  const ftext = (label, path, ph) => `<label class="fld"><span>${label}</span><textarea data-b="${path}" data-k="${path}" rows="2" placeholder="${esc(ph || '')}">${esc(getPath(cur(), path) || '')}</textarea></label>`;

  function tPerfil(cl) {
    const p = cl.profile;
    const exGroups = Object.entries(NG.DISLIKES).map(([k, ids]) => [k, ids]);
    const otherEx = (p.exclude || []).filter(id => !exGroups.some(([, ids]) => ids.includes(id)));
    return `<div class="cols">
      <section class="card"><h3>👤 Datos personales</h3>
        ${fi('Nombre y apellido', 'profile.name')}${fi('WhatsApp del alumno', 'profile.phone', { type: 'tel', ph: 'Ej: 5491122334455', hint: 'Con código de país, para enviarle el plan en un toque.' })}
        ${fchips('Sexo biológico', 'profile.sex', [['M', 'Masculino'], ['F', 'Femenino']])}
        <div class="grid3">${fi('Edad', 'profile.age', { num: 1 })}${fi('Altura (cm)', 'profile.height', { num: 1 })}${fi('Peso (kg)', 'profile.weight', { num: 1 })}</div>
        <div class="grid3">${fi('% grasa', 'profile.bf', { num: 1, ph: 'opcional' })}${fi('Cintura (cm)', 'profile.waist', { num: 1, ph: 'opcional' })}${fi('Peso objetivo', 'profile.targetWeight', { num: 1, ph: 'opcional' })}</div>
      </section>
      <section class="card"><h3>🎯 Objetivo</h3>
        ${fchips('Objetivo', 'profile.goal', Object.entries(NG.GOALS).map(([k, g]) => [k, g.e + ' ' + g.n]))}
        ${NG.RATES[p.goal] ? fchips('Velocidad', 'profile.rate', Object.entries(NG.RATES[p.goal])) : ''}
        ${ftext('Motivación', 'profile.motivation')}
      </section>
      <section class="card"><h3>🏃 Actividad</h3>
        ${fsel('Actividad diaria (sin el entrenamiento)', 'profile.activity', Object.entries(NG.ACTIVITY).map(([k, a]) => [k, `${a.n} — ${a.d}`]))}
        ${(p.training || []).map((t, i) => `<div class="trow"><div class="grid3">${fsel('Entrenamiento', `profile.training.${i}.type`, Object.entries(NG.TRAIN))}${fi('Días/sem', `profile.training.${i}.days`, { num: 1 })}${fi('Minutos', `profile.training.${i}.min`, { num: 1 })}</div>
          <button class="link sm danger-t" data-a="trdel" data-i="${i}">Quitar</button></div>`).join('')}
        <button class="btn ghost sm" data-a="tradd">${ic('plus', 15)} Agregar entrenamiento</button>
        ${fsel('Horario de entrenamiento', 'profile.trainTime', Object.entries(NG.TRAIN_TIME).map(([k, t]) => [k, t.n]))}
      </section>
      <section class="card"><h3>🏋️ Entrenamiento</h3>
        ${fchips('Plan contratado', 'profile.planType', Object.entries(NG.PLAN_TYPES))}
        ${fchips('Experiencia con cargas', 'profile.experience', Object.entries(NG.EXPERIENCE))}
        ${fchips('Equipamiento', 'profile.equipment', Object.entries(NG.EQUIPMENT))}
        ${ftext('Lesiones, cirugías o molestias', 'profile.injuries', 'Ninguna')}
        ${ftext('Marcas aproximadas (sentadilla, banca, peso muerto, hip thrust, remo)', 'profile.lifts')}
        ${ftext('Objetivos secundarios y plazo', 'profile.goal2')}
        <div class="grid2">${fi('Ocupación y horarios', 'profile.occupation')}${fi('Instagram', 'profile.instagram', { ph: '@usuario' })}</div>
        ${fi('📁 Carpeta del alumno en Drive (link)', 'profile.drive', { type: 'url', ph: 'https://drive.google.com/drive/folders/…', hint: 'Pegá el link de su carpeta en 02_ALUMNOS: te aparece un botón para abrirla directo.' })}
      </section>
      <section class="card"><h3>🍳 Contexto</h3>
        ${fchips('¿Cocina?', 'profile.cooking', Object.entries(NG.COOKING))}
        ${fchips('¿Puede llevar vianda/tupper?', 'profile.tupper', [['true', 'Sí'], ['false', 'No']], false, 'bool')}
        ${fchips('Presupuesto', 'profile.budget', Object.entries(NG.BUDGET))}
        <p class="sm mut">Los horarios y dónde come cada comida se editan en la pestaña <b>Plan</b>.</p>
      </section>
      <section class="card"><h3>🥗 Alimentación</h3>
        ${fchips('Tipo de dieta', 'profile.diet', [3, 2, 1, 0].map(k => [String(k), NG.DIETAS[k]]), false, 'num')}
        ${fchips('Alergias / intolerancias (se excluyen del plan)', 'profile.allergens', Object.entries(NG.ALG), true)}
        <div class="fld"><span>No le gusta (se excluye del plan automático)</span><div class="chips">${exGroups.map(([k, ids]) => `<button class="chip ${ids.every(id => (p.exclude || []).includes(id)) ? 'on' : ''}" data-a="exgrp" data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div>
          <div class="chips">${otherEx.map(id => `<span class="chip on">${esc((NG.food(id) || { n: id }).n)} <button class="x" data-a="exdel" data-f="${id}">×</button></span>`).join('')}<button class="chip" data-a="pick" data-mode="ex">${ic('plus', 13)} Otro alimento</button></div></div>
        ${ftext('Otros que no le gustan (texto)', 'profile.dislikes')}${ftext('Le encanta', 'profile.likes')}
        ${fchips('Alcohol', 'profile.alcohol', Object.entries(NG.ALCOHOL))}
        ${fi('Suplementos actuales', 'profile.supplements')}
      </section>
      <section class="card"><h3>🩺 Salud</h3>
        ${fchips('Condiciones', 'profile.medical', NG.MED.map(m => [m.id, m.n]), true)}
        ${fi('Otra condición / medicación', 'profile.medicalText')}
        <div class="grid2">${fi('Horas de sueño', 'profile.sleep', { num: 1 })}${fi('Estrés (1–5)', 'profile.stress', { num: 1 })}</div>
      </section>
      <section class="card"><h3>🗒️ Notas privadas</h3>${ftext('Solo las ves vos (no se envían al alumno)', 'profile.notes', 'Lesiones, preferencias, acuerdos…')}
        <button class="btn ghost sm danger-t" data-a="delc">${ic('trash', 15)} Eliminar alumno</button></section>
    </div>`;
  }

  function tObjetivos(cl) {
    const T = E.targets(cl), c = cl.calc || {};
    const row = (l, v, s) => `<div class="crow"><span>${l}</span><b>${v}</b>${s ? `<small>${s}</small>` : ''}</div>`;
    const st = c.style || (T.goal === 'rend' ? 'alto' : 'equilibrado');
    return `<div class="cols">
      <section class="card"><h3>🧮 Cálculo del gasto</h3>
        ${row('Metabolismo basal', n0(T.bmr) + ' kcal', T.formula === 'katch' ? 'Katch-McArdle (usa masa magra)' : 'Mifflin-St Jeor')}
        ${T.bfKnown ? `<div class="chips">${[['mifflin', 'Mifflin-St Jeor'], ['katch', 'Katch-McArdle']].map(([k, n]) => `<button class="chip ${T.formula === k ? 'on' : ''}" data-a="cset" data-k2="formula" data-v="${k}">${n}</button>`).join('')}</div>` : ''}
        ${row('Actividad diaria', '× ' + n1(T.neatF), (NG.ACTIVITY[cl.profile.activity] || {}).n)}
        ${row('Entrenamiento', '+' + n0(T.eat) + ' kcal/día', n1(T.hoursWeek) + ' h por semana')}
        ${row('Mantenimiento estimado', n0(T.tdee) + ' kcal', '')}
        ${row('Ajuste por objetivo', (T.kcal - T.tdee > 0 ? '+' : '') + n0(T.kcal - T.tdee) + ' kcal', T.manual ? 'Calorías fijadas a mano' : T.adj)}
        ${row('Cambio de peso esperado', (T.weekly > 0 ? '+' : '') + n1(T.weekly) + ' kg/semana', 'Estimación inicial: se ajusta con los check-ins')}
        ${row('IMC', n1(T.bmi), T.bfKnown ? `${n1(T.bf)}% grasa · ${n1(T.ffm)} kg magra` : '')}
        <p class="sm mut">Es un punto de partida. Lo que manda es la evolución real: revisá cada 2–3 semanas con los check-ins.</p>
      </section>
      <section class="card"><h3>🎯 Objetivo diario</h3>
        <div class="bigk">${n0(T.kcal)}<small>kcal</small></div>
        ${pills({ k: T.kcal, p: T.p, c: T.c, f: T.f }, { noK: true })}
        <div class="mtab">
          <div><b class="p-t">Proteína ${T.p} g</b><small>${n1(T.protKg)} g/kg${T.refNote ? ` sobre ${n0(T.refW)} kg (${T.refNote})` : ''} · ${Math.round(T.p * 4 / T.kcalReal * 100)}%</small></div>
          <div><b class="f-t">Grasas ${T.f} g</b><small>${n1(T.f / T.w)} g/kg · ${Math.round(T.f * 9 / T.kcalReal * 100)}%</small></div>
          <div><b class="c-t">Carbohidratos ${T.c} g</b><small>${n1(T.c / T.w)} g/kg · ${Math.round(T.c * 4 / T.kcalReal * 100)}% (el resto)</small></div>
          <div><b>🌾 Fibra ${T.fi} g · 💧 Agua ${n1(T.water / 1000)} L</b><small>${T.waterTrain > T.water ? `${n1(T.waterTrain / 1000)} L los días de entrenamiento` : ''}</small></div>
        </div>
        <h4>Ajustes manuales</h4>
        <div class="fld"><span>Estilo de reparto</span><div class="chips">${[['equilibrado', 'Equilibrado'], ['bajo', 'Bajo en carbos'], ['alto', 'Alto en carbos']].map(([k, n]) => `<button class="chip ${st === k ? 'on' : ''}" data-a="cset" data-k2="style" data-v="${k}">${n}</button>`).join('')}</div></div>
        <div class="grid3">${fi('Calorías fijas', 'calc.kcal', { num: 1, ph: 'auto' })}${fi('Proteína (g/kg)', 'calc.protKg', { num: 1, ph: n1(T.protKg) })}${fi('Grasas (% kcal)', 'calc.fatPct', { num: 1, ph: String(T.fatPct) })}</div>
        <button class="btn ghost sm" data-a="creset">${ic('refresh', 15)} Volver a valores automáticos</button>
      </section></div>`;
  }

  function tPlan(cl) {
    const P = cl.plan, T = E.targets(cl);
    if (!P.meals.length) return `<section class="card center">
      <div class="logo-big">✨</div><h3>Todavía no hay plan</h3>
      <p class="mut">Generalo automáticamente con los datos del perfil (respeta dieta, alergias, gustos, si cocina y dónde come). Después lo ajustás a mano.</p>
      <div class="fld"><span>Cantidad de comidas</span><div class="chips center">${[2, 3, 4, 5, 6].map(n => `<button class="chip ${(cl.profile.meals || []).length === n ? 'on' : ''}" data-a="nmeals" data-n="${n}">${n}</button>`).join('')}</div></div>
      <button class="btn pri big" data-a="gen">${ic('wand')} Generar plan automático</button></section>`;
    const day = { k: 0, p: 0, c: 0, f: 0 };
    let off = 0;
    P.meals.forEach(m => {
      const o = m.options[Math.min(cs.optSel[m.id] || 0, m.options.length - 1)] || m.options[0];
      const t = o && o.type !== 'flex' ? E.sum(o.items) : m.target;
      day.k += t.k; day.p += t.p; day.c += t.c; day.f += t.f;
      m.options.forEach(x => { if (x.type !== 'flex' && x.items.length) { const s = E.sum(x.items); if (dcls(s.k, m.target.k) === 'bad' || dcls(s.p, m.target.p) === 'bad') off++; } });
    });
    const mt = (v, t, n) => `<div class="dt ${dcls(v, t)}"><small>${n}</small><b>${n0(v)}</b><span>/ ${n0(t)}</span></div>`;
    const pctSum = P.meals.reduce((s, m) => s + (+m.pct || 0), 0);
    return `<section class="card sticky-sum">
        <div class="row between wrapr"><h3>Total del día (opciones seleccionadas)</h3>
          <div class="row gap-s wrapr"><button class="btn ghost sm" data-a="gen">${ic('wand', 15)} Regenerar todo</button><button class="btn ghost sm" data-a="refit">⚖️ Reajustar cantidades</button><button class="btn ghost sm" data-a="addmeal">${ic('plus', 15)} Comida</button></div></div>
        <div class="dts">${mt(day.k, T.kcal, 'kcal')}${mt(day.p, T.p, 'Proteína')}${mt(day.c, T.c, 'Carbos')}${mt(day.f, T.f, 'Grasas')}</div>
        ${off ? `<div class="wn warn">⚠️ ${off} opción(es) se alejan más de 15% de su objetivo. Tocá <b>Reajustar cantidades</b> o ajustalas a mano.</div>` : ''}
        ${pctSum !== 100 ? `<div class="wn info">ℹ️ El reparto suma ${pctSum}% (se normaliza automáticamente al 100%).</div>` : ''}
      </section>
      ${P.meals.map((m, mi) => mealCard(cl, m, mi)).join('')}`;
  }
  function mealCard(cl, m, mi) {
    const P = cl.plan, oi = Math.min(cs.optSel[m.id] || 0, Math.max(0, m.options.length - 1)), o = m.options[oi];
    const pb = `plan.meals.${mi}`, h = E.hands(m.target, m.type);
    return `<section class="card meal-e">
      <div class="mhead">
        <select data-b="${pb}.type" data-k="${pb}.type" class="mtype">${Object.entries(NG.MEAL_TYPES).map(([k, t]) => `<option value="${k}" ${m.type === k ? 'selected' : ''}>${t.e}</option>`).join('')}</select>
        <input class="mname" data-b="${pb}.name" data-k="${pb}.name" value="${esc(m.name)}">
        <input type="time" data-b="${pb}.time" data-k="${pb}.time" value="${esc(m.time)}">
        <label class="pct"><input type="number" data-b="${pb}.pct" data-k="${pb}.pct" data-t="num" value="${m.pct}" min="0" max="100">%</label>
        <select data-b="${pb}.ctx" data-k="${pb}.ctx">${Object.entries(NG.CTX).map(([k, c]) => `<option value="${k}" ${m.ctx === k ? 'selected' : ''}>${c.e} ${c.n}</option>`).join('')}</select>
        <select data-b="${pb}.tag" data-k="${pb}.tag">${[['normal', 'Comida normal'], ['pre', '⚡ Pre-entreno'], ['post', '💪 Post-entreno']].map(([k, n]) => `<option value="${k}" ${m.tag === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
        <span class="row gap-s"><button class="ib sm" data-a="mup" data-mi="${mi}" ${mi ? '' : 'disabled'} aria-label="Subir">${ic('arrU', 15)}</button><button class="ib sm" data-a="mdown" data-mi="${mi}" ${mi < P.meals.length - 1 ? '' : 'disabled'} aria-label="Bajar">${ic('arrD', 15)}</button><button class="ib sm" data-a="mdel" data-mi="${mi}" aria-label="Eliminar comida">${ic('trash', 15)}</button></span>
      </div>
      <div class="row between wrapr"><div>${pills(m.target, { sm: true })}</div>
        <span class="sm mut">🖐️ ${U.frac(h.palm)} · ✊ ${h.fist} · 🤲 ${U.frac(h.cup)} · 👍 ${U.frac(h.thumb)}</span></div>
      <div class="otabs">${m.options.map((x, i) => `<button class="${i === oi ? 'on' : ''}" data-a="osel" data-m="${m.id}" data-i="${i}">${x.type === 'flex' ? '🧭' : String.fromCharCode(65 + i)} <span>${esc(x.name.length > 26 ? x.name.slice(0, 24) + '…' : x.name)}</span></button>`).join('')}
        <button class="add" data-a="oadd" data-mi="${mi}">${ic('plus', 14)} Opción</button></div>
      ${o ? optEditor(cl, m, mi, o, oi) : '<div class="empty sm">Sin opciones. Agregá una.</div>'}
      <input class="mnote" data-b="${pb}.note" data-k="${pb}.note" value="${esc(m.note || '')}" placeholder="📝 Indicación para esta comida (opcional)">
    </section>`;
  }
  function optEditor(cl, m, mi, o, oi) {
    const ob = `plan.meals.${mi}.options.${oi}`, A = `data-mi="${mi}" data-oi="${oi}"`;
    const head = `<div class="ohead"><input data-b="${ob}.name" data-k="${ob}.name" value="${esc(o.name)}" class="oname-i">
      <span class="row gap-s">${o.type !== 'flex' ? `<button class="btn ghost sm" data-a="ofit" ${A} title="Ajustar cantidades al objetivo">⚖️ Ajustar</button><button class="btn ghost sm" data-a="oauto" ${A} title="Reemplazar por otra opción automática">${ic('wand', 14)} Otra</button>` : ''}
      <button class="ib sm" data-a="odup" ${A} title="Duplicar">${ic('copy', 15)}</button><button class="ib sm" data-a="odel" ${A} title="Eliminar opción">${ic('trash', 15)}</button></span></div>`;
    if (o.type === 'flex') return `<div class="oed">${head}<p class="sm mut">Opción flexible: el alumno arma el plato con el método de la mano según el objetivo de esta comida.</p>
      <textarea data-b="${ob}.text" data-k="${ob}.text" rows="4">${esc(o.text || '')}</textarea></div>`;
    const t = E.sum(o.items);
    return `<div class="oed">${head}
      <div class="erows">${o.items.map((it, ii) => {
        const f = NG.food(it.f); if (!f) return '';
        const mm = E.mac(it.f, it.g), q = qty(f, it.g), fixed = E.isFixed(it), B = `${A} data-ii="${ii}"`;
        return `<div class="erow"><span class="e-e">${f.e}</span><div class="e-n"><b>${esc(f.n)}</b><small>${NG.GRUPOS[f.g].n}${f.ap ? ' · aprox.' : ''}</small></div>
          <div class="e-g"><input type="number" inputmode="decimal" data-b="${ob}.items.${ii}.g" data-k="${ob}.items.${ii}.g" data-t="num" value="${it.g}" step="${f.st || 5}" min="0"><small>${f.ml ? 'ml' : 'g'}${q.sub ? ' · ' + q.sub.replace('≈ ', '≈') : f.uf ? ' · ' + q.main : ''}</small></div>
          <div class="e-m">${n0(mm.k)} kcal<small>P ${n0(mm.p)} · C ${n0(mm.c)} · G ${n0(mm.f)}</small></div>
          <div class="e-a"><button class="ib sm ${fixed ? 'on' : ''}" data-a="ifix" ${B} title="${fixed ? 'Cantidad fija (no se ajusta)' : 'Fijar cantidad'}">📌</button><button class="ib sm" data-a="iswap" ${B} title="Reemplazar por equivalente">${ic('swap', 14)}</button><button class="ib sm" data-a="idel" ${B} title="Quitar">${ic('x', 14)}</button></div></div>`;
      }).join('')}</div>
      <button class="btn ghost sm" data-a="pick" data-mode="item" ${A}>${ic('plus', 15)} Agregar alimento</button>
      <div class="otot dts sm">${['k', 'p', 'c', 'f'].map(k => `<div class="dt ${dcls(t[k], m.target[k])}"><small>${{ k: 'kcal', p: 'Prot', c: 'Carb', f: 'Gras' }[k]}</small><b>${n0(t[k])}</b><span>/ ${n0(m.target[k])}</span></div>`).join('')}</div>
      <textarea data-b="${ob}.text" data-k="${ob}.text" rows="1" placeholder="Indicaciones de preparación (opcional)">${esc(o.text || '')}</textarea></div>`;
  }

  function tConsejos(cl) {
    const T = E.targets(cl), st = cl.plan.recState || {};
    const P = cl.plan, on = P.phases !== false, ph = on && P.start ? E.phaseOf(P.start) : null, fr = P.free ?? 1;
    return `<section class="card"><h3>🚦 Arranque y flexibilidad</h3>
        <div class="recr ${on ? 'on' : ''}"><button class="sw ${on ? 'on' : ''}" data-a="phtog" aria-label="Arranque por fases"><i></i></button>
          <div><b>Arranque por fases</b><p class="sm">Primero hábitos, después porciones, después autonomía. El alumno ve en su app la fase, el foco y 3 hábitos para tildar. En la fase 1 no se ajustan calorías.</p></div></div>
        ${on ? `<div class="phases">${NG.PHASES.map((x, i) => `<div class="phs ${ph && ph.idx === i ? 'on' : ''}"><b>${x.e} ${i + 1}. ${x.n}</b><small>${x.w} · meta: ${x.goal}% de las comidas</small><p class="sm">${esc(x.focus)}</p></div>`).join('')}</div>
          <label class="fld"><span>Inicio del plan</span><input type="date" data-b="plan.start" data-k="plan.start" value="${esc(P.start || '')}">
          <small class="mut">${P.start ? (ph ? `Hoy está en la fase ${ph.idx + 1} · ${ph.ph.n} (semana ${ph.week}).` : '') : 'Se completa solo el día que generás el primer link.'}</small></label>` : ''}
        <div class="fld"><span>Comidas libres planificadas por semana</span><div class="chips">${[0, 1, 2].map(n => `<button class="chip ${+fr === n ? 'on' : ''}" data-a="freeset" data-v="${n}">${n === 0 ? 'Ninguna' : n}</button>`).join('')}</div>
          <small class="mut">El alumno la marca como «Comida libre» y cuenta como cumplida, no como «me salí». Recomendado: 1 por semana.</small></div>
      </section>
      <div class="cols">
      <section class="card"><h3>💬 Mensaje para ${esc(first(cl.profile.name) || 'el alumno')}</h3>
        ${ftext('Aparece en la pantalla principal de su app', 'plan.msg', 'Ej: ¡Arrancamos! Esta semana enfocate en tomar agua y cumplir el desayuno 💪')}</section>
      <section class="card"><h3>💡 Recomendaciones automáticas</h3><p class="sm mut">Generadas según su perfil. Activá las que quieras enviar.</p>
        ${E.recs(cl, T).map(r => { const on = r.id in st ? st[r.id] : r.on; return `<div class="recr ${on ? 'on' : ''}"><button class="sw ${on ? 'on' : ''}" data-a="rtog" data-id="${r.id}" data-on="${on ? 1 : 0}" aria-label="Activar"><i></i></button>
          <div><b>${r.e} ${esc(r.t)}</b><p class="sm">${esc(r.x)}</p></div></div>`; }).join('')}</section>
      <section class="card"><h3>⭐ Consejos propios</h3>
        ${(cl.plan.customRecs || []).map((c, i) => `<div class="crec"><div class="grid-e"><input data-b="plan.customRecs.${i}.e" data-k="plan.customRecs.${i}.e" value="${esc(c.e || '⭐')}" class="emo">
          <input data-b="plan.customRecs.${i}.t" data-k="plan.customRecs.${i}.t" value="${esc(c.t || '')}" placeholder="Título"></div>
          <textarea data-b="plan.customRecs.${i}.x" data-k="plan.customRecs.${i}.x" rows="2" placeholder="Texto">${esc(c.x || '')}</textarea>
          <button class="link sm danger-t" data-a="crdel" data-i="${i}">Quitar</button></div>`).join('')}
        <button class="btn ghost sm" data-a="cradd">${ic('plus', 15)} Agregar consejo</button></section></div>`;
  }

  function tEnviar(cl) {
    const P = cl.plan, W = E.warnings(cl, E.targets(cl)), bad = W.filter(w => w.lv === 'bad');
    const empty = P.meals.filter(m => !m.options.length).length;
    const local = location.protocol === 'file:' && !D.settings.appUrl;
    const chk = (ok, t) => `<div class="chkl ${ok ? 'ok' : 'no'}">${ok ? '✅' : '⬜'} ${t}</div>`;
    return `<div class="cols">
      <section class="card"><h3>✔️ Antes de enviar</h3>
        ${chk(cl.profile.name && cl.profile.weight, 'Perfil completo')}
        ${chk(P.meals.length && !empty, P.meals.length ? (empty ? `${empty} comida(s) sin opciones` : `${P.meals.length} comidas con opciones`) : 'Plan creado')}
        ${chk(!bad.length, bad.length ? `${bad.length} alerta(s) de salud: revisalas (pestaña Perfil)` : 'Sin alertas de salud graves')}
        ${chk(!local, local ? 'Publicá la app y cargá su dirección en Ajustes para que el link abra en el celular' : 'Dirección pública de la app configurada')}
        <button class="btn ghost block" data-a="preview">${ic('eye')} Ver como lo verá el alumno</button>
      </section>
      <section class="card"><h3>📤 Enviar plan</h3>
        <p class="sm mut">El link contiene el plan completo. Cuando hagas cambios, generá y mandá un link nuevo: su app se actualiza y conserva sus registros.</p>
        <button class="btn pri block big" data-a="mklink" ${P.meals.length ? '' : 'disabled'}>${ic('link')} ${P.sentVersion ? (P.dirty ? 'Generar link actualizado' : 'Volver a generar el link') : 'Generar link del plan'}</button>
        ${cs.link && cs.link.id === cl.id ? `<textarea readonly rows="3" class="linkbox" id="plink">${esc(cs.link.url)}</textarea>
          <div class="stack">${cl.profile.phone ? `<button class="btn wa block" data-a="lwa">${ic('chat')} Enviar por WhatsApp a ${esc(first(cl.profile.name))}</button>` : `<button class="btn wa block" data-a="lwa">${ic('chat')} Elegir chat de WhatsApp</button>`}
          <div class="row gap"><button class="btn ghost grow" data-a="lcopy">${ic('copy', 16)} Copiar mensaje</button><button class="btn ghost grow" data-a="lshare">${ic('share', 16)} Compartir</button></div></div>
          <p class="sm mut">Versión ${P.sentVersion} · ${n0(cs.link.url.length)} caracteres</p>` : ''}
        ${P.sentAt ? `<p class="sm mut">Último envío: ${new Date(P.sentAt).toLocaleString('es-AR')}</p>` : ''}
      </section></div>`;
  }
  const linkMsg = (cl, url) => `¡Hola ${first(cl.profile.name)}! 👋 Acá tenés tu guía nutricional personalizada 🥗\n\nAbrila desde tu celular y agregala a la pantalla de inicio para usarla como una app:\n${url}`;

  function tProgreso(cl) {
    const T = E.targets(cl), an = E.analyze(cl, T), ck = (cl.checkins || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    const pts = ck.filter(c => c.avg).slice().reverse();
    let chart = '<div class="empty sm">El gráfico aparece con 2 check-ins con peso.</div>';
    if (pts.length >= 2) {
      const W = 520, H = 150, pd = 28, ys = pts.map(p => p.avg), mn = Math.min(...ys) - 0.5, mx = Math.max(...ys) + 0.5;
      const X = i => pd + i / (pts.length - 1) * (W - pd * 2), Y = v => H - pd - (v - mn) / (mx - mn) * (H - pd * 2);
      chart = `<svg viewBox="0 0 ${W} ${H}" class="chart"><polyline class="cline" points="${pts.map((p, i) => `${X(i)},${Y(p.avg)}`).join(' ')}"/>
        ${pts.map((p, i) => `<circle class="cdot" cx="${X(i)}" cy="${Y(p.avg)}" r="4"/><text class="axl" x="${X(i)}" y="${Y(p.avg) - 9}" text-anchor="middle">${n1(p.avg)}</text><text class="axl" x="${X(i)}" y="${H - 6}" text-anchor="middle">${fdate(p.date)}</text>`).join('')}</svg>`;
    }
    // Alertas del último check-in que piden acción esta semana
    const last = ck[0], alerts = [];
    if (last && last.mo === 1) alerts.push(['bad', `🤕 Reportó molestia${last.md ? `: “${last.md}”` : ''}. Revisá ese ejercicio en Lyfta antes del próximo entreno.`]);
    if (last && last.tr != null && last.tp && last.tr / last.tp < 0.75) alerts.push(['warn', `🏋️ Entrenó ${last.tr} de ${last.tp}: preguntale qué pasó y ajustá la rutina si no le da el tiempo.`]);
    if (last && (last.fa >= 4 || last.es >= 4)) alerts.push(['warn', `😮‍💨 Fatiga ${last.fa}/5 y estrés ${last.es}/5: considerá bajar volumen o intensidad esta semana.`]);
    if (last && last.ej) alerts.push(['info', `💪 Sobre los ejercicios: “${last.ej}”.`]);
    if (last && last.me === 1) alerts.push(['info', '🩸 Semana premenstrual o menstrual: una suba de peso puede ser retención de líquido.']);
    if (last && last.ft) alerts.push(['info', `📸 Le tocaban fotos esta semana: fijate que estén en su carpeta de Drive (03 Fotos de Progreso)${cl.profile.drive ? '' : '; cargá el link de su carpeta en el Perfil'}.`]);
    return `${alerts.length ? `<div class="warns">${alerts.map(([lv, t]) => `<div class="wn ${lv}">${esc(t)}</div>`).join('')}</div>` : ''}
      <section class="card ${an.ok ? (an.tone === 'ok' ? 'okc' : 'warnc') : ''}"><h3>🧠 Análisis</h3>
        ${an.ok ? `<p><b>Tendencia: ${an.rateTxt}</b>${an.adh ? ` · adherencia ${an.adh}%` : ''}</p><p>${esc(an.msg)}</p>
          ${an.delta ? `<button class="btn pri" data-a="applyd" data-d="${an.delta}">Aplicar ${an.delta > 0 ? '+' : ''}${an.delta} kcal y reajustar el plan</button>` : ''}` : `<p class="mut">${esc(an.msg)}</p>`}
      </section>
      <section class="card"><div class="row between"><h3>📉 Peso promedio semanal</h3><button class="btn ghost sm" data-a="paste">📥 Pegar check-in</button></div>${chart}</section>
      <section class="card"><h3>📋 Check-ins (${ck.length})</h3>
        ${ck.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Fecha</th><th>Peso</th><th>Comidas</th><th>Entrenos</th><th>Fatiga</th><th>Estrés</th><th>Molestias</th><th>Agua</th><th>⚡</th><th>😋</th><th>😴</th><th>🌿</th><th>Comentario</th><th></th></tr></thead><tbody>
          ${ck.map(c => `<tr><td>${fdate(c.date)}</td><td>${c.avg ? n1(c.avg) + ' kg' : '—'}${c.avg && c.prev ? `<small class="${c.avg < c.prev ? 'down' : 'up'}"> ${c.avg - c.prev > 0 ? '+' : ''}${n1(c.avg - c.prev)}</small>` : ''}${c.cin ? `<small> · ${n1(c.cin)} cm</small>` : ''}</td>
            <td>${c.adh == null ? '—' : c.adh + '%'}${c.lib ? `<small> · 🍕${c.lib}</small>` : ''}</td>
            <td>${c.tr == null ? '—' : c.tr + (c.tp ? '/' + c.tp : '')}</td><td>${c.fa || '—'}</td><td>${c.es || '—'}</td>
            <td class="note-c">${c.mo === 1 ? `<b class="bad-t">Sí</b> ${esc(c.md || '')}` : c.mo === 0 ? 'No' : '—'}</td><td>${c.w ? n1(c.w) : '—'}</td><td>${c.e || '—'}</td><td>${c.hu || '—'}</td><td>${c.s || '—'}</td><td>${c.dg || '—'}</td><td class="note-c">${esc(c.no || '')}</td>
            <td><button class="ib sm" data-a="ckdel" data-d="${c.date}" aria-label="Borrar">${ic('x', 14)}</button></td></tr>`).join('')}</tbody></table></div>`
          : '<div class="empty sm">Cuando el alumno toque «Enviar check-in» en su app, vas a recibir un WhatsApp. Pegalo con el botón 📥 y aparece acá.</div>'}
      </section>`;
  }

  /* ── Ajustes ───────────────────────────────────────────────────── */
  function vSettings() {
    const s = D.settings, cf = Object.values(D.customFoods || {});
    const sf = (l, k, o = {}) => `<label class="fld"><span>${l}</span><input data-s="${k}" data-k="s-${k}" type="${o.type || 'text'}" value="${esc(s[k] || '')}" placeholder="${esc(o.ph || '')}">${o.hint ? `<small class="mut">${o.hint}</small>` : ''}</label>`;
    return `<header class="chead"><button class="ib" data-a="go" data-h="#coach">${ic('chevL', 22)}</button><div class="grow"><h1>Ajustes</h1></div></header>
      <div class="cols">
      <section class="card"><h3>🏷️ Tu marca</h3>${sf('Tu nombre', 'name')}${sf('Marca', 'brand')}
        ${sf('Tu WhatsApp', 'whatsapp', { ph: '5491122334455', hint: 'Formato internacional (54 9 + área + número). Ahí llegan formularios y check-ins.' })}</section>
      <section class="card"><h3>🌐 Dirección pública de la app</h3>
        ${sf('URL donde publicaste la app', 'appUrl', { type: 'url', ph: 'https://tuusuario.github.io/guia/', hint: 'Los links de planes y formularios usan esta dirección. Si la dejás vacía se usa la dirección actual.' })}
        <p class="sm mut">Dirección actual: ${esc(location.href.replace(/#.*$/, ''))}</p></section>
      <section class="card"><h3>📁 Google Drive</h3>
        ${sf('Carpeta de alumnos (link)', 'driveUrl', { type: 'url', ph: 'https://drive.google.com/drive/folders/…', hint: 'El link de 01_COACHING → 02_ALUMNOS. Aparece como botón 📁 arriba en tu panel.' })}</section>
      <section class="card"><h3>🖥️ Dashboard de esta PC</h3>
        <label class="row gap"><input type="checkbox" data-s="dashSync" ${s.dashSync ? 'checked' : ''}> <span>Conectar con mi dashboard</span></label>
        <p class="sm mut">Manda los pendientes (check-ins, molestias, fotos, planes) a tu dashboard y a tus tareas de Notion. Solo funciona en la PC donde corre el dashboard; si el navegador pide permiso para acceder a la red local, tocá «Permitir».</p>
        <p class="sm" id="dash-st">${s.dashSync ? dashState : ''}</p></section>
      <section class="card"><h3>💾 Respaldo de datos</h3>
        <p class="sm">Todo se guarda en este dispositivo. Los viernes descargá el respaldo y guardalo en Drive → 01_COACHING → 04_RESPALDOS APP.</p>
        <p class="sm mut">Último respaldo: ${D.lastBackup ? new Date(D.lastBackup).toLocaleString('es-AR') : 'nunca'}</p>
        <div class="row gap wrapr"><button class="btn pri" data-a="backup">${ic('dl', 16)} Descargar respaldo</button><button class="btn ghost" data-a="restore">${ic('up', 16)} Restaurar respaldo</button></div>
        <p class="sm mut">También podés recuperar cualquier alumno pegando el link del plan que le enviaste (📥 Pegar mensaje).</p></section>
      <section class="card"><h3>🔒 PIN</h3><div class="grid2"><label class="fld"><span>Nuevo PIN (vacío = sin PIN)</span><input id="np1" type="password" inputmode="numeric"></label><label class="fld"><span>Repetir</span><input id="np2" type="password" inputmode="numeric"></label></div>
        <button class="btn ghost sm" data-a="setpin">Guardar PIN</button></section>
      <section class="card wide"><div class="row between"><h3>🥫 Alimentos propios (${cf.length})</h3><button class="btn ghost sm" data-a="cfnew">${ic('plus', 15)} Crear alimento</button></div>
        <p class="sm mut">Agregá productos que usan tus alumnos (con los datos de la etiqueta, por 100 g).</p>
        ${cf.length ? `<div class="erows">${cf.map(f => `<div class="erow"><span class="e-e">${f.e}</span><div class="e-n"><b>${esc(f.n)}</b><small>${NG.GRUPOS[f.g].n}</small></div><div class="e-m">${n0(f.k)} kcal<small>P ${n1(f.p)} · C ${n1(f.c)} · G ${n1(f.f)}</small></div>
          <div class="e-a"><button class="ib sm" data-a="cfedit" data-f="${f.id}">${ic('edit', 14)}</button><button class="ib sm" data-a="cfdel" data-f="${f.id}">${ic('trash', 14)}</button></div></div>`).join('')}</div>` : ''}</section>
      <section class="card"><h3>🧪 Alumno de ejemplo</h3><p class="sm mut">Crea a «Martín Gómez (ejemplo)»: come afuera, casi no cocina y ya tiene 3 semanas de check-ins. Usá «Ver como alumno» para recorrer su app con datos simulados. Borralo cuando quieras desde su Perfil.</p>
        <button class="btn ghost sm" data-a="demo">Cargar alumno de ejemplo</button></section>
      <section class="card"><h3>⚠️ Zona peligrosa</h3><button class="btn ghost danger-t" data-a="wipe">${ic('trash', 16)} Borrar todos los datos del panel</button></section>
      </div>`;
  }

  /* ── Hojas: selector de alimentos, equivalencias, pegar, alimento propio ── */
  function pickList() {
    const pk = cs.pick, cl = cur(), q = pk.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const all = Object.values(NG.allFoods()).filter(f => (!pk.g || f.g === pk.g)
      && (!q || f.n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q))
      && (pk.all || pk.mode === 'ex' || !cl || E.allowedFood(f, cl.profile)));
    all.sort((a, b) => a.n.localeCompare(b.n));
    return all.slice(0, 80).map(f => `<button class="it" data-a="pickdo" data-f="${f.id}"><span class="it-e">${f.e}</span><span class="it-n">${esc(f.n)}<small>${NG.GRUPOS[f.g].n} · ${n0(f.k)} kcal · P ${n1(f.p)} · C ${n1(f.c)} · G ${n1(f.f)} por 100 ${f.ml ? 'ml' : 'g'}</small></span>${ic('plus', 16)}</button>`).join('')
      || '<div class="empty sm">Sin resultados. Podés crear el alimento.</div>';
  }
  function openPick(mode, mi, oi) {
    cs.pick = { mode, mi, oi, q: '', g: '', all: false };
    U.open(pickBody(), { wide: true, onClose: () => { cs.pick = null; } });
  }
  const pickBody = () => `<h3>${cs.pick.mode === 'ex' ? 'Excluir alimento' : 'Agregar alimento'}</h3>
    <input type="search" class="search block" placeholder="Buscar alimento…" data-live="pick" data-k="pick" value="${esc(cs.pick.q)}" autofocus>
    <div class="chips sm">${[['', 'Todos']].concat(Object.entries(NG.GRUPOS).map(([k, g]) => [k, g.e + ' ' + g.n])).map(([k, n]) => `<button class="chip ${cs.pick.g === k ? 'on' : ''}" data-a="pickg" data-v="${k}">${n}</button>`).join('')}</div>
    ${cs.pick.mode === 'item' ? `<label class="sm row gap-s"><input type="checkbox" data-a="pickall" ${cs.pick.all ? 'checked' : ''}> Mostrar también alimentos excluidos para este alumno</label>` : ''}
    <div class="items" id="pick-list">${pickList()}</div>
    <button class="btn ghost sm" data-a="cfnew">${ic('plus', 15)} Crear alimento propio</button>`;

  function openSwap(mi, oi, ii) {
    const cl = cur(), it = cl.plan.meals[mi].options[oi].items[ii], f = NG.food(it.f);
    const list = E.exchanges(it.f, it.g, cl.profile).slice(0, 20);
    U.open(`<h3>Reemplazar ${f.e} ${esc(f.n)} (${it.g} ${f.ml ? 'ml' : 'g'})</h3><p class="sm mut">Equivalentes que respetan sus restricciones:</p>
      <div class="items">${list.map(x => { const ff = NG.food(x.f); return `<button class="it" data-a="swapdo" data-mi="${mi}" data-oi="${oi}" data-ii="${ii}" data-f="${x.f}" data-g="${x.g}"><span class="it-e">${ff.e}</span><span class="it-n">${esc(ff.n)}<small>${n0(x.m.k)} kcal · P ${n0(x.m.p)} · C ${n0(x.m.c)} · G ${n0(x.m.f)}</small></span><span class="it-q"><b>${x.g} ${ff.ml ? 'ml' : 'g'}</b></span></button>`; }).join('') || '<div class="empty sm">Sin equivalencias.</div>'}</div>`, { wide: true });
  }
  function openPaste() {
    U.open(`<h3>📥 Pegar mensaje</h3><p class="sm mut">Pegá el WhatsApp completo que te mandó el alumno (formulario o check-in) o el link de un plan para recuperarlo.</p>
      <textarea id="paste-t" rows="7" autofocus placeholder="📝 Formulario inicial…  /  📋 Check-in…  /  https://…#p=…"></textarea>
      <button class="btn pri block" data-a="pastedo">Importar</button>`, { wide: true });
  }
  async function doPaste(txt) {
    const frm = txt.match(/#FRM:([\w-]+)/), chk = txt.match(/#CHK:([\w-]+)/), pl = txt.match(/#p=([\w-]+)/);
    try {
      if (frm) {
        const d = await S.unpack(frm[1]); if (!d || !d.p) throw 0;
        const cl = newClient(d.p);
        cl.plan.meals = E.genPlan(cl);
        D.clients[cl.id] = cl; save(); U.closeAll();
        U.toast('✅ Alumno creado con un plan automático: revisalo');
        cs.tab = 'perfil'; location.hash = '#coach/c/' + cl.id; return;
      }
      if (chk) {
        const d = await S.unpack(chk[1]); const cl = d && D.clients[d.id];
        if (!cl) return U.toast('⚠️ Ese check-in es de un alumno que no está en este panel');
        cl.checkins = (cl.checkins || []).filter(c => c.date !== d.d);
        cl.checkins.push({ date: d.d, avg: d.avg, prev: d.prev, adh: d.adh, done: d.done, tot: d.tot, lib: d.lib, w: d.w,
          tr: d.tr, tp: d.tp, fa: d.fa, es: d.es, mo: d.mo, md: d.md, ej: d.ej, me: d.me, ft: d.ft, hab: d.hab, cin: d.cin, e: d.e, hu: d.hu, s: d.s, dg: d.dg, no: d.no, ws: d.ws, ver: d.ver, at: Date.now() });
        cl.updatedAt = Date.now(); save(); U.closeAll(); U.toast(`✅ Check-in de ${first(cl.profile.name)} guardado`);
        cs.tab = 'progreso'; if (location.hash === '#coach/c/' + cl.id + '/progreso') render(); else location.hash = '#coach/c/' + cl.id + '/progreso'; return;
      }
      if (pl) {
        const d = await S.unpack(pl[1]); if (!d || !d.m) throw 0;
        if (D.clients[d.id] && !(await U.confirm(`${D.clients[d.id].profile.name} ya existe. ¿Reemplazar su plan por el del link (versión ${d.ver})? Se conservan sus check-ins.`, { yes: 'Reemplazar' }))) return;
        const cl = clientFromPayload(d);
        if (D.clients[d.id]) { cl.checkins = D.clients[d.id].checkins || []; cl.profile.notes = D.clients[d.id].profile.notes || ''; }
        D.clients[cl.id] = cl; save(); U.closeAll(); U.toast('✅ Alumno recuperado desde el link');
        location.hash = '#coach/c/' + cl.id + '/plan'; return;
      }
      U.toast('No encontré ningún código en el texto pegado');
    } catch (e) { console.warn(e); U.toast('⚠️ El código está incompleto o dañado. Pedile que lo reenvíe.'); }
  }
  function openFoodForm(f) {
    f = f || { id: '', n: '', e: '🥫', g: 'prot', k: '', p: '', c: '', f: '', fi: '', u: '', ug: '', d: 3, al: [], st: 5, mn: 0, mx: 400 };
    cs.ff = JSON.parse(JSON.stringify(f));
    const x = cs.ff, inF = (l, k, o = {}) => `<label class="fld"><span>${l}</span><input id="ff-${k}" ${o.num ? 'type="text" inputmode="decimal" autocomplete="off"' : ''} value="${esc(x[k] == null ? '' : x[k])}" placeholder="${esc(o.ph || '')}"></label>`;
    U.open(`<h3>${f.id ? 'Editar' : 'Crear'} alimento</h3>
      <div class="grid-e">${inF('Emoji', 'e')}${inF('Nombre', 'n', { ph: 'Ej: Yogur marca X' })}</div>
      <label class="fld"><span>Grupo</span><select id="ff-g">${Object.entries(NG.GRUPOS).map(([k, g]) => `<option value="${k}" ${x.g === k ? 'selected' : ''}>${g.e} ${g.n}</option>`).join('')}</select></label>
      <p class="sm mut">Valores cada 100 g (o 100 ml):</p>
      <div class="grid3">${inF('Kcal', 'k', { num: 1 })}${inF('Proteínas', 'p', { num: 1 })}${inF('Carbohidratos', 'c', { num: 1 })}${inF('Grasas', 'f', { num: 1 })}${inF('Fibra', 'fi', { num: 1 })}</div>
      <div class="grid2">${inF('Unidad (opcional)', 'u', { ph: 'Ej: pote, feta' })}${inF('Gramos por unidad', 'ug', { num: 1 })}</div>
      <label class="fld"><span>Apto para</span><select id="ff-d">${Object.entries(NG.DIETAS).map(([k, n]) => `<option value="${k}" ${+x.d === +k ? 'selected' : ''}>${k == 3 ? 'Solo omnívoros (tiene carne)' : 'Hasta ' + n}</option>`).join('')}</select></label>
      <div class="fld"><span>Contiene</span><div class="chips">${Object.entries(NG.ALG).map(([k, n]) => `<label class="chip"><input type="checkbox" class="ff-al" value="${k}" ${(x.al || []).includes(k) ? 'checked' : ''}> ${n}</label>`).join('')}</div></div>
      <button class="btn pri block" data-a="cfsave">Guardar alimento</button>`, { wide: true });
  }

  /* ── Eventos ───────────────────────────────────────────────────── */
  async function click(a, el) {
    const ds = el.dataset, cl = cs.route[1] === 'c' ? cur() : null;
    const opt = () => cl.plan.meals[+ds.mi].options[+ds.oi];
    const done = (msg) => { touch(cl); if (msg) U.toast(msg); render(); };
    switch (a) {
      case 'go': location.hash = ds.h; return;
      case 'lock': sessionStorage.removeItem('ng_unlock'); return mount(cs.route);
      case 'open': cs.tab = 'perfil'; location.hash = '#coach/c/' + ds.id; return;
      case 'tab': cs.tab = ds.t; history.replaceState(null, '', '#coach/c/' + cl.id + '/' + ds.t); cs.route[3] = ds.t; window.scrollTo(0, 0); U.enter(); return render();
      case 'newc': { const c = newClient(); D.clients[c.id] = c; save(); cs.tab = 'perfil'; location.hash = '#coach/c/' + c.id; return; }
      case 'paste': return openPaste();
      case 'pastedo': return doPaste(document.getElementById('paste-t').value || '');
      case 'formlink': {
        const url = await formLink();
        const msg = `¡Hola! 👋 Para armar tu plan nutricional personalizado necesito que completes este formulario (te lleva unos 5 minutos):\n${url}`;
        cs.flmsg = msg;
        U.open(`<h3>📝 Link del formulario</h3><p class="sm mut">Mandáselo a cada alumno nuevo. Cuando lo complete te llega un WhatsApp: pegalo en <b>📥 Pegar mensaje</b> y se crea el alumno con su plan automático.</p>
          <textarea readonly rows="3" class="linkbox">${esc(url)}</textarea>
          ${!D.settings.whatsapp ? '<p class="wn warn sm">⚠️ Cargá tu WhatsApp en Ajustes para que el formulario te llegue directo.</p>' : ''}
          <div class="stack"><button class="btn wa block" data-a="flwa">${ic('chat')} Enviar por WhatsApp</button>
          <div class="row gap"><button class="btn ghost grow" data-a="flcopy">${ic('copy', 16)} Copiar</button><button class="btn ghost grow" data-a="flopen">${ic('eye', 16)} Probar formulario</button></div></div>`, { wide: true });
        cs.flurl = url; return;
      }
      case 'flwa': return U.wa('', cs.flmsg);
      case 'flcopy': return U.copy(cs.flmsg);
      case 'flopen': return window.open(cs.flurl, '_blank');
      case 'backup': {
        const txt = JSON.stringify({ app: 'guia-nutricional', v: 1, exportedAt: new Date().toISOString(), data: D });
        if (await S.saveFile(`respaldo-guia-nutricional-${S.today()}.json`, txt)) { D.lastBackup = Date.now(); S.saveCoach(D); U.toast('💾 Respaldo listo'); render(); }
        return;
      }
      case 'restore': {
        const txt = await S.pickFile(); if (!txt) return;
        let d; try { d = JSON.parse(txt); d = d.data || d; if (!d.settings || !d.clients) throw 0; } catch (e) { return U.toast('⚠️ El archivo no es un respaldo válido'); }
        if (!(await U.confirm(`Se reemplazan los datos actuales por los del respaldo (${Object.keys(d.clients).length} alumnos).`, { yes: 'Restaurar' }))) return;
        D = d; S.saveCoach(D); sessionStorage.setItem('ng_unlock', D.settings.pin || ''); U.toast('✅ Respaldo restaurado'); return mount(['coach']);
      }
      case 'setpin': {
        const a1 = document.getElementById('np1').value.trim(), a2 = document.getElementById('np2').value.trim();
        if (a1 && !/^\d{4,8}$/.test(a1)) return U.toast('El PIN debe tener de 4 a 8 números');
        if (a1 !== a2) return U.toast('Los PIN no coinciden');
        D.settings.pin = a1 ? await S.sha(a1) : ''; sessionStorage.setItem('ng_unlock', D.settings.pin); save(); return U.toast(a1 ? '🔒 PIN actualizado' : 'PIN desactivado');
      }
      case 'wipe':
        if (await U.confirm('Se borran TODOS los alumnos y ajustes de este dispositivo. Hacé un respaldo antes.', { yes: 'Borrar todo', danger: true })
          && await U.confirm('¿Seguro? Esta acción no se puede deshacer.', { yes: 'Sí, borrar', danger: true })) { localStorage.removeItem('ng_coach_v1'); sessionStorage.removeItem('ng_unlock'); D = null; mount(['coach']); }
        return;
      case 'cfnew': return openFoodForm();
      case 'cfedit': return openFoodForm(D.customFoods[ds.f]);
      case 'cfdel': if (await U.confirm('¿Eliminar este alimento? Los planes ya enviados no cambian.', { yes: 'Eliminar', danger: true })) { delete D.customFoods[ds.f]; save(); render(); } return;
      case 'cfsave': {
        const g = id => document.getElementById('ff-' + id).value.trim(), num = id => +String(g(id)).replace(',', '.') || 0;
        if (!g('n')) return U.toast('Poné un nombre');
        const id = cs.ff.id || 'u_' + E.uid();
        const ug = num('ug'), grp = g('g');
        D.customFoods[id] = { id, n: g('n'), e: g('e') || '🥫', g: grp, k: num('k'), p: num('p'), c: num('c'), f: num('f'), fi: num('fi'), d: +g('d'), ck: 0,
          al: [...document.querySelectorAll('.ff-al:checked')].map(x => x.value), u: g('u'), ug, uf: false, ml: false, ap: false, caro: false,
          st: ug && ug <= 60 ? ug : 5, mn: grp === 'grasa' || grp === 'extra' ? 0 : 10, mx: Math.max(400, ug * 4) };
        save(); U.close(); U.toast('✅ Alimento guardado');
        if (cs.pick) U.update(pickBody()); else render();
        return;
      }
      case 'preview': location.hash = '#coach/pv/' + cl.id; return;
      case 'remind': {
        const c = D.clients[ds.id];
        return U.wa(c.profile.phone, `¡Buenas ${first(c.profile.name)}! Hoy es día de check-in 📋\nAbrí tu app → Progreso → «Enviar check-in semanal» (son 2 minutitos) y me llega directo. Mañana te dejo todo ajustado 💪`);
      }
      case 'demo': { const c = loadDemo(); U.toast('🧪 Alumno de ejemplo cargado'); cs.tab = 'plan'; location.hash = '#coach/c/' + c.id + '/plan'; return; }
    }
    if (!cl) return;
    switch (a) {
      case 'delc':
        if (await U.confirm(`¿Eliminar a ${cl.profile.name || 'este alumno'} y todos sus datos?`, { yes: 'Eliminar', danger: true })) { delete D.clients[cl.id]; save(); location.hash = '#coach'; }
        return;
      case 'pset': {
        let v = ds.v; if (ds.vt === 'num') v = +v; if (ds.vt === 'bool') v = v === 'true';
        setPath(cl, ds.b, v);
        if (ds.b === 'profile.goal' && !NG.RATES[v]) cl.profile.rate = 'moderado';
        recalc(cl); return done();
      }
      case 'ptog': { const arr = getPath(cl, ds.b) || []; setPath(cl, ds.b, arr.includes(ds.v) ? arr.filter(x => x !== ds.v) : arr.concat(ds.v)); recalc(cl); return done(); }
      case 'exgrp': { const ids = NG.DISLIKES[ds.v], ex = cl.profile.exclude || [], on = ids.every(id => ex.includes(id)); cl.profile.exclude = on ? ex.filter(x => !ids.includes(x)) : [...new Set(ex.concat(ids))]; return done(); }
      case 'exdel': cl.profile.exclude = (cl.profile.exclude || []).filter(x => x !== ds.f); return done();
      case 'tradd': cl.profile.training.push({ type: 'cardio', days: 2, min: 45 }); recalc(cl); return done();
      case 'trdel': cl.profile.training.splice(+ds.i, 1); recalc(cl); return done();
      case 'cset': cl.calc = cl.calc || {}; cl.calc[ds.k2] = ds.v; recalc(cl); return done();
      case 'creset': cl.calc = {}; recalc(cl); return done('Valores automáticos restablecidos');
      case 'nmeals': cl.profile.meals = E.defaultMeals(+ds.n); return done();
      case 'gen': {
        if (cl.plan.meals.length && !(await U.confirm('Se reemplazan todas las opciones actuales por un plan nuevo (se mantienen las comidas, horarios y lugares).', { yes: 'Regenerar' }))) return;
        const base = cl.plan.meals.length ? cl.plan.meals.map(m => ({ id: m.id, type: m.type, name: m.name, time: m.time, pct: m.pct, ctx: m.ctx })) : cl.profile.meals;
        cl.plan.meals = E.genPlan(Object.assign({}, cl, { profile: Object.assign({}, cl.profile, { meals: base }) }), String(Date.now()));
        cs.optSel = {}; return done('✨ Plan generado');
      }
      case 'refit': refitAll(cl); return done('⚖️ Cantidades reajustadas');
      case 'addmeal': cl.plan.meals.push({ id: E.uid(), type: 'colacion', name: 'Colación', time: '16:00', pct: 10, ctx: 'casa', tag: 'normal', note: '', options: [] }); recalc(cl); return done();
      case 'mup': case 'mdown': { const i = +ds.mi, j = a === 'mup' ? i - 1 : i + 1, M = cl.plan.meals; [M[i], M[j]] = [M[j], M[i]]; return done(); }
      case 'mdel': if (await U.confirm(`¿Eliminar «${cl.plan.meals[+ds.mi].name}»?`, { yes: 'Eliminar', danger: true })) { cl.plan.meals.splice(+ds.mi, 1); recalc(cl); done(); } return;
      case 'osel': cs.optSel[ds.m] = +ds.i; return render();
      case 'oadd': {
        const m = cl.plan.meals[+ds.mi];
        U.open(`<h3>Nueva opción para ${esc(m.name)}</h3><div class="stack">
          <button class="btn ghost block left" data-a="oaddk" data-k="auto" data-mi="${ds.mi}">${ic('wand')} Automática (según su perfil)</button>
          <button class="btn ghost block left" data-a="oaddk" data-k="empty" data-mi="${ds.mi}">${ic('plus')} Vacía (la armo yo)</button>
          <button class="btn ghost block left" data-a="oaddk" data-k="flex" data-mi="${ds.mi}">🧭 Comer afuera (método de la mano)</button></div>`, { center: true });
        return;
      }
      case 'oaddk': {
        const m = cl.plan.meals[+ds.mi]; let o;
        if (ds.k === 'auto') { o = E.anotherOption(m, cl.profile); if (!o) { U.toast('No hay más comidas modelo compatibles: armá una vacía'); return; } }
        else if (ds.k === 'flex') o = E.flexOption(m);
        else o = { id: E.uid(), name: 'Opción personalizada', type: 'exact', items: [] };
        m.options.push(o); cs.optSel[m.id] = m.options.length - 1; U.close(); return done();
      }
      case 'ofit': { const m = cl.plan.meals[+ds.mi], o = opt(); o.items = E.fit(o.items, m.target); return done('⚖️ Ajustado al objetivo'); }
      case 'oauto': {
        const m = cl.plan.meals[+ds.mi], n = E.anotherOption(m, cl.profile);
        if (!n) return U.toast('No hay otra comida modelo compatible');
        m.options[+ds.oi] = n; return done();
      }
      case 'odup': { const m = cl.plan.meals[+ds.mi], o = JSON.parse(JSON.stringify(opt())); o.id = E.uid(); o.name += ' (copia)'; m.options.splice(+ds.oi + 1, 0, o); cs.optSel[m.id] = +ds.oi + 1; return done(); }
      case 'odel': { const m = cl.plan.meals[+ds.mi]; if (await U.confirm(`¿Eliminar la opción «${opt().name}»?`, { yes: 'Eliminar', danger: true })) { m.options.splice(+ds.oi, 1); cs.optSel[m.id] = 0; done(); } return; }
      case 'ifix': { const it = opt().items[+ds.ii]; if (it.fix) delete it.fix; else it.fix = 1; return done(); }
      case 'idel': opt().items.splice(+ds.ii, 1); return done();
      case 'iswap': return openSwap(+ds.mi, +ds.oi, +ds.ii);
      case 'swapdo': { const it = cl.plan.meals[+ds.mi].options[+ds.oi].items[+ds.ii]; it.f = ds.f; it.g = +ds.g; U.close(); return done('Reemplazado'); }
      case 'pick': return openPick(ds.mode, +ds.mi, +ds.oi);
      case 'pickg': cs.pick.g = ds.v; return U.update(pickBody());
      case 'pickall': cs.pick.all = el.checked; document.getElementById('pick-list').innerHTML = pickList(); return;
      case 'pickdo': {
        const f = NG.food(ds.f), pk = cs.pick;
        if (pk.mode === 'ex') { cl.profile.exclude = [...new Set((cl.profile.exclude || []).concat(ds.f))]; U.close(); return done(`${f.n} excluido`); }
        const g = f.uf && f.ug ? f.ug : f.ml ? 200 : f.g === 'grasa' ? 10 : f.g === 'extra' ? 10 : f.u && f.ug ? f.ug : 100;
        cl.plan.meals[pk.mi].options[pk.oi].items.push({ f: f.id, g });
        U.close(); return done(`${f.e} ${f.n} agregado`);
      }
      case 'phtog': cl.plan.phases = cl.plan.phases === false; return done(cl.plan.phases ? 'Arranque por fases activado' : 'Arranque por fases desactivado');
      case 'freeset': cl.plan.free = +ds.v; return done();
      case 'rtog': cl.plan.recState = cl.plan.recState || {}; cl.plan.recState[ds.id] = ds.on !== '1'; return done();
      case 'cradd': (cl.plan.customRecs = cl.plan.customRecs || []).push({ id: 'c_' + E.uid(), e: '⭐', t: '', x: '' }); return done();
      case 'crdel': cl.plan.customRecs.splice(+ds.i, 1); return done();
      case 'mklink': {
        const bad = E.warnings(cl, E.targets(cl)).filter(w => w.lv === 'bad');
        if (bad.length && !(await U.confirm('Este alumno tiene alertas de salud importantes. Asegurate de contar con aval médico antes de enviarle el plan.', { yes: 'Entendido, generar' }))) return;
        cs.link = { id: cl.id, url: await makeLink(cl) }; render(); U.toast('🔗 Link generado'); return;
      }
      case 'lwa': return U.wa(cl.profile.phone, linkMsg(cl, cs.link.url));
      case 'lcopy': return U.copy(linkMsg(cl, cs.link.url));
      case 'lshare': return U.share({ title: 'Tu guía nutricional', text: linkMsg(cl, cs.link.url).replace(cs.link.url, '').trim(), url: cs.link.url });
      case 'applyd': {
        const T = E.targets(cl); cl.calc = cl.calc || {}; cl.calc.kcal = T.kcal + +ds.d; refitAll(cl);
        return done(`Calorías ajustadas a ${n0(cl.calc.kcal)} kcal. Enviá el link actualizado.`);
      }
      case 'ckdel': if (await U.confirm('¿Borrar este check-in?', { yes: 'Borrar', danger: true })) { cl.checkins = cl.checkins.filter(c => c.date !== ds.d); save(); render(); } return;
    }
  }

  function change(el) {
    if (el.dataset.s) {
      let v = el.type === 'checkbox' ? el.checked : el.value.trim(); if (el.dataset.s === 'whatsapp') v = U.phone(v);
      D.settings[el.dataset.s] = v;
      save(); return later(render);
    }
    const b = el.dataset.b; if (!b) return;
    const cl = cur(); if (!cl) return;
    let v = el.value;
    if (el.dataset.t === 'num') { const n = parseFloat(String(v).replace(',', '.')); v = v === '' || isNaN(n) ? '' : n; }
    setPath(cl, b, v);
    if (/^(profile|calc)\.|\.pct$|\.tag$/.test(b)) recalc(cl);
    if (/\.type$/.test(b) && /^plan\.meals\.\d+\.type$/.test(b)) { const m = getPath(cl, b.replace(/\.type$/, '')); if (Object.values(NG.MEAL_TYPES).some(t => t.n === m.name) || !m.name) m.name = NG.MEAL_TYPES[v].n; recalc(cl); }
    touch(cl); later(render);
  }
  function input(el) {
    if (el.dataset.live === 'q') { cs.q = el.value; return later(render); }
    if (el.dataset.live === 'pick' && cs.pick) { cs.pick.q = el.value; const l = document.getElementById('pick-list'); if (l) l.innerHTML = pickList(); }
  }

  NG.Coach = { mount };
})(window.NG);
