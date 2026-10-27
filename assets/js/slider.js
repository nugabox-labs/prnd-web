// 화면 슬라이더 — 띠가 왼쪽으로 천천히 끊김 없이 흐른다.
// 같은 슬라이드를 뒤에 두 벌 더 붙이고, 한 벌 너비만큼 흐르면 위치를 되돌려 끝없이 이어 보이게 한다.
// 마우스를 올리면 속도를 부드럽게 줄여 멈추고, 내리면 다시 천천히 출발한다. 손·마우스로 끌어 넘길 수도 있다.
(() => {
  const slider = document.querySelector('.slider');
  if (!slider) return;
  const track = slider.querySelector('.slider-track');
  const originals = [...track.children];

  for (let i = 0; i < 2; i++) {
    originals.forEach((slide) => {
      const clone = slide.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('[role="img"]').forEach((el) => el.removeAttribute('aria-label'));
      track.append(clone);
    });
  }

  const SPEED = 28;   // px/초 — 한 장이 지나가는 데 10초 남짓
  const EASE = 2.2;   // 클수록 멈춤·출발이 빠르다
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 한 벌(원본 전체)의 너비 = 복제본 첫 장의 위치
  let setWidth = 0;
  const measure = () => { setWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft; };
  measure();

  // 처음에는 주행(첫 장)이 보이는 칸의 왼쪽에 오도록 둔다 — 그 앞에는 마지막 장(설정)이 걸쳐 보인다.
  const startOffset = () => {
    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const gap = step - track.children[0].offsetWidth;
    const per = Number(getComputedStyle(track).getPropertyValue('--per')) || 1;
    const side = (slider.clientWidth - (per * step - gap)) / 2;
    return setWidth - side;
  };
  let offset = startOffset();
  let started = false;
  track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  const reset = () => {
    measure();
    if (!started) { offset = startOffset(); track.style.transform = `translate3d(${-offset}px, 0, 0)`; }
  };
  addEventListener('resize', reset);
  addEventListener('load', reset, { once: true });
  let speed = 0;
  let hovering = false;
  let visible = false;
  let drag = null;

  const wrap = () => {
    if (!setWidth) return;
    offset = ((offset % setWidth) + setWidth) % setWidth;
  };

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (!drag) {
      const target = !started || hovering || reduceMotion || document.hidden ? 0 : SPEED;
      speed += (target - speed) * Math.min(1, EASE * dt);
      offset += speed * dt;
    }
    wrap();
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    if (visible) requestAnimationFrame(frame);
  };
  const run = () => { last = performance.now(); requestAnimationFrame(frame); };

  // 화면에 반쯤 들어온 뒤 잠깐 멈춰 있다가 출발한다 — 처음 보는 순간 주행 화면부터 보이게.
  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was) run();
    if (!started && entry.intersectionRatio >= 0.5) setTimeout(() => { started = true; }, 1200);
  }, { threshold: [0, 0.5] }).observe(slider);

  slider.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hovering = true; });
  slider.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hovering = false; });

  // 끌어 넘기기: 놓은 뒤에는 0에서부터 다시 천천히 출발한다.
  slider.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, offset, id: e.pointerId };
    speed = 0;
    slider.setPointerCapture(e.pointerId);
    slider.classList.add('dragging');
  });
  slider.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    offset = drag.offset - (e.clientX - drag.x);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    slider.classList.remove('dragging');
  };
  slider.addEventListener('pointerup', release);
  slider.addEventListener('pointercancel', release);
  slider.addEventListener('dragstart', (e) => e.preventDefault());
})();
