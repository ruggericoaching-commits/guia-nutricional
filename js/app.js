/* Arranque, rutas y eventos globales. */
(function (NG) {
  // Rutas: #p=… (plan del alumno) · #form=… (formulario) · #coach/… (panel) · vacío (app del alumno)
  function route() {
    NG.UI.closeAll(); NG.UI.enter();
    const h = location.hash || '';
    if (h.startsWith('#p=')) return NG.Client.fromHash(h.slice(3));
    if (h.startsWith('#form')) return NG.Form.mount(h.startsWith('#form=') ? h.slice(6) : '');
    if (h.startsWith('#coach')) return NG.Coach.mount(h.slice(1).split('/'));
    // Sin plan en este dispositivo pero con panel del entrenador → ir al panel
    if (!NG.S.alumno() && NG.S.coach()) { location.replace('#coach'); return; }
    return NG.Client.mount();
  }

  // Un solo juego de escuchas; cada pantalla define NG.handlers
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled || !NG.handlers || !NG.handlers.click) return;
    if (el.tagName === 'A') e.preventDefault();
    NG.handlers.click(el.dataset.a, el, e);
  });
  document.addEventListener('change', e => { if (NG.handlers && NG.handlers.change) NG.handlers.change(e.target, e); });
  document.addEventListener('input', e => { if (NG.handlers && NG.handlers.input) NG.handlers.input(e.target, e); });

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); NG.installEvt = e;
    if (document.querySelector('.cl')) NG.Client.render();
  });
  window.addEventListener('hashchange', route);

  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
    // Versión nueva de la app: se recarga sola (salvo que esté escribiendo o con una hoja abierta)
    const had = !!navigator.serviceWorker.controller; let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!had || reloaded) return; reloaded = true;
      const busy = () => NG.UI.isOpen() || /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '');
      const go = () => { if (busy()) return setTimeout(go, 4000); location.reload(); };
      go();
    });
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  route();
})(window.NG);
