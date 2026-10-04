(() => {
  const layer = document.getElementById('heroFallLayer');
  if (!layer) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;

  const symbols = [
    {char:'🌸', cls:'petal', weight:11},
    {char:'✨', cls:'sparkle', weight:5},
    {char:'❤️', cls:'heart-red', weight:2},
    {char:'❄️', cls:'snow', weight:2}
  ];

  function pickSymbol() {
    const pool = [];
    symbols.forEach(s => {
      for (let i = 0; i < s.weight; i++) pool.push(s);
    });
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function createParticle() {
    const p = document.createElement('span');
    const symbol = pickSymbol();
    p.className = `hero-fall-item ${symbol.cls}`;
    p.textContent = symbol.char;

    const left = Math.random() * 100;
    const duration = (mobile ? 9 : 11) + Math.random() * (mobile ? 5 : 7);
    const delay = -(Math.random() * duration);
    const size = (mobile ? 12 : 14) + Math.random() * (mobile ? 9 : 14);
    const drift = (Math.random() * 2 - 1) * (mobile ? 38 : 68);
    const rotate = (Math.random() * 2 - 1) * 160;
    const opacity = 0.20 + Math.random() * 0.30;

    p.style.setProperty('--fall-left', `${left}%`);
    p.style.setProperty('--fall-duration', `${duration.toFixed(2)}s`);
    p.style.setProperty('--fall-delay', `${delay.toFixed(2)}s`);
    p.style.setProperty('--fall-size', `${size.toFixed(1)}px`);
    p.style.setProperty('--fall-drift', `${drift.toFixed(1)}px`);
    p.style.setProperty('--fall-rotate', `${rotate.toFixed(1)}deg`);
    p.style.setProperty('--fall-opacity', opacity.toFixed(2));
    layer.appendChild(p);
  }

  if (reduced) {
    layer.hidden = true;
    return;
  }

  const count = mobile ? 8 : 14;
  for (let i = 0; i < count; i++) createParticle();
})();