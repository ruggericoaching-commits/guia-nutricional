/* Nube (Firebase): envío automático de check-ins y formularios, y recepción en el panel.
   El SDK se baja solo cuando hace falta, así la app sigue abriendo rápido y sin conexión. */
(function (NG) {
  const V = '10.14.1', BASE = `https://www.gstatic.com/firebasejs/${V}/`, OUT = 'ng_outbox', TIMEOUT = 12000;
  let mods = null;
  const on = () => !!(NG.CLOUD && NG.CLOUD.projectId);

  async function load() {
    if (!mods) {
      const [app, fs, au] = await Promise.all(['app', 'firestore', 'auth'].map(m => import(`${BASE}firebase-${m}.js`)));
      const a = app.initializeApp(NG.CLOUD);
      mods = { fs, au, db: fs.getFirestore(a), auth: au.getAuth(a) };
    }
    return mods;
  }
  // Firestore no admite undefined ni arreglos dentro de arreglos: se limpia antes de enviar
  const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (Array.isArray(v) && v.some(Array.isArray) ? v.map(x => (Array.isArray(x) ? { d: x[0], k: x[1] } : x)) : v)));
  const withTimeout = (p, ms = TIMEOUT) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

  /* ── Alumno ────────────────────────────────────────────────────── */
  const outbox = () => NG.S.read(OUT) || [];
  const saveOut = l => NG.S.write(OUT, l);

  async function push(item) {
    const { fs, db } = await load();
    const ref = fs.doc(db, item.path, item.id);
    await withTimeout(fs.setDoc(ref, { ...item.doc, at: fs.serverTimestamp() }));
  }
  // Envía; si no hay conexión queda en la bandeja de salida y se reintenta sola. Devuelve 'ok' | 'queued'
  async function send(path, doc) {
    const item = { path, id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36), doc: clean(doc) };
    try { await push(item); return 'ok'; }
    catch (e) { saveOut(outbox().concat(item)); return 'queued'; }
  }
  async function flush() {
    if (!on() || !outbox().length || !navigator.onLine) return;
    for (const item of outbox()) {
      try { await push(item); } catch (e) {
        // permission-denied al reintentar = ya había llegado en un intento anterior (un alumno no puede pisar)
        if (!(e && e.code === 'permission-denied')) return;
      }
      saveOut(outbox().filter(x => x.id !== item.id));
    }
  }
  const sendCheckin = (sk, fields) => send(`s/${sk}/checkins`, { d: fields.d, v: 1, data: fields });
  const sendForm = data => send('forms', { data });
  // Plan publicado: el panel lo guarda (empaquetado igual que el link) y la app del alumno lo busca al abrir
  async function publishPlan(sk, code, ver) {
    const { fs, db } = await load();
    await withTimeout(fs.setDoc(fs.doc(db, 's', sk), { plan: code, ver, at: fs.serverTimestamp() }));
  }
  async function fetchPlan(sk) {
    const { fs, db } = await load();
    const s = await withTimeout(fs.getDoc(fs.doc(db, 's', sk)), 8000);
    return s.exists() ? s.data() : null;
  }

  /* ── Entrenador ────────────────────────────────────────────────── */
  async function user() { const { au, auth } = await load(); await auth.authStateReady(); return auth.currentUser; }
  async function login() {
    const { au, auth } = await load();
    const r = await au.signInWithPopup(auth, new au.GoogleAuthProvider());
    return r.user;
  }
  async function logout() { const { au, auth } = await load(); await au.signOut(auth); }

  // Escucha los check-ins de cada alumno y los formularios nuevos. Cada documento se entrega una vez.
  const subs = {};
  async function watch({ keys, onCheckin, onForm, onError }) {
    const { fs, db } = await load();
    Object.keys(subs).forEach(k => { if (k !== 'forms' && !keys.some(([, sk]) => sk === k)) { subs[k](); delete subs[k]; } });
    keys.forEach(([cid, sk]) => {
      if (subs[sk]) return;
      subs[sk] = fs.onSnapshot(fs.collection(db, `s/${sk}/checkins`), snap =>
        snap.docChanges().forEach(ch => { if (ch.type === 'added') onCheckin(cid, ch.doc.id, ch.doc.data()); }), onError);
    });
    if (!subs.forms) subs.forms = fs.onSnapshot(fs.collection(db, 'forms'), snap =>
      snap.docChanges().forEach(ch => { if (ch.type === 'added') onForm(ch.doc.id, ch.doc.data()); }), onError);
  }
  const stop = () => Object.keys(subs).forEach(k => { subs[k](); delete subs[k]; });

  NG.Cloud = { on, sendCheckin, sendForm, publishPlan, fetchPlan, flush, user, login, logout, watch, stop };
  window.addEventListener('online', flush);
  setTimeout(flush, 2500);
})(window.NG);
