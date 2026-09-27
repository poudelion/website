(() => {
  const supported = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)');
  if (!CSS.supports('mix-blend-mode', 'difference')) return;
  const light = document.createElement('div');
  light.className = 'torch-light';
  light.setAttribute('aria-hidden', 'true');
  document.body.appendChild(light);
  let frame = 0;
  let x = 0;
  let y = 0;
  function hide() {
    cancelAnimationFrame(frame);
    frame = 0;
    light.classList.remove('is-visible');
    document.documentElement.classList.remove('torch-enabled');
  }
  document.addEventListener('pointermove', (event) => {
    if (!supported.matches || event.pointerType !== 'mouse') { hide(); return; }
    x = event.clientX;
    y = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      light.style.transform = `translate3d(${x - 60}px, ${y - 104}px, 0)`;
      light.classList.add('is-visible');
      document.documentElement.classList.add('torch-enabled');
    });
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hide);
  document.addEventListener('pointercancel', hide);
  document.addEventListener('keydown', hide);
  window.addEventListener('blur', hide);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
  supported.addEventListener('change', hide);
})();
