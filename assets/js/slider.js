// 화면 슬라이더 — 한 장씩 자동으로 넘기고 끝없이 돈다.
// 원본 앞뒤에 복제본을 한 벌씩 붙여 처음부터 양옆이 걸쳐 보이게 하고,
// 복제 구간에 들어서면 같은 모습의 원본 위치로 순간 이동한다.
// 마우스를 올리거나 손으로 만지는 동안, 화면 밖에 있을 때는 멈춘다.
(() => {
  const slider = document.querySelector('.slider');
  if (!slider) return;
  const track = slider.querySelector('.slider-track');
  const originals = [...track.children];
  const count = originals.length;
  const delay = Number(slider.dataset.autoplay) || 3500;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cloneOf = (slide) => {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('img').forEach((img) => { img.alt = ''; });
    return clone;
  };
  track.prepend(...originals.map(cloneOf));
  track.append(...originals.map(cloneOf));

  const step = () => track.children[1].offsetLeft - track.children[0].offsetLeft;
  const index = () => Math.round(track.scrollLeft / step());

  const jumpBy = (slides) => track.scrollTo({ left: track.scrollLeft + slides * step(), behavior: 'instant' });
  const wrap = () => {
    const i = index();
    if (i >= 2 * count) jumpBy(-count);
    else if (i < count) jumpBy(count);
  };
  // 원본 첫 장에서 시작한다. 이미지 크기가 정해진 뒤 다시 맞춘다.
  const home = () => track.scrollTo({ left: count * step(), behavior: 'instant' });
  home();
  addEventListener('load', home, { once: true });
  addEventListener('resize', () => { clearTimeout(track._r); track._r = setTimeout(() => track.scrollTo({ left: Math.round(track.scrollLeft / step()) * step(), behavior: 'instant' }), 150); });
  if ('onscrollend' in window) track.addEventListener('scrollend', wrap);
  else track.addEventListener('scroll', () => { clearTimeout(track._t); track._t = setTimeout(wrap, 120); });

  let timer = null;
  let visible = false;
  let held = false;
  const next = () => track.scrollTo({ left: (index() + 1) * step(), behavior: 'smooth' });
  const sync = () => {
    const run = visible && !held && !document.hidden && !reduceMotion;
    if (run && !timer) timer = setInterval(next, delay);
    if (!run && timer) { clearInterval(timer); timer = null; }
  };

  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.3 }).observe(slider);
  document.addEventListener('visibilitychange', sync);
  slider.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { held = true; sync(); } });
  slider.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { held = false; sync(); } });
  slider.addEventListener('touchstart', () => { held = true; sync(); }, { passive: true });
  slider.addEventListener('touchend', () => { setTimeout(() => { held = false; sync(); }, 2500); }, { passive: true });
})();
