(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'selection-fire';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.appendChild(canvas);
  let frame = 0, previous = 0, particles = [], rects = [], ranges = [];
  function clear() {
    cancelAnimationFrame(frame); frame = 0; previous = 0; particles = []; rects = [];
    ranges = [];
    document.documentElement.classList.remove("selection-burning");
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    update();
  }
  function update() {
    cancelAnimationFrame(frame); frame = 0;
    rects = [];
    if (motion.matches) { clear(); return; }
    if (document.hidden) return;
    for (const range of ranges) {
      rects.push(...Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth));
    }
    rects = rects.slice(0, 80);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    previous = 0;
    if (rects.length) frame = requestAnimationFrame(draw);
  }
  function captureSelection() {
    const selection = getSelection();
    // Retain the burning ranges until a deliberate click or keypress clears them.
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
    clear();
    if (motion.matches) return;
    for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i).cloneRange());
    document.documentElement.classList.add('selection-burning');
    update();
  }
  function draw(time) {
    const delta = Math.min((time - (previous || time)) / 1000, .04); previous = time;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const r of rects) {
      const left = Math.max(0, r.left), right = Math.min(innerWidth, r.right);
      const count = Math.min(5, Math.ceil((right-left) / 40));
      for (let i = 0; i < count && particles.length < 280; i++) {
        const life = .35 + Math.random() * .5;
        particles.push({x: left + Math.random() * (right-left), y: r.top + r.height * .65, life, max: life, size: 2 + Math.random()*4, speed: 22 + Math.random()*32, drift: (Math.random()-.5)*16});
      }
    }
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.life -= delta; p.y -= p.speed * delta; p.x += p.drift * delta;
      const fade = Math.max(0, p.life / p.max), size = p.size * fade;
      const glow = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(.1,size*2));
      glow.addColorStop(0, `rgba(255,234,146,${fade*.8})`);
      glow.addColorStop(.35, `rgba(255,150,36,${fade*.65})`);
      glow.addColorStop(1, 'rgba(239,60,14,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(p.x,p.y,Math.max(.1,size),Math.max(.1,size*2),0,0,Math.PI*2); ctx.fill();
    }
    frame = requestAnimationFrame(draw);
  }
  document.addEventListener('selectionchange', captureSelection);
  document.addEventListener('pointerdown', clear);
  document.addEventListener('keydown', clear);
  document.addEventListener('scroll', update, {passive:true, capture:true});
  window.addEventListener('resize', resize);
  window.addEventListener('blur', () => { cancelAnimationFrame(frame); frame = 0; });
  window.addEventListener('focus', update);
  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);
  resize();
})();
