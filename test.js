// Prueba: node test.js — los códigos que llegan por WhatsApp no pueden inyectar HTML.
const assert = require('assert');
global.window = { NG: {} };
require('./js/store.js');
const S = window.NG.S;

(async () => {
  const evil = { d: '<img src=x onerror=alert(1)>', e: '" onmouseover="x', p: { drive: 'javascript:alert(1)', name: 'Seba' }, ok: 5 };
  const out = await S.unpack(await S.pack(evil));
  const texts = v => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(texts) : []);
  assert.ok(texts(out).every(t => !/[<>"]/.test(t)), 'quedaron < > " en los textos');
  assert.strictEqual(out.d, '‹img src=x onerror=alert(1)›');
  assert.strictEqual(out.ok, 5, 'los números no cambian');
  assert.strictEqual(out.p.name, 'Seba', 'el texto normal no cambia');
  const proto = await S.unpack(await S.pack(JSON.parse('{"__proto__": {"x": 1}, "a": 1}')));
  assert.strictEqual(Object.getPrototypeOf(proto), Object.prototype, '__proto__ no se copia');
  console.log('✅ Códigos: filtro anti-inyección OK');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
