/* Motor nutricional: gasto energético, macros, reparto por comida, ajuste de porciones,
   generador de planes, equivalencias, recomendaciones y análisis de check-ins. */
(function (NG) {
  // Factor de actividad diaria SIN contar el entrenamiento (incluye efecto térmico de los alimentos)
  const NEAT = { sed: 1.3, lig: 1.45, act: 1.6, muy: 1.75 };
  // MET promedio de una sesión típica
  const MET = { fuerza: 5, hiit: 6.5, cardio: 7, deporte: 6.5, suave: 3 };
  // Proteína (g/kg de peso de referencia) por objetivo
  const PROT = { perder: 2.0, recomp: 2.2, mantener: 1.6, ganar: 1.8, rend: 1.6 };
  const LOSS = { suave: 0.5, moderado: 0.75, rapido: 1 };   // % del peso por semana
  const GAIN = { suave: 5, moderado: 10, rapido: 15 };      // % sobre mantenimiento
  const FATPCT = { equilibrado: 27, bajo: 40, alto: 20 };

  const r = (x, d = 0) => { const m = 10 ** d; return Math.round(x * m) / m; };
  const uid = () => Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 7);

  function mac(id, g) {
    const f = NG.food(id), q = (+g || 0) / 100;
    if (!f) return { k: 0, p: 0, c: 0, f: 0, fi: 0 };
    return { k: f.k * q, p: f.p * q, c: f.c * q, f: f.f * q, fi: (f.fi || 0) * q };
  }
  function sum(items) {
    const t = { k: 0, p: 0, c: 0, f: 0, fi: 0 };
    (items || []).forEach(it => { const m = mac(it.f, it.g); for (const k in t) t[k] += m[k]; });
    return t;
  }

  /* ── Objetivos diarios ─────────────────────────────────────────── */
  function targets(cl) {
    const p = cl.profile || {}, c = cl.calc || {};
    const w = +p.weight || 70, h = +p.height || 170, a = +p.age || 30, male = p.sex !== 'F';
    const bmi = w / ((h / 100) ** 2);
    const bfKnown = +p.bf > 0;
    // Si no hay % de grasa medido se estima (Deurenberg) solo para chequeos de seguridad
    const bf = bfKnown ? +p.bf : Math.min(50, Math.max(6, 1.2 * bmi + 0.23 * a - 10.8 * (male ? 1 : 0) - 5.4));
    const ffm = w * (1 - bf / 100);
    const mifflin = 10 * w + 6.25 * h - 5 * a + (male ? 5 : -161);
    const katch = bfKnown ? 370 + 21.6 * ffm : null;
    const formula = c.formula === 'katch' && katch ? 'katch' : 'mifflin';
    const bmr = formula === 'katch' ? katch : mifflin;
    const neatF = NEAT[p.activity] || NEAT.sed;
    const tr = (p.training || []).filter(t => +t.days > 0 && +t.min > 0);
    const eatWeek = tr.reduce((s, t) => s + t.days * t.min / 60 * ((MET[t.type] || 5) - 1) * w, 0);
    const eat = eatWeek / 7;
    const hoursWeek = tr.reduce((s, t) => s + t.days * t.min / 60, 0);
    const maxSession = tr.reduce((s, t) => Math.max(s, +t.min), 0);
    const tdee = bmr * neatF + eat;

    const goal = p.goal || 'mantener', rate = p.rate || 'moderado';
    let kcal = tdee, adj = 'Mantenimiento', limited = false, floored = false;
    if (goal === 'perder') {
      const pct = LOSS[rate] || 0.75;
      let def = pct / 100 * w * 7700 / 7;
      const cap = tdee * (rate === 'rapido' ? 0.3 : 0.25);
      if (def > cap) { def = cap; limited = true; }
      kcal = tdee - def;
      adj = `Déficit para bajar ~${String(pct).replace('.', ',')}% del peso por semana`;
    } else if (goal === 'recomp') { kcal = tdee * 0.9; adj = 'Déficit ligero (−10%)'; }
    else if (goal === 'ganar') { const g = GAIN[rate] || 10; kcal = tdee * (1 + g / 100); adj = `Superávit (+${g}%)`; }
    else if (goal === 'rend') adj = 'Mantenimiento con foco en rendimiento';
    if (kcal < bmr && goal !== 'ganar') { kcal = bmr; floored = true; }
    const manual = +c.kcal > 0;
    if (manual) kcal = +c.kcal;
    kcal = Math.round(kcal / 10) * 10;

    // Peso de referencia para la proteína (evita sobreestimar en personas con mucha grasa)
    let refW = w, refNote = '';
    if (bfKnown) {
      const lim = ffm / (1 - (male ? 0.15 : 0.25));
      if (lim < w) { refW = lim; refNote = 'según tu % de grasa'; }
    } else if (bmi >= 30) { refW = 27 * (h / 100) ** 2; refNote = 'por IMC alto'; }

    let protKg = +c.protKg > 0 ? +c.protKg : (PROT[goal] || 1.6);
    if (!(+c.protKg > 0)) {
      if (goal === 'perder' && rate === 'rapido') protKg = 2.2;
      if (goal === 'rend' && tr.some(t => t.type === 'fuerza' || t.type === 'hiit')) protKg = 1.8;
      if (+p.diet === 0) protKg += 0.2; // proteínas vegetales: menor digestibilidad
    }
    const P = Math.round(protKg * refW);

    const style = c.style || (goal === 'rend' ? 'alto' : 'equilibrado');
    const fatPct = +c.fatPct > 0 ? +c.fatPct : FATPCT[style];
    const fatMin = Math.max(0.5 * refW, 0.2 * kcal / 9);
    let F = Math.max(fatPct / 100 * kcal / 9, fatMin);
    let C = (kcal - 4 * P - 9 * F) / 4;
    if (C < 80 && style !== 'bajo') { F = fatMin; C = (kcal - 4 * P - 9 * F) / 4; }
    const carbFloor = C < 30;
    if (carbFloor) C = 30;
    F = Math.round(F); C = Math.round(C);

    const fi = Math.min(45, Math.max(male ? 30 : 25, Math.round(14 * kcal / 1000)));
    const water = Math.round(30 * Math.min(w, 100) / 50) * 50;
    const waterTrain = water + Math.round(Math.min(maxSession || 0, 180) * 8.3 / 50) * 50;
    const ea = (kcal - eat) / ffm;
    const weekly = (kcal - tdee) * 7 / 7700;

    return {
      w, h, a, male, bmi, bf, bfKnown, ffm, mifflin, katch, formula, bmr, neatF, eat, hoursWeek, maxSession, tdee,
      goal, rate, adj, limited, floored, manual, kcal, refW, refNote, protKg, p: P, f: F, c: C, style, fatPct,
      fi, water, waterTrain, ea, weekly, carbFloor, kcalReal: 4 * P + 4 * C + 9 * F,
    };
  }

  /* ── Alertas para el entrenador ────────────────────────────────── */
  function warnings(cl, T) {
    const p = cl.profile || {}, W = [], fl = p.medical || [];
    const add = (lv, t) => W.push({ lv, t });
    if (+p.age && +p.age < 18) add('bad', 'Menor de 18 años: no aplicar déficit calórico y trabajar con supervisión de un profesional de la salud.');
    NG.MED.forEach(m => { if (fl.includes(m.id)) add(m.lv, m.w); });
    if (p.medicalText) add('warn', `Condición informada: “${p.medicalText}”. Evaluá si requiere derivación.`);
    if (T.bmi < 18.5 && (T.goal === 'perder' || T.goal === 'recomp')) add('bad', `IMC bajo (${T.bmi.toFixed(1)}): no se recomienda bajar de peso.`);
    if (T.kcal < T.bmr) add('bad', `Las calorías (${T.kcal}) quedan por debajo del metabolismo basal (${Math.round(T.bmr)}). No es recomendable sostenerlo.`);
    if (T.kcal < (T.male ? 1500 : 1200)) add('warn', `Calorías muy bajas para un adulto (${T.kcal} kcal). Difícil cubrir micronutrientes.`);
    if (T.floored && !T.manual) add('info', 'El déficit se limitó para no bajar del metabolismo basal.');
    if (T.limited && !T.manual) add('info', 'El déficit se limitó a un % del gasto para cuidar la masa muscular y la adherencia.');
    if (T.tdee - T.kcal > 1000) add('warn', 'Déficit mayor a 1.000 kcal diarias: alto riesgo de perder masa muscular.');
    if (T.f < 0.5 * T.refW - 1) add('warn', 'Grasas por debajo de 0,5 g/kg: pueden afectar la salud hormonal.');
    if (T.protKg > 3) add('info', 'Proteína mayor a 3 g/kg: no suma beneficios y desplaza otros nutrientes.');
    if (T.eat > 250 && T.ea < 30) add('warn', `Disponibilidad energética baja (${Math.round(T.ea)} kcal/kg de masa magra): riesgo de déficit energético relativo. Considerá un déficit menor.`);
    if (T.carbFloor) add('warn', 'Las calorías no alcanzan para la proteína y grasa indicadas: se forzó un mínimo de carbohidratos. Revisá los valores.');
    const ckg = T.c / T.w;
    if (T.hoursWeek >= 5 && ckg < 3 && T.style !== 'bajo') add('info', `Carbohidratos en ${ckg.toFixed(1)} g/kg con ${Math.round(T.hoursWeek)} h de entrenamiento semanal: podría limitar el rendimiento.`);
    if (T.goal === 'rend' && T.hoursWeek >= 7 && ckg < 5) add('info', 'Para alto volumen de entrenamiento suelen necesitarse 5–7 g/kg de carbohidratos.');
    return W;
  }

  /* ── Comidas ───────────────────────────────────────────────────── */
  function defaultMeals(n) {
    const set = NG.MEAL_SETS[n] || NG.MEAL_SETS[4];
    return set.map(([type, pct, time], i) => ({
      id: uid(), type, pct, time, ctx: 'casa',
      name: type === 'colacion' && i === set.length - 1 && n >= 6 ? 'Colación nocturna' : NG.MEAL_TYPES[type].n,
    }));
  }
  const toH = t => { const [hh, mm] = String(t || '0:0').split(':').map(Number); return (hh || 0) + (mm || 0) / 60; };

  // Marca qué comida queda antes y después del entrenamiento
  function tagTraining(meals, p) {
    meals.forEach(m => { if (m.tag !== 'pre' && m.tag !== 'post') m.tag = 'normal'; });
    const tt = NG.TRAIN_TIME[p.trainTime];
    if (!tt || tt.h == null || !(p.training || []).some(t => +t.days > 0)) return;
    meals.forEach(m => { m.tag = 'normal'; });
    const dur = Math.max(...(p.training || []).map(t => +t.min || 0), 60) / 60;
    let pre = null, post = null;
    meals.forEach(m => {
      const t = toH(m.time), before = tt.h - t, after = t - (tt.h + dur);
      if (before >= 0.75 && before <= 3.5 && (!pre || t > toH(pre.time))) pre = m;
      if (after >= -0.25 && after <= 2.5 && (!post || t < toH(post.time))) post = m;
    });
    if (pre) pre.tag = 'pre';
    if (post && post !== pre) post.tag = 'post';
  }

  // Reparte los macros del día entre las comidas (proteína más pareja, carbohidratos cerca del entreno)
  function distribute(meals, T) {
    const tot = meals.reduce((s, m) => s + (+m.pct || 0), 0) || 1, n = meals.length || 1;
    const norm = a => { const s = a.reduce((x, y) => x + y, 0) || 1; return a.map(x => x / s); };
    const P = norm(meals.map(m => (+m.pct || 0) / tot * 0.5 + (m.type === 'colacion' ? 0.6 : 1) * 0.5 / n));
    const C = norm(meals.map(m => (+m.pct || 0) / tot * (m.tag === 'pre' || m.tag === 'post' ? 1.25 : 1)));
    const F = norm(meals.map(m => (+m.pct || 0) / tot * (m.tag === 'pre' ? 0.5 : m.tag === 'post' ? 0.8 : 1)));
    meals.forEach((m, i) => {
      const p = T.p * P[i], c = T.c * C[i], f = T.f * F[i];
      m.target = { p: r(p), c: r(c), f: r(f), k: r(4 * p + 4 * c + 9 * f) };
    });
    return meals;
  }

  /* ── Ajuste de porciones ───────────────────────────────────────
     Mínimos cuadrados con límites por alimento (descenso por coordenadas),
     con una leve preferencia por las cantidades originales. Después redondea
     a pasos prácticos (5–10 g, unidades enteras o medias). */
  const isFixed = it => it.fix || ['veg', 'libre'].includes((NG.food(it.f) || {}).g);
  function fit(items, tg) {
    const Wt = { k: 2, p: 3, c: 1, f: 1.5 }, LAM = 0.03;
    const T = { k: Math.max(tg.k, 80), p: Math.max(tg.p, 5), c: Math.max(tg.c, 5), f: Math.max(tg.f, 3) };
    const its = items.filter(it => NG.food(it.f)).map(it => ({ f: it.f, g: +it.g || 0, fix: it.fix ? 1 : 0 }));
    const sc = its.filter(it => !isFixed(it));
    sc.forEach(it => {
      const f = NG.food(it.f);
      it.a = { k: f.k / 100, p: f.p / 100, c: f.c / 100, f: f.f / 100 };
      it.b = [f.mn ?? 0, f.mx ?? 400];
      it.g0 = Math.max(it.g, 10);
    });
    const tot = () => {
      const t = { k: 0, p: 0, c: 0, f: 0 };
      its.forEach(it => { const m = mac(it.f, it.g); t.k += m.k; t.p += m.p; t.c += m.c; t.f += m.f; });
      return t;
    };
    const obj = () => {
      const t = tot(); let J = 0;
      for (const m in Wt) J += Wt[m] * ((t[m] - T[m]) / T[m]) ** 2;
      sc.forEach(it => { J += LAM * ((it.g - it.g0) / it.g0) ** 2; });
      return J;
    };
    for (let iter = 0; iter < 80; iter++) {
      sc.forEach(it => {
        const t = tot(); let num = LAM / it.g0, den = LAM / it.g0 ** 2;
        for (const m in Wt) {
          const S = t[m] - it.g * it.a[m];
          num += Wt[m] * (T[m] - S) * it.a[m] / T[m] ** 2;
          den += Wt[m] * it.a[m] ** 2 / T[m] ** 2;
        }
        it.g = Math.min(it.b[1], Math.max(it.b[0], num / den));
      });
    }
    sc.forEach(it => {
      const st = NG.food(it.f).st || 5;
      it.g = Math.min(it.b[1], Math.max(it.b[0], Math.round(it.g / st) * st));
    });
    for (let pass = 0; pass < 6; pass++) {
      let imp = false;
      sc.forEach(it => {
        const st = NG.food(it.f).st || 5, base = obj();
        for (const d of [st, -st]) {
          const old = it.g, ng = old + d;
          if (ng < it.b[0] || ng > it.b[1]) continue;
          it.g = ng;
          if (obj() < base - 1e-9) { imp = true; return; }
          it.g = old;
        }
      });
      if (!imp) break;
    }
    // Un alimento que el ajuste dejó en 0 g no se muestra
    return its.filter(it => it.g > 0 || isFixed(it)).map(it => (it.fix ? { f: it.f, g: r(it.g), fix: 1 } : { f: it.f, g: r(it.g) }));
  }

  /* ── Generador ─────────────────────────────────────────────────── */
  function allowedFood(f, p) {
    if (!f) return false;
    if (f.d > (p.diet ?? 3)) return false;
    const al = (p.allergens || []).concat((p.medical || []).includes('celiaquia') ? ['g'] : []);
    if (al.some(a => f.al.includes(a))) return false;
    if ((p.exclude || []).includes(f.id)) return false;
    if (p.budget === 'bajo' && f.caro) return false;
    return true;
  }
  const comboCook = cb => Math.max(...cb.it.map(([id]) => (NG.food(id) || {}).ck || 0));
  // Nivel de cocina disponible para una comida (−1 = solo comprar hecho)
  function cookLevel(p, ctx) {
    const lv = { cocina: 2, basico: 1, nada: 0 }[p.cooking || 'cocina'];
    if (ctx === 'casa') return lv;
    return p.tupper ? lv : -1;
  }
  const slotOf = m => {
    const k = (m.target || {}).k || 400;
    if (m.type === 'almuerzo' || m.type === 'cena') return ['ac'];
    if (m.type === 'colacion') return k > 380 ? ['sn', 'dm'] : ['sn'];
    return k < 250 ? ['sn', 'dm'] : ['dm'];
  };
  const flexKey = m => (m.type === 'almuerzo' || m.type === 'cena' ? 'ac' : m.type === 'colacion' ? 'sn' : 'dm');

  function seeded(seed) {
    let s = seed >>> 0;
    return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  function pickCombos(m, p, used, rnd, n, exclude) {
    const slots = slotOf(m), lv = cookLevel(p, m.ctx);
    const pool = NG.COMBOS.filter(cb => slots.includes(cb.s) && !(exclude || []).includes(cb.id)
      && cb.it.every(([id]) => allowedFood(NG.food(id), p)) && (cb.buy || comboCook(cb) <= lv));
    const diet = p.diet ?? 3;
    const scored = pool.map(cb => {
      let s = rnd();
      if (!used.has(cb.id)) s += 2;
      if (m.tag === 'pre') s += cb.pre ? 1.5 : -2;
      if (lv >= 0 && !cb.buy) s += 1.5;
      if (lv < 0 && cb.buy) s += 1.5;
      if (cb.lo) s -= 1.5;
      if (cb.s !== slots[0]) s -= 1;
      // Comidas familiares primero: menos fricción para quien nunca hizo una dieta
      if (cb.pop) s += 1;
      if (cb.it.some(([id]) => id === 'pavo')) s -= 1;
      // Presupuesto: lo caro solo se prioriza con presupuesto holgado; lo económico, con presupuesto ajustado
      const caro = cb.it.some(([id]) => (NG.food(id) || {}).caro);
      if (caro) s += p.budget === 'alto' ? 1 : -1;
      if (cb.eco && p.budget === 'bajo') s += 1;
      // Preferir comidas típicas de la dieta de la persona (ej.: a un omnívoro no le priorizo tofu)
      const cd = Math.max(...cb.it.map(([id]) => (NG.food(id) || {}).d || 0));
      if (cd === 0) s -= [0, 0.5, 1.5, 2.2][diet] || 0;
      // Premiar comidas cuya proporción de proteína se acerca a la que pide el objetivo
      const t = m.target || { p: 30, k: 500 }, d0 = sum(cb.it.map(([f, g]) => ({ f, g })));
      if (d0.k > 0 && t.k > 0) s += 2 * Math.min(1, (d0.p / d0.k) / (t.p / t.k || 1));
      return { cb, s };
    }).sort((a, b) => b.s - a.s);
    // Platos de la misma familia (ej.: café con leche + tostado) no se repiten en una misma comida
    const out = [], mains = new Set(), fams = new Set(), fresh = cb => !cb.fam || !fams.has(cb.fam), take = cb => { out.push(cb); if (cb.fam) fams.add(cb.fam); };
    for (const { cb } of scored) { if (out.length >= n) break; if (!mains.has(cb.it[0][0]) && fresh(cb)) { take(cb); mains.add(cb.it[0][0]); } }
    for (const { cb } of scored) { if (out.length >= n) break; if (!out.includes(cb) && fresh(cb)) take(cb); }
    return out;
  }

  // Complementos para cuando una comida modelo no alcanza el objetivo (planes con muchas calorías)
  const COMPLEMENTS = {
    c: { dm: ['banana', 'manzana', 'panint', 'avena', 'tostarroz', 'datiles'], ac: ['pan', 'panint', 'banana', 'manzana', 'naranja'] },
    p: { dm: ['quesoblanco', 'jamon', 'huevo', 'yogriego', 'yogdeslac', 'whey', 'bebsoja', 'protveg', 'tofu'], ac: ['huevo', 'atun', 'jamon', 'yogriego', 'yogdeslac', 'tofu', 'protveg'] },
    f: { dm: ['almendras', 'mani', 'nueces', 'palta', 'pastamani'], ac: ['aceite', 'palta', 'aceitunas', 'almendras'] },
  };
  function fitSmart(items, m, p) {
    let its = fit(items, m.target);
    const lv = Math.max(0, cookLevel(p, m.ctx)), slot = flexKey(m) === 'ac' ? 'ac' : 'dm';
    for (let round = 0; round < 3; round++) {
      const t = sum(its), T = m.target;
      const gap = { p: T.p - t.p, c: T.c - t.c, f: T.f - t.f };
      if (T.k - t.k < T.k * 0.08 && gap.p < 8) break;
      const need = gap.p >= 8 ? 'p' : gap.c >= gap.f * 2.25 ? 'c' : 'f';
      const BREAD = ['pan', 'panint', 'panlactal', 'panmm'];
      // Desayunos con pan o galletitas se completan con queso o jamón; los de yogur o leche, con yogur o proteína
      let cands = COMPLEMENTS[need][slot];
      if (need === 'p' && slot === 'dm' && !its.some(it => BREAD.includes(it.f) || it.f === 'galletas' || it.f === 'tostarroz'))
        cands = ['yogriego', 'yogdeslac', 'whey', 'bebsoja', 'protveg', 'quesoblanco', 'jamon', 'huevo', 'tofu'];
      const id = cands.find(x => {
        const f = NG.food(x);
        if (BREAD.includes(x) && its.some(it => BREAD.includes(it.f))) return false; // nunca dos panes distintos
        return f && f.ck <= lv && !its.some(it => it.f === x) && allowedFood(f, p);
      });
      if (!id) break;
      const f = NG.food(id);
      its = fit(its.concat({ f: id, g: f.uf && f.ug ? f.ug : Math.max(f.mn || 0, f.g === 'grasa' ? 10 : 100) }), T);
    }
    return its;
  }
  const SHORT = {
    banana: 'banana', manzana: 'manzana', naranja: 'naranja', datiles: 'dátiles', panint: 'pan integral', pan: 'pan', avena: 'avena',
    tostarroz: 'tostadas de arroz', yogriego: 'yogur griego', yogdeslac: 'yogur deslactosado', pavo: 'pavo', whey: 'proteína en polvo',
    quesoblanco: 'queso blanco', jamon: 'jamón',
    bebsoja: 'bebida de soja', protveg: 'proteína vegetal', tofu: 'tofu', atun: 'atún', almendras: 'almendras', mani: 'maní',
    nueces: 'nueces', palta: 'palta', pastamani: 'pasta de maní', aceite: 'aceite', aceitunas: 'aceitunas', huevo: 'huevo',
  };
  function comboToOption(cb, m, p) {
    const items = fitSmart(cb.it.map(([f, g, fix]) => ({ f, g, fix })), m, p || {});
    const added = items.filter(it => !cb.it.some(([f]) => f === it.f)).map(it => SHORT[it.f] || NG.food(it.f).n.toLowerCase());
    const list = added.length > 1 ? added.slice(0, -1).join(', ') + ' y ' + added.at(-1) : added[0];
    return { id: uid(), name: cb.n + (list ? ' + ' + list : ''), type: 'exact', buy: cb.buy ? 1 : 0, src: cb.id, items };
  }
  const flexOption = m => ({ id: uid(), name: 'Comer afuera / comedor', type: 'flex', text: NG.FLEX[flexKey(m)] });

  function buildOptions(m, p, used, rnd, n = 3) {
    const lv = cookLevel(p, m.ctx), opts = [];
    pickCombos(m, p, used, rnd, n).forEach(cb => { used.add(cb.id); opts.push(comboToOption(cb, m, p)); });
    if (!opts.length) opts.push(flexOption(m));
    return opts;
  }

  function genPlan(cl, seed) {
    const p = cl.profile || {}, T = targets(cl);
    const src = p.meals && p.meals.length ? p.meals : defaultMeals(4);
    const meals = src.map(m => ({
      id: m.id || uid(), type: m.type || 'almuerzo', name: m.name || NG.MEAL_TYPES[m.type || 'almuerzo'].n,
      time: m.time || '13:00', pct: +m.pct || 20, ctx: m.ctx || 'casa', tag: 'normal', note: '', options: [],
    }));
    tagTraining(meals, p);
    distribute(meals, T);
    const used = new Set(), rnd = seeded(hashStr((cl.id || '') + (seed || '')));
    meals.forEach(m => { m.options = buildOptions(m, p, used, rnd); });
    return meals;
  }

  // Una opción automática nueva para una comida, distinta de las que ya tiene
  function anotherOption(m, p) {
    const have = (m.options || []).map(o => o.src).filter(Boolean);
    const cb = pickCombos(m, p, new Set(have), seeded(Date.now()), 1, have)[0];
    return cb ? comboToOption(cb, m, p) : null;
  }


  /* ── Equivalencias: mismo grupo, igualando el macro principal ──── */
  function exchanges(id, g, rules) {
    const f0 = NG.food(id); if (!f0) return [];
    const key = (NG.GRUPOS[f0.g] || {}).m || 'k', base = mac(id, g), out = [];
    const powder = x => x.id === 'whey' || x.id === 'protveg';
    Object.values(NG.allFoods()).forEach(f => {
      if (f.id === id || f.g !== f0.g || powder(f) !== powder(f0) || !allowedFood(f, rules || {})) return;
      let ng;
      if (key === 'g') ng = g;
      else { const per = f[key] / 100; if (per <= 0.005) return; ng = base[key] / per; }
      const st = f.st || 5;
      ng = Math.max(st, Math.round(ng / st) * st);
      if (ng > (f.mx || 400) * 1.3) return;
      out.push({ f: f.id, g: ng, m: mac(f.id, ng) });
    });
    out.sort((a, b) => Math.abs(a.m.k - base.k) - Math.abs(b.m.k - base.k));
    return out;
  }

  /* ── Recomendaciones personalizadas ────────────────────────────── */
  function recs(cl, T) {
    const p = cl.profile || {}, R = [], med = p.medical || [];
    const add = (id, e, t, x, on = true) => R.push({ id, e, t, x, on });
    const tr = (p.training || []).filter(t => +t.days > 0);
    const trains = tr.length > 0, strength = tr.some(t => ['fuerza', 'hiit', 'deporte'].includes(t.type));
    const meals = (cl.plan && cl.plan.meals) || [];
    const nMeals = meals.length || 4;
    const L = v => (v / 1000).toFixed(1).replace('.', ',');
    const outside = meals.some(m => m.ctx !== 'casa') || p.cooking !== 'cocina';
    const noFish = +p.diet <= 1 || (p.allergens || []).includes('p') || ['merluza', 'salmon', 'atun'].every(x => (p.exclude || []).includes(x));

    add('agua', '💧', 'Hidratación', `Tomá alrededor de ${L(T.water)} L de agua por día (${Math.round(T.water / 250)} vasos)${trains ? `; los días de entrenamiento, unos ${L(T.waterTrain)} L` : ''}. Una orina amarillo clara es buena señal.`);
    add('prot', '🍗', 'Proteína en cada comida', `Tu objetivo es ~${T.p} g de proteína por día. Repartila entre tus comidas (≈ ${Math.round(T.p / nMeals)} g en cada una): ayuda a cuidar el músculo y a controlar el hambre.`);
    add('veg', '🥦', 'Verduras y frutas todos los días', 'Llená la mitad del plato con verduras en almuerzo y cena, y sumá 2 a 3 frutas por día.');
    add('fibra', '🌾', 'Fibra', `Apuntá a ~${T.fi} g de fibra por día con verduras, frutas, legumbres, avena e integrales. Si hoy comés poca, aumentala de a poco y con agua.`);
    add('sueno', '😴', 'Dormí 7 a 9 horas', 'Dormir poco aumenta el hambre y las ganas de dulce, y empeora la recuperación. Mantené horarios regulares.');
    if (['perder', 'ganar', 'recomp'].includes(T.goal) && !med.includes('tca'))
      add('pesaje', '⚖️', 'Cómo pesarte', 'En ayunas, después de ir al baño y con poca ropa, al menos 3 veces por semana. Lo que importa es el promedio semanal, no el número de un día.');
    if (T.goal === 'perder' || T.goal === 'recomp') {
      const pasos = { sed: '7.000', lig: '8.000' }[p.activity] || '10.000';
      add('pasos', '🚶', 'Movete más en el día', `Además de entrenar, sumá pasos: apuntá a ${pasos} o más por día. Caminar es de lo que más suma al gasto diario.`);
      add('hambre', '🍎', 'Para controlar el hambre', 'Priorizá proteína, verduras y fibra, tomá agua y elegí alimentos que haya que masticar. Café, té o mate sin azúcar también ayudan.');
    }
    if (T.goal === 'ganar') add('densos', '🥜', 'Si te cuesta llegar a las calorías', 'Sumá alimentos densos: frutos secos, pasta de maní, avena, aceite de oliva o licuados. Hacé todas tus comidas, sin saltear.');
    add('flex', '🎯', 'Constancia antes que perfección', 'Si cumplís el plan la mayor parte del tiempo (80–90%) vas a ver resultados. Una comida fuera del plan no arruina nada: seguí con la siguiente.');
    const fr = cl.plan && cl.plan.free != null ? +cl.plan.free : 1;
    if (fr > 0) add('libre', '🍕', fr === 1 ? 'Tu comida libre de la semana' : `Tus ${fr} comidas libres de la semana`, `Tenés ${fr === 1 ? 'una comida libre' : fr + ' comidas libres'} por semana. Elegí el momento y disfrutala sin culpa. No se acumula de una semana a otra.`);
    if (outside) add('planif', '🗓️', 'Planificá las comidas de afuera', 'Antes de salir, decidí qué y dónde vas a comer. Usá la sección «Afuera» para elegir bien en cualquier lugar.');
    if (p.cooking === 'cocina' && p.tupper) add('prep', '🥡', 'Cociná una vez, comé varias', 'Dedicá 1 o 2 momentos por semana a cocinar proteínas y carbohidratos en cantidad. En heladera duran 3 a 4 días; el resto, al freezer.');
    if (p.cooking !== 'cocina') add('etiq', '🏷️', 'Leé las etiquetas', 'Menos sellos negros = mejor elección. Mirá la porción y cuánta proteína y azúcar aporta.');
    if (trains) {
      add('pre', '⚡', 'Antes de entrenar', 'Comé 1 a 3 horas antes: carbohidratos y algo de proteína, con poca grasa y fibra para no sentirte pesado.');
      add('post', '💪', 'Después de entrenar', 'En las 2 horas siguientes, hacé una comida con 20 a 40 g de proteína y carbohidratos para recuperarte.');
    }
    if (T.maxSession >= 90 && tr.some(t => ['cardio', 'deporte', 'hiit'].includes(t.type)))
      add('intra', '🏃', 'Sesiones largas', 'En entrenamientos de más de 90 minutos sumá 30 a 60 g de carbohidratos por hora (bebida deportiva, banana o dátiles) e hidratate con sales.');
    if (med.includes('cardio')) add('sodio', '🧂', 'Sal con moderación', 'Cociná con poca sal, usá especias y hierbas, y limitá fiambres y ultraprocesados con sello «Exceso en sodio».');
    if (med.includes('glp1')) add('glp1', '💉', 'Con medicación para el apetito', 'Priorizá la proteína en cada comida, hacé porciones chicas, hidratate bien y seguí las indicaciones de tu médico.');
    // Suplementos con mayor respaldo
    const adult = !(+p.age) || +p.age >= 18;
    if (strength && adult && !med.includes('renal') && !med.includes('embarazo'))
      add('creatina', '💊', 'Creatina monohidrato', 'Es el suplemento con más respaldo para fuerza y masa muscular: 3 a 5 g por día, todos los días, con cualquier comida. No hace falta hacer carga. Si tenés alguna condición médica, consultá antes con tu médico.');
    if (trains && adult && !med.includes('embarazo') && !med.includes('cardio'))
      add('cafeina', '☕', 'Café antes de entrenar (opcional)', 'Un café 30 a 60 minutos antes de entrenar puede mejorar el rendimiento. Evitalo después de las 17 h para no afectar el sueño.', false);
    if (+p.diet >= 1) add('whey', '🥤', 'Proteína en polvo (opcional)', 'Es un alimento práctico, no mágico: sirve para llegar a tu proteína cuando no tenés tiempo de cocinar.', p.cooking !== 'cocina');
    if (+p.diet === 0) add('b12', '💊', 'Vitamina B12 (imprescindible)', 'En una alimentación vegana es indispensable suplementar vitamina B12. Consultá la dosis con tu médico y controlala en tus análisis.');
    if (noFish) add('omega', '🌰', 'Omega-3', `Sumá todos los días nueces, chía o lino. Consultá con tu médico si te conviene un suplemento de omega-3${+p.diet === 0 ? ' (de algas)' : ''}.`);
    else add('pescado', '🐟', 'Pescado 2 veces por semana', 'Ideal pescados grasos como salmón, caballa o sardinas: aportan omega-3.');
    if (!T.male && +p.diet <= 1) add('hierro', '🥬', 'Hierro', 'Combiná legumbres y verduras de hoja con vitamina C (cítricos, morrón, kiwi). Evitá té, café o mate pegados a las comidas principales.');
    add('analisis', '🩸', 'Chequeo anual', 'Hacete un análisis de sangre al menos una vez al año (hierro, vitamina D, B12, glucemia, colesterol) y mostráselo a tu médico.');
    return R;
  }
  // Recomendaciones activas según lo que eligió el entrenador
  function activeRecs(cl, T) {
    const st = (cl.plan && cl.plan.recState) || {};
    const list = recs(cl, T).filter(x => (x.id in st ? st[x.id] : x.on));
    ((cl.plan && cl.plan.customRecs) || []).forEach(c => { if (c.t || c.x) list.push({ id: c.id, e: c.e || '⭐', t: c.t, x: c.x, on: true }); });
    return list;
  }

  /* ── Arranque por fases ────────────────────────────────────────── */
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  // Semana 1–2 → Base · 3–4 → Plan completo · 5 en adelante → Autonomía
  // Semana del plan (1, 2, 3…) contando desde el día que se envió el primer link
  function weekOf(start, today) {
    if (!start) return null;
    const days = Math.floor((Date.parse(today || todayKey()) - Date.parse(start)) / 864e5);
    return Math.floor(Math.max(0, days) / 7) + 1;
  }
  function phaseOf(start, today) {
    const week = weekOf(start, today); if (!week) return null;
    const idx = week <= 2 ? 0 : week <= 4 ? 1 : 2;
    return { idx, week, ph: NG.PHASES[idx], inPhase: idx === 2 ? week - 4 : week - idx * 2 };
  }
  // Fotos de progreso: al inicio y cada 4 semanas (semanas 4, 8, 12…)
  const photoDue = (start, today) => { const w = weekOf(start, today); return !!w && w % 4 === 0; };

  /* ── Análisis de check-ins ─────────────────────────────────────── */
  function analyze(cl, T) {
    const ck = (cl.checkins || []).filter(c => +c.avg > 0).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (ck.length < 2) return { ok: false, msg: 'Con 2 check-ins semanales o más vas a ver la tendencia y una sugerencia de ajuste.' };
    const last = ck[ck.length - 1], prev = ck[ck.length - 2];
    const days = Math.max(3, (new Date(last.date) - new Date(prev.date)) / 864e5);
    const rate = (last.avg - prev.avg) / prev.avg * 100 / (days / 7);
    const adh = +last.adh || 0, goal = T.goal;
    const fmt = x => (x > 0 ? '+' : '') + x.toFixed(2).replace('.', ',');
    let tone = 'ok', msg = 'Va en línea con el objetivo: mantené el plan.', delta = 0;
    const lowAdh = adh && adh < 80;
    if (goal === 'perder') {
      if (rate > -0.25) { tone = 'warn'; if (lowAdh) msg = `Bajó poco, pero la adherencia fue ${adh}%: primero trabajá en cumplir el plan.`; else { msg = 'Pérdida más lenta de lo esperado: bajá ~150 kcal (sobre todo de carbohidratos o grasas) o sumá ~2.000 pasos diarios.'; delta = -150; } }
      else if (rate < -1.2) { tone = 'warn'; msg = 'Está bajando muy rápido: subí ~150 kcal para cuidar la masa muscular y la energía.'; delta = 150; }
    } else if (goal === 'ganar') {
      if (rate < 0.1) { tone = 'warn'; if (lowAdh) msg = `Casi no subió, con adherencia de ${adh}%: primero asegurá cumplir el plan.`; else { msg = 'Está subiendo muy poco: sumá ~150 kcal (carbohidratos o grasas).'; delta = 150; } }
      else if (rate > 0.6) { tone = 'warn'; msg = 'Está subiendo rápido (probablemente acumulando grasa): bajá ~100 kcal.'; delta = -100; }
    } else if (goal === 'recomp') {
      if (rate < -0.75) { tone = 'warn'; msg = 'Para recomposición está bajando rápido: subí ~100 kcal.'; delta = 100; }
      else if (rate > 0.3) { tone = 'warn'; msg = 'Está subiendo de peso: bajá ~100 kcal y mirá la cintura.'; delta = -100; }
      else msg = 'Peso estable: en recomposición mirá cintura, fotos y fuerza, no solo la balanza.';
    } else {
      if (rate < -0.35) { tone = 'warn'; msg = 'Está bajando de peso: subí ~100 kcal para mantener.'; delta = 100; }
      else if (rate > 0.35) { tone = 'warn'; msg = 'Está subiendo de peso: bajá ~100 kcal para mantener.'; delta = -100; }
    }
    // En la fase de base no se tocan las calorías: el peso de las primeras semanas todavía no es confiable
    const P = cl.plan || {}, ph = P.phases !== false ? phaseOf(P.start) : null;
    if (ph && ph.idx === 0) {
      tone = 'ok'; delta = 0;
      msg = `Fase 1 (base): todavía no ajustes calorías. Mirá la adherencia${adh ? ` (${adh}%, la meta de esta fase es ${NG.PHASES[0].goal}%)` : ''} y los hábitos; el primer ajuste se evalúa desde la semana 3.`;
    }
    return { ok: true, rate, rateTxt: fmt(rate) + '% por semana', adh, tone, msg, delta, last, prev };
  }

  NG.E = {
    r, uid, mac, sum, targets, warnings, defaultMeals, tagTraining, distribute, fit, isFixed,
    allowedFood, cookLevel, genPlan, buildOptions, anotherOption, flexOption, exchanges, recs, activeRecs, analyze, toH, phaseOf, weekOf, photoDue,
  };
})(window.NG);
