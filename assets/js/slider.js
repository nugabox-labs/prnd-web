// 화면 슬라이더 — 띠가 왼쪽으로 천천히 끊김 없이 흐른다.
// 같은 슬라이드를 뒤에 두 벌 더 붙이고, 한 벌 너비만큼 흐르면 위치를 되돌려 끝없이 이어 보이게 한다.
// 마우스를 올려도 멈추지 않는다. 터치로 밀면 한 장씩 딱 맞춰 넘어가고, 잠깐 쉬었다가 다시 흐른다.
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
  const SNAP_MS = 420; // 한 장 넘기는 시간
  const HOLD_MS = 2500; // 넘긴 뒤 쉬는 시간
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
  let visible = false;
  let drag = null;
  let snap = null;      // { from, to, t0 } — 한 장 넘기기 애니메이션
  let holdUntil = 0;    // 터치로 넘긴 뒤 이 시각까지는 흐르지 않는다

  const wrap = () => {
    if (!setWidth) return;
    offset = ((offset % setWidth) + setWidth) % setWidth;
  };

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (snap) {
      const t = Math.min(1, (now - snap.t0) / SNAP_MS);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      offset = snap.from + (snap.to - snap.from) * e;
      if (t >= 1) { snap = null; speed = 0; }
    } else if (!drag) {
      const target = !started || reduceMotion || document.hidden || now < holdUntil ? 0 : SPEED;
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


  // 터치로 넘기기(마우스는 제외): 손가락을 따라 움직이다가, 놓으면 민 방향으로 한 장만 맞춰 넘어간다.
  // 맞춤 기준은 처음 화면과 같다 — 보이는 칸의 왼쪽(모바일은 가운데 한 장)에 한 장이 딱 오도록.
  const geometry = () => {
    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const gap = step - track.children[0].offsetWidth;
    const per = Number(getComputedStyle(track).getPropertyValue('--per')) || 1;
    return { step, side: (slider.clientWidth - (per * step - gap)) / 2 };
  };
  slider.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    snap = null;
    drag = { x: e.clientX, offset, id: e.pointerId, lastX: e.clientX, lastT: performance.now(), v: 0 };
    speed = 0;
    slider.setPointerCapture(e.pointerId);
  });
  slider.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const now = performance.now();
    const dt = now - drag.lastT;
    if (dt > 0) drag.v = 0.7 * drag.v + 0.3 * ((e.clientX - drag.lastX) / dt); // px/ms, 손 떨림을 눌러 준다
    drag.lastX = e.clientX; drag.lastT = now;
    offset = drag.offset - (e.clientX - drag.x);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { step, side } = geometry();
    // 세로 스크롤로 넘어가며 취소되면 좌표가 틀릴 수 있어 마지막으로 따라온 위치를 쓴다
    const dx = (e.type === 'pointercancel' ? drag.lastX : e.clientX) - drag.x;
    const startIndex = Math.round((drag.offset + side) / step);
    let index;
    // 조금만 밀어도(또는 빠르게 튕기면) 한 장, 아무리 세게 밀어도 한 장까지만
    if (dx < -24 || drag.v < -0.35) index = startIndex + 1;
    else if (dx > 24 || drag.v > 0.35) index = startIndex - 1;
    else index = startIndex;
    const to = index * step - side;
    snap = { from: drag.offset - dx, to, t0: performance.now() };
    holdUntil = performance.now() + SNAP_MS + HOLD_MS;
    started = true;
    drag = null;
  };
  slider.addEventListener('pointerup', release);
  slider.addEventListener('pointercancel', release);
  slider.addEventListener('dragstart', (e) => e.preventDefault());
})();
