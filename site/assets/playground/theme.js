// Seletor de tema (claro/escuro). O tema inicial já é setado por um script inline
// anti-FOUC no <head>; aqui só renderizamos o botão e tratamos a troca + persistência.
(function () {
  const KEY = 'shaderworkshop:theme';
  const root = document.documentElement;
  const cur = () => (root.dataset.theme === 'escuro' ? 'escuro' : 'claro');

  function setMeta(t) {
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'escuro' ? '#0d0f14' : '#d6336c');
  }
  function label(t) { return t === 'escuro' ? 'Mudar para tema claro' : 'Mudar para tema escuro'; }

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type = 'button';
  btn.textContent = '🌓';
  btn.setAttribute('aria-label', label(cur()));
  btn.setAttribute('aria-pressed', cur() === 'escuro' ? 'true' : 'false');

  function apply(t) {
    root.dataset.theme = t;
    try { localStorage.setItem(KEY, t); } catch (e) { /* storage bloqueado: ok */ }
    setMeta(t);
    btn.setAttribute('aria-label', label(t));
    btn.setAttribute('aria-pressed', t === 'escuro' ? 'true' : 'false');
  }

  btn.addEventListener('click', () => apply(cur() === 'escuro' ? 'claro' : 'escuro'));
  (document.body || root).appendChild(btn);
  setMeta(cur());
})();
