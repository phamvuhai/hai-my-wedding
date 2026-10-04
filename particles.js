(() => {
  const layer = document.getElementById('heroFallLayer');
  const hero = document.getElementById('home');
  if (!layer || !hero) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 760px)').matches;

  const symbols = [
    {char:'🌸', cls:'petal', weight:5},
    {char:'🤍', cls:'heart-white', weight:3},
    {char:'❤️', cls:'heart-red', weight:1},
    {char:'❄️', cls:'snow', weight:1}
  ];

  function pickSymbol() {
    const pool = [];
    symbols.forEach(s => {
      for (let i=0;i<s.weight;i++) pool.push(s);
    });
    return pool[Math.floor(Math.random()*pool.length)];
  }

  function createParticle(index, count) {
    const p = document.createElement('span');
    const symbol = pickSymbol();
    p.className = `hero-fall-item ${symbol.cls}`;
    p.textContent = symbol.char;

    const left = Math.random()*100;
    const duration = (mobile ? 8 : 10) + Math.random()*(mobile ? 5 : 7);
    const delay = -(Math.random()*duration);
    const size = (mobile ? 13 : 15) + Math.random()*(mobile ? 10 : 15);
    const drift = (Math.random()*2 - 1) * (mobile ? 42 : 72);
    const rotate = (Math.random()*2 - 1) * 150;
    const opacity = 0.22 + Math.random()*0.32;

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
  for (let i=0;i<count;i++) createParticle(i,count);

  const observer = new IntersectionObserver(entries => {
    const active = entries.some(e => e.isIntersecting && e.intersectionRatio > 0.15);
    layer.classList.toggle('is-paused', !active);
  }, {threshold:[0,.15,.5]});

  observer.observe(hero);
})();