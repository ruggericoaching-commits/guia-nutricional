/* Formulario inicial para nuevos asesorados (se envía al entrenador por WhatsApp con un código). */
(function (NG) {
  const U = NG.UI, S = NG.S, E = NG.E;
  const { esc, ic } = U;
  const KD = 'ng_form_draft';
  let st = null, root = null;

  const blank = () => ({
    name: '', phone: '', sex: '', age: '', height: '', weight: '', bf: '', waist: '',
    goal: '', targetWeight: '', motivation: '',
    activity: '', training: [{ type: 'fuerza', days: 3, min: 60 }], noTrain: false, trainTime: '',
    nMeals: 4, meals: E.defaultMeals(4), cooking: '', tupper: true, micro: true,
    diet: 3, allergens: [], dislikeTags: [], dislikes: '', likes: '', budget: 'medio', alcohol: 'ocasional', supplements: '',
    medical: [], medicalText: '', meds: '', sleep: 7, stress: 3, ok: false,
    planType: 'online', experience: '', equipment: '', injuries: '', lifts: '', goal2: '', occupation: '', instagram: '',
  });

  async function mount(code) {
    root = document.getElementById('app');
    let co = {};
    if (code) { try { co = await S.unpack(code); } catch (e) { co = {}; } }
    const draft = S.read(KD);
    st = { co, step: draft && draft.step ? draft.step : 0, p: Object.assign(blank(), draft && draft.p), sent: false };
    NG.handlers = { click, change, input: () => {} };
    document.title = 'Formulario inicial' + (co.b ? ' · ' + co.b : '');
    render();
  }
  const saveDraft = () => S.write(KD, { step: st.step, p: st.p });
  function setPath(o, path, v) { const k = path.split('.'); let x = o; for (let i = 0; i < k.length - 1; i++) x = x[k[i]]; x[k[k.length - 1]] = v; }

  const STEPS = ['Inicio', 'Sobre vos', 'Objetivo', 'Actividad', 'Entrenamiento', 'Comidas', 'Alimentación', 'Salud', 'Enviar'];
  const fld = (label, inner, hint) => `<label class="fld"><span>${label}</span>${inner}${hint ? `<small class="mut">${hint}</small>` : ''}</label>`;
  const inp = (f, o = {}) => `<input data-f="${f}" data-k="f-${f}" ${o.num ? 'type="text" inputmode="decimal" autocomplete="off"' : `type="${o.type || 'text'}"`} value="${esc(o.v != null ? o.v : getv(f))}" placeholder="${esc(o.ph || '')}" ${o.num ? 'data-num="1"' : ''}>`;
  const getv = f => f.split('.').reduce((x, k) => (x == null ? '' : x[k]), st.p);
  const chips = (f, opts, multi) => `<div class="chips">${opts.map(([v, n]) => {
    const cur = getv(f), on = multi ? (cur || []).includes(v) : String(cur) === String(v);
    return `<button class="chip ${on ? 'on' : ''}" data-a="${multi ? 'tog' : 'set'}" data-f="${f}" data-v="${esc(v)}">${n}</button>`;
  }).join('')}</div>`;

  function step() {
    const p = st.p, co = st.co;
    switch (st.step) {
      case 0: return `<div class="intro"><span class="eyebrow">Formulario inicial · 5 min</span><h1>Armemos tu plan</h1>
        <p class="mut">Completá lo que sepas.</p></div>`;
      case 1: return `<h2>Sobre vos</h2>
        ${fld('Nombre y apellido *', inp('name', { ph: 'Ej: Juan Pérez' }))}
        <div class="grid2">${fld('WhatsApp', inp('phone', { type: 'tel', ph: 'Ej: 11 2345 6789' }))}${fld('Instagram', inp('instagram', { ph: '@usuario (opcional)' }))}</div>
        ${fld('Sexo biológico *', chips('sex', [['M', 'Masculino'], ['F', 'Femenino']]))}
        <div class="grid3">${fld('Edad *', inp('age', { num: 1, ph: 'años' }))}${fld('Altura *', inp('height', { num: 1, ph: 'cm' }))}${fld('Peso *', inp('weight', { num: 1, ph: 'kg' }))}</div>
        <div class="grid2">${fld('% de grasa', inp('bf', { num: 1, ph: 'opcional' }), 'Solo si te lo midieron')}${fld('Cintura', inp('waist', { num: 1, ph: 'cm (opcional)' }))}</div>`;
      case 2: return `<h2>¿Cuál es tu objetivo?</h2>
        <div class="opts">${Object.entries(NG.GOALS).map(([k, g]) => `<button class="opt ${p.goal === k ? 'on' : ''}" data-a="set" data-f="goal" data-v="${k}"><span>${g.e}</span><b>${g.n}</b>${g.d ? `<small>${g.d}</small>` : ''}</button>`).join('')}</div>
        ${fld('Peso que te gustaría alcanzar', inp('targetWeight', { num: 1, ph: 'kg (opcional)' }))}
        ${fld('¿Por qué es importante para vos?', `<textarea data-f="motivation" data-k="f-motivation" rows="2" placeholder="Opcional">${esc(p.motivation)}</textarea>`)}`;
      case 3: return `<h2>Tu actividad</h2>
        ${fld('Sin contar el entrenamiento, en el día sos… *', `<div class="opts">${Object.entries(NG.ACTIVITY).map(([k, a]) => `<button class="opt sm ${p.activity === k ? 'on' : ''}" data-a="set" data-f="activity" data-v="${k}"><b>${a.n}</b><small>${a.d}</small></button>`).join('')}</div>`)}
        <h3>Entrenamiento</h3>
        <button class="chip ${p.noTrain ? 'on' : ''}" data-a="notrain">Por ahora no entreno</button>
        ${p.noTrain ? '' : `${p.training.map((t, i) => `<div class="card trow"><div class="grid3">
            ${fld('Tipo', `<select data-f="training.${i}.type" data-k="f-tt${i}">${Object.entries(NG.TRAIN).map(([k, n]) => `<option value="${k}" ${t.type === k ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
            ${fld('Días/semana', inp(`training.${i}.days`, { num: 1 }))}${fld('Minutos', inp(`training.${i}.min`, { num: 1 }))}</div>
            ${p.training.length > 1 ? `<button class="link sm danger-t" data-a="trdel" data-i="${i}">Quitar</button>` : ''}</div>`).join('')}
          ${p.training.length < 3 ? `<button class="btn ghost sm" data-a="tradd">${ic('plus', 15)} Agregar otro tipo de entrenamiento</button>` : ''}
          ${fld('¿A qué hora entrenás normalmente?', chips('trainTime', Object.entries(NG.TRAIN_TIME).map(([k, t]) => [k, t.n])))}`}`;
      case 4: return `<h2>Tu entrenamiento</h2>
        ${fld('Tipo de plan', chips('planType', Object.entries(NG.PLAN_TYPES)))}
        ${fld('Experiencia entrenando con cargas *', chips('experience', Object.entries(NG.EXPERIENCE)))}
        ${fld('¿Dónde entrenás? *', chips('equipment', Object.entries(NG.EQUIPMENT)))}
        ${fld('Lesiones, cirugías o molestias', `<textarea data-f="injuries" data-k="f-inj" rows="2" placeholder="Si no tenés, dejalo vacío">${esc(p.injuries)}</textarea>`)}
        ${fld('Pesos que movés más o menos', `<textarea data-f="lifts" data-k="f-lifts" rows="2" placeholder="Opcional. Ej: sentadilla 60 kg x 8, press banca 40 kg x 10">${esc(p.lifts)}</textarea>`)}
        ${fld('Ocupación y horarios de trabajo', inp('occupation', { ph: 'Ej: vendedor, de 9 a 18' }))}
        ${fld('Otros objetivos y plazos', `<textarea data-f="goal2" data-k="f-goal2" rows="2" placeholder="Opcional">${esc(p.goal2)}</textarea>`)}`;
      case 5: return `<h2>Tu rutina de comidas</h2>
        ${fld('¿Cuántas comidas por día? *', chips('nMeals', [2, 3, 4, 5, 6].map(n => [n, String(n)])))}
        <p class="sm mut">Horario y dónde la hacés:</p>
        <div class="mrows">${p.meals.map((m, i) => `<div class="mrow2"><b>${NG.MEAL_TYPES[m.type].e} ${esc(m.name)}</b>
          <span class="tstep"><button data-a="tstep" data-i="${i}" data-d="-15" aria-label="15 minutos antes">−</button><span>${esc(m.time)}</span><button data-a="tstep" data-i="${i}" data-d="15" aria-label="15 minutos después">+</button></span>
          <span class="seg">${Object.keys(NG.CTX).map(k => `<button class="${m.ctx === k ? 'on' : ''}" data-a="set" data-f="meals.${i}.ctx" data-v="${k}">${{ casa: 'Casa', trabajo: 'Trabajo', afuera: 'Afuera' }[k]}</button>`).join('')}</span></div>`).join('')}</div>
        ${fld('¿Podés cocinar o prepararte la comida? *', `<div class="opts">${Object.entries(NG.COOKING).map(([k, n]) => `<button class="opt sm ${p.cooking === k ? 'on' : ''}" data-a="set" data-f="cooking" data-v="${k}"><b>${n}</b></button>`).join('')}</div>`)}
        ${p.meals.some(m => m.ctx !== 'casa') ? `${fld('¿Podés llevar vianda?', chips('tupper', [[true, 'Sí'], [false, 'No']]))}
          ${fld('¿Tenés heladera y microondas donde comés?', chips('micro', [[true, 'Sí'], [false, 'No']]))}` : ''}`;
      case 6: return `<h2>Tu alimentación</h2>
        ${fld('Tipo de alimentación *', chips('diet', [3, 2, 1, 0].map(k => [k, NG.DIETAS[k]])))}
        ${fld('Alergias o intolerancias', chips('allergens', Object.entries(NG.ALG), true))}
        ${fld('Alimentos que NO te gustan', chips('dislikeTags', Object.keys(NG.DISLIKES).map(k => [k, k]), true))}
        ${fld('Otros que no te gustan', `<textarea data-f="dislikes" data-k="f-dis" rows="2" placeholder="Ej: berenjena, hígado">${esc(p.dislikes)}</textarea>`)}
        ${fld('Comidas que te encantan', `<textarea data-f="likes" data-k="f-likes" rows="2" placeholder="Así las incluimos en tu plan">${esc(p.likes)}</textarea>`)}
        ${fld('Presupuesto para comida', chips('budget', Object.entries(NG.BUDGET)))}
        ${fld('Alcohol', chips('alcohol', Object.entries(NG.ALCOHOL)))}
        ${fld('¿Tomás algún suplemento?', inp('supplements', { ph: 'Ej: proteína, creatina, vitaminas' }))}`;
      case 7: return `<h2>Tu salud</h2>
        <p class="sm mut">Marcá lo que corresponda:</p>
        <div class="checks">${NG.MED.map(m => `<button class="chk ${p.medical.includes(m.id) ? 'on' : ''}" data-a="tog" data-f="medical" data-v="${m.id}"><span class="tck">${p.medical.includes(m.id) ? ic('check', 14) : ''}</span>${esc(m.n)}</button>`).join('')}</div>
        ${fld('Otra condición o aclaración', inp('medicalText', { ph: 'Opcional' }))}
        ${fld('Medicación que tomás', inp('meds', { ph: 'Opcional' }))}
        <div class="grid2">${fld('Horas de sueño promedio', inp('sleep', { num: 1 }))}${fld('Estrés (1 bajo – 5 alto)', chips('stress', [1, 2, 3, 4, 5].map(n => [n, String(n)])))}</div>`;
      case 8: {
        const g = NG.GOALS[p.goal] || {};
        return `<h2>¡Último paso!</h2>
          <div class="card summ"><b>${esc(p.name)}</b><span>${p.sex === 'F' ? 'Mujer' : 'Hombre'} · ${esc(p.age)} años · ${esc(p.height)} cm · ${esc(p.weight)} kg</span>
          <span>${g.e || ''} ${g.n || ''}</span><span>🏋️ ${[NG.EXPERIENCE[p.experience], NG.EQUIPMENT[p.equipment]].filter(Boolean).join(' · ')}</span><span>🍽️ ${p.nMeals} comidas · ${NG.COOKING[p.cooking] || ''}</span><span>🥗 ${NG.DIETAS[p.diet]}${p.allergens.length ? ' · Sin ' + p.allergens.map(a => NG.ALG[a]).join(', ') : ''}</span>
          ${p.medical.length ? `<span>🩺 ${p.medical.map(id => (NG.MED.find(m => m.id === id) || {}).n).join(', ')}</span>` : ''}</div>
          <button class="chk ${p.ok ? 'on' : ''}" data-a="okt"><span class="tck">${p.ok ? ic('check', 14) : ''}</span>Confirmo que los datos son correctos y entiendo que esta guía no reemplaza la consulta médica.</button>
          ${st.sent ? `<div class="card ok">✅ ¡Listo! Si no se abrió WhatsApp, tocá «Copiar» y mandáselo.</div>` : ''}
          <div class="stack">${st.co.w ? `<button class="btn wa block big" data-a="send">${ic('chat')} Enviar por WhatsApp</button>` : ''}
          <button class="btn ${st.co.w ? 'ghost' : 'pri big'} block" data-a="copy">${ic('copy')} Copiar respuestas</button></div>`;
      }
    }
    return '';
  }

  function render() {
    const pct = st.step / (STEPS.length - 1) * 100;
    U.paint(root, `<div class="wrap narrow form">
      <div class="fhead"><span class="brand">${esc(st.co.b || st.co.n || 'Guía nutricional')}</span><span class="mut sm">${st.step ? `Paso ${st.step} de ${STEPS.length - 1}` : ''}</span></div>
      <div class="prog"><i style="width:${pct}%"></i></div>
      <div class="fbody">${step()}</div>
      <div class="fnav">${st.step ? `<button class="btn ghost" data-a="prev">${ic('chevL')} Atrás</button>` : '<span></span>'}
        ${st.step < STEPS.length - 1 ? `<button class="btn pri" data-a="next">${st.step ? 'Siguiente' : 'Empezar'} ${ic('chevR')}</button>` : ''}</div>
    </div>`);
  }

  function validate() {
    const p = st.p, miss = [];
    if (st.step === 1) {
      if (!p.name.trim()) miss.push('nombre');
      if (!p.sex) miss.push('sexo');
      if (!(+p.age >= 12 && +p.age <= 100)) miss.push('edad');
      if (!(+p.height >= 120 && +p.height <= 230)) miss.push('altura en cm');
      if (!(+p.weight >= 30 && +p.weight <= 300)) miss.push('peso en kg');
    }
    if (st.step === 2 && !p.goal) miss.push('objetivo');
    if (st.step === 3 && !p.activity) miss.push('nivel de actividad');
    if (st.step === 4 && !p.experience) miss.push('tu experiencia');
    if (st.step === 4 && !p.equipment) miss.push('dónde entrenás');
    if (st.step === 5 && !p.cooking) miss.push('si podés cocinar');
    if (miss.length) { U.toast('Completá: ' + miss.join(', ')); return false; }
    return true;
  }

  function profileOut() {
    const p = st.p;
    const exclude = [].concat(...p.dislikeTags.map(t => NG.DISLIKES[t] || []));
    return {
      name: p.name.trim(), phone: p.phone, sex: p.sex, age: +p.age, height: +p.height, weight: +p.weight, bf: +p.bf || '', waist: +p.waist || '',
      goal: p.goal, rate: 'moderado', targetWeight: +p.targetWeight || '', motivation: p.motivation,
      activity: p.activity, training: p.noTrain ? [] : p.training.map(t => ({ type: t.type, days: +t.days || 0, min: +t.min || 0 })), trainTime: p.trainTime,
      meals: p.meals, cooking: p.cooking, tupper: !!p.tupper, micro: !!p.micro,
      diet: +p.diet, allergens: p.allergens.concat(p.medical.includes('celiaquia') && !p.allergens.includes('g') ? ['g'] : []), exclude, dislikes: [p.dislikeTags.join(', '), p.dislikes].filter(Boolean).join(' · '), likes: p.likes,
      budget: p.budget, alcohol: p.alcohol, supplements: p.supplements,
      medical: p.medical, medicalText: [p.medicalText, p.meds ? 'Medicación: ' + p.meds : ''].filter(Boolean).join(' · '), sleep: +p.sleep || '', stress: +p.stress || '',
      planType: p.planType, experience: p.experience, equipment: p.equipment, injuries: p.injuries, lifts: p.lifts, goal2: p.goal2,
      occupation: p.occupation, instagram: p.instagram,
    };
  }
  async function message() {
    const pr = profileOut(), g = NG.GOALS[pr.goal] || {};
    const code = await S.pack({ v: 1, t: 'frm', ts: Date.now(), p: pr });
    return [
      `📝 *Formulario inicial* – ${pr.name}`,
      `${g.e || ''} Objetivo: ${g.n || '-'}`,
      `👤 ${pr.sex === 'F' ? 'Mujer' : 'Hombre'} · ${pr.age} años · ${pr.height} cm · ${pr.weight} kg`,
      `🏋️ ${[NG.PLAN_TYPES[pr.planType], NG.EXPERIENCE[pr.experience], NG.EQUIPMENT[pr.equipment]].filter(Boolean).join(' · ')}`,
      pr.injuries ? `🤕 Lesiones o molestias: ${pr.injuries}` : null,
      `🍽️ ${pr.meals.length} comidas · ${NG.COOKING[pr.cooking] || ''}`,
      `🥗 ${NG.DIETAS[pr.diet]}${pr.allergens.length ? ' · Sin: ' + pr.allergens.map(a => NG.ALG[a]).join(', ') : ''}`,
      pr.medical.length || pr.medicalText ? `🩺 Salud: ${pr.medical.map(id => (NG.MED.find(m => m.id === id) || {}).n).concat(pr.medicalText ? [pr.medicalText] : []).join(' · ')}` : null,
      '', 'Código para el panel (no lo borres):', `#FRM:${code}`,
    ].filter(l => l !== null).join('\n');
  }

  async function click(a, el) {
    const ds = el.dataset, p = st.p;
    if (a === 'next') { if (!validate()) return; st.step++; saveDraft(); window.scrollTo(0, 0); return render(); }
    if (a === 'prev') { st.step = Math.max(0, st.step - 1); saveDraft(); window.scrollTo(0, 0); return render(); }
    if (a === 'set') {
      let v = ds.v; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^\d+$/.test(v) && ds.f !== 'sex') v = +v;
      setPath(p, ds.f, v);
      if (ds.f === 'nMeals') { const old = p.meals; p.meals = E.defaultMeals(v).map((m, i) => (old[i] && old[i].type === m.type ? { ...m, ctx: old[i].ctx, time: old[i].time } : m)); }
    }
    if (a === 'tog') { const arr = getv(ds.f) || []; const v = ds.v; setPath(p, ds.f, arr.includes(v) ? arr.filter(x => x !== v) : arr.concat(v)); }
    if (a === 'tstep') {
      const m = p.meals[+ds.i], [h, mi] = String(m.time || '12:00').split(':').map(Number), t = ((h * 60 + mi + +ds.d) % 1440 + 1440) % 1440;
      m.time = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
    }
    if (a === 'notrain') p.noTrain = !p.noTrain;
    if (a === 'tradd') p.training.push({ type: 'cardio', days: 2, min: 45 });
    if (a === 'trdel') p.training.splice(+ds.i, 1);
    if (a === 'okt') p.ok = !p.ok;
    if (a === 'send' || a === 'copy') {
      if (!p.ok) return U.toast('Marcá la casilla de confirmación');
      const txt = await message();
      if (a === 'send') U.wa(st.co.w, txt); else await U.copy(txt);
      st.sent = true;
    }
    saveDraft(); render();
  }
  function change(el) {
    if (!el.dataset.f) return;
    setPath(st.p, el.dataset.f, el.dataset.num ? el.value.replace(',', '.') : el.value);
    saveDraft();
  }

  NG.Form = { mount };
})(window.NG);
