/* Almacenamiento local, empaquetado de datos en links/códigos y respaldos. */
(function (NG) {
  const KC = 'ng_coach_v1', KA = 'ng_alumno_v1';

  function read(k) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function write(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { console.warn(e); if (NG.UI) NG.UI.toast('⚠️ No se pudo guardar en este dispositivo'); return false; }
  }

  // base64url
  function b64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(str) {
    const s = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s + '==='.slice((s.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const canZip = typeof CompressionStream !== 'undefined';

  // Objeto → texto corto apto para URL (comprimido si el navegador lo permite)
  async function pack(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    if (canZip) {
      try {
        const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        return '1' + b64(new Uint8Array(await new Response(stream).arrayBuffer()));
      } catch (e) { /* sigue sin comprimir */ }
    }
    return '0' + b64(bytes);
  }
  // Todo código o link llega de afuera (WhatsApp): sin < > " sus textos no pueden inyectar HTML en la app ni en el panel
  const SAFE = { '<': '‹', '>': '›', '"': '”' };
  const clean = v => typeof v === 'string' ? v.replace(/[<>"]/g, c => SAFE[c])
    : Array.isArray(v) ? v.map(clean)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => k !== '__proto__').map(([k, x]) => [clean(k), clean(x)]))
    : v;
  async function unpack(str) {
    str = String(str || '').trim();
    let bytes = unb64(str.slice(1));
    if (str[0] === '1') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    }
    return clean(JSON.parse(new TextDecoder().decode(bytes)));
  }

  async function sha(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ng·' + text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let h = 5381; for (const ch of 'ng·' + text) h = (h * 33) ^ ch.charCodeAt(0);
      return 'x' + (h >>> 0).toString(16);
    }
  }

  const pad = n => String(n).padStart(2, '0');
  const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dkey(new Date());
  const addDays = (key, n) => { const d = new Date(key + 'T12:00:00'); d.setDate(d.getDate() + n); return dkey(d); };

  function download(name, text, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  // En celular abre "Compartir" (Drive, WhatsApp, Mail…); en PC descarga el archivo
  async function saveFile(name, text) {
    try {
      const file = new File([text], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        await navigator.share({ files: [file], title: name });
        return true;
      }
    } catch (e) { if (e && e.name === 'AbortError') return false; }
    download(name, text);
    return true;
  }
  function pickFile(accept = '.json,application/json') {
    return new Promise(res => {
      const i = document.createElement('input');
      i.type = 'file'; i.accept = accept;
      i.onchange = () => { const f = i.files[0]; if (!f) return res(null); const rd = new FileReader(); rd.onload = () => res(rd.result); rd.readAsText(f); };
      i.click();
    });
  }

  // URL pública de la app (para armar links que funcionen en el celular del alumno)
  function baseUrl(settings) {
    const s = settings && settings.appUrl;
    return (s || location.href).replace(/[?#].*$/, '');
  }

  NG.S = {
    coach: () => read(KC), saveCoach: d => { d.updatedAt = Date.now(); return write(KC, d); },
    alumno: () => read(KA), saveAlumno: d => write(KA, d), clearAlumno: () => { try { localStorage.removeItem(KA); } catch (e) {} },
    read, write, pack, unpack, sha, today, dkey, addDays, download, saveFile, pickFile, baseUrl,
    persist: () => { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {} },
  };
})(window.NG);
