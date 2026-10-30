// Pruebas: node test.js
const assert = require('assert');
global.window = { NG: {}, addEventListener() {} };
global.document = { addEventListener() {}, querySelector() { return null; } };
global.navigator = { onLine: true };
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
['foods', 'content', 'engine', 'store', 'ui'].forEach(f => require(`./js/${f}.js`));
const { NG } = window, { S, E, UI } = NG;
const day = (start, n) => new Date(Date.parse(start) + n * 864e5).toISOString().slice(0, 10);
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('Códigos: no pueden inyectar HTML ni __proto__', async () => {
  const evil = { d: '<img src=x onerror=alert(1)>', e: '" onmouseover="x', p: { drive: 'javascript:alert(1)', name: 'Seba' }, ok: 5 };
  const out = await S.unpack(await S.pack(evil));
  const texts = v => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(texts) : []);
  assert.ok(texts(out).every(t => !/[<>"]/.test(t)), 'quedaron < > " en los textos');
  assert.strictEqual(out.ok, 5);
  assert.strictEqual(out.p.name, 'Seba');
  const proto = await S.unpack(await S.pack(JSON.parse('{"__proto__": {"x": 1}, "a": 1}')));
  assert.strictEqual(Object.getPrototypeOf(proto), Object.prototype);
});

test('Teléfonos: formatos argentinos comunes llegan a 549 + área + número', () => {
  const ok = '5491173645601';
  ['11 7364-5601', '011 7364-5601', '011 15 7364-5601', '11 15 7364 5601', '+54 9 11 7364 5601', '54 9 11 7364-5601', '15 7364 5601'].forEach(n => assert.strictEqual(UI.phone(n), ok, n));
  assert.strictEqual(UI.phone('0351 15 612 3456'), '5493516123456', 'área de 3 dígitos con 15');
  assert.strictEqual(UI.phone(''), '');
});

test('Fotos de progreso: el día 1 y luego cada 4 semanas (5, 9, 13…)', () => {
  const start = '2026-10-25', due = n => E.photoDue(start, day(start, n * 7));
  [0, 1, 2, 3].forEach(w => assert.ok(!due(w), `semana ${w + 1} no toca`));
  assert.ok(due(4), 'semana 5 toca');
  assert.ok(!due(5) && !due(7));
  assert.ok(due(8), 'semana 9 toca');
  assert.ok(!E.photoDue('', start), 'sin fecha de inicio no toca');
});

test('Calorías: casos de referencia', () => {
  const base = { sex: 'M', age: 30, height: 175, weight: 80, activity: 'lig', training: [{ type: 'fuerza', days: 4, min: 60 }], diet: 3 };
  const mant = E.targets({ profile: { ...base, goal: 'mantener' }, calc: {} }), perd = E.targets({ profile: { ...base, goal: 'perder', rate: 'moderado' }, calc: {} });
  assert.ok(mant.kcal > 2400 && mant.kcal < 3200, 'mantenimiento razonable: ' + mant.kcal);
  assert.ok(perd.kcal < mant.kcal - 300 && perd.kcal >= perd.bmr, 'déficit sin bajar del metabolismo basal');
  assert.strictEqual(perd.p, Math.round(2 * 80), 'proteína 2 g/kg en déficit');
  assert.ok(Math.abs(perd.p * 4 + perd.c * 4 + perd.f * 9 - perd.kcal) < 80, 'los macros suman las calorías');
});

test('Planes: tres platos por comida, sin opción genérica ni repetidos, dentro del rango', () => {
  for (let s = 0; s < 25; s++) {
    const meals = E.defaultMeals(4); meals.forEach((m, i) => { m.ctx = ['casa', 'afuera', 'trabajo', 'casa'][(i + s) % 4]; });
    const cl = { id: 'x' + s, profile: { sex: s % 2 ? 'F' : 'M', age: 30, height: 172, weight: 75, goal: 'perder', rate: 'moderado', activity: 'lig', training: [{ type: 'fuerza', days: 3, min: 60 }], meals, cooking: s % 3 ? 'basico' : 'cocina', tupper: false, micro: true, diet: 3, allergens: [], exclude: [], budget: 'medio' }, calc: {}, plan: {} };
    E.genPlan(cl, 'k' + s).forEach(m => {
      assert.strictEqual(m.options.length, 3, `${m.type} con ${m.options.length} opciones (semilla ${s})`);
      assert.ok(m.options.every(o => o.type !== 'flex'));
      assert.strictEqual(new Set(m.options.map(o => o.name)).size, 3, 'nombres repetidos');
      m.options.forEach(o => assert.ok(Math.abs(E.sum(o.items).k - m.target.k) / m.target.k <= 0.15, `calorías fuera de rango en ${m.type}`));
    });
  }
});

(async () => {
  let fail = 0;
  for (const [name, fn] of tests) {
    try { await fn(); console.log('✅', name); } catch (e) { fail++; console.error('❌', name, '→', e.message); }
  }
  if (fail) process.exit(1);
})();
