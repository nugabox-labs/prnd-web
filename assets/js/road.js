// 배경: 밤 도로를 원근으로 그려 천천히 달리는 느낌을 준다(동영상 대신 캔버스 — 내려받을 파일 없음).
// 차선 점선이 다가오고, 앞차 미등과 가로등이 지나간다. 스크롤하면 잠깐 빨라진다.
// 탭이 숨으면 멈추고, 움직임 줄이기 설정이면 한 장면만 그린다.
(() => {
  const canvas = document.createElement('canvas');
  canvas.className = 'road-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 단위는 미터. 카메라 높이 1.3m, 차로 폭 3.6m, 편도 3차로.
  const CAM_H = 1.3;
  const LANE = 3.6;
  const EDGE = LANE * 1.5;
  const FAR = 220;
  const NEAR = 1.5;
  const DASH = 3, GAP = 9;
  const BASE_SPEED = 16; // m/s

  let w = 0, h = 0, dpr = 1, f = 1, cx = 0, horizon = 0;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    f = Math.max(w, h) * 0.55;
    cx = w / 2;
    horizon = h * 0.42;
  };
  resize();
  addEventListener('resize', resize);

  const sx = (x, z) => cx + (x * f) / z;
  const sy = (y, z) => horizon + ((CAM_H - y) * f) / z;
  const fade = (z) => Math.max(0, Math.min(1, (FAR - z) / (FAR * 0.6))) * Math.max(0, Math.min(1, (z - 4) / 14));

  // 앞차: 차로마다 한두 대, 우리보다 조금 느리거나 빠르게
  const cars = [-LANE, 0, LANE, -LANE, LANE].map((x, i) => ({ x, z: 40 + i * 37, v: BASE_SPEED * (0.86 + (i % 3) * 0.07) }));

  let travel = 0;
  let speed = BASE_SPEED;
  let boost = 0;
  let lastY = scrollY;
  addEventListener('scroll', () => {
    boost = Math.min(boost + Math.abs(scrollY - lastY) * 0.08, 40);
    lastY = scrollY;
  }, { passive: true });

  const quad = (x1, x2, z1, z2, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx(x1, z1), sy(0, z1));
    ctx.lineTo(sx(x2, z1), sy(0, z1));
    ctx.lineTo(sx(x2, z2), sy(0, z2));
    ctx.lineTo(sx(x1, z2), sy(0, z2));
    ctx.closePath();
    ctx.fill();
  };
  const glow = (x, y, r, rgb, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb}, ${a})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    // 하늘 끝의 옅은 빛
    const sky = ctx.createRadialGradient(cx, horizon, 0, cx, horizon, w * 0.6);
    sky.addColorStop(0, 'rgba(232, 223, 204, 0.10)');
    sky.addColorStop(1, 'rgba(232, 223, 204, 0)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // 노면
    const road = ctx.createLinearGradient(0, horizon, 0, h);
    road.addColorStop(0, 'rgba(255, 255, 255, 0.015)');
    road.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = road;
    ctx.beginPath();
    ctx.moveTo(sx(-EDGE - 1, FAR), sy(0, FAR));
    ctx.lineTo(sx(EDGE + 1, FAR), sy(0, FAR));
    ctx.lineTo(sx(EDGE + 1, NEAR), sy(0, NEAR));
    ctx.lineTo(sx(-EDGE - 1, NEAR), sy(0, NEAR));
    ctx.closePath();
    ctx.fill();

    // 가장자리 실선(끊어 그려 멀수록 흐리게)
    for (let z = NEAR; z < FAR; z += 6) {
      const a = 0.22 * fade(z + 3);
      quad(-EDGE - 0.08, -EDGE + 0.08, z, z + 6, `rgba(232, 223, 204, ${a})`);
      quad(EDGE - 0.08, EDGE + 0.08, z, z + 6, `rgba(232, 223, 204, ${a})`);
    }
    // 차선 점선
    const period = DASH + GAP;
    const shift = travel % period;
    for (let z = NEAR - shift + period; z < FAR; z += period) {
      const a = 0.24 * fade(z);
      for (const x of [-LANE / 2, LANE / 2]) quad(x - 0.07, x + 0.07, z, z + DASH, `rgba(242, 242, 240, ${a})`);
    }

    // 가로등(양옆 높이 7m, 40m 간격)
    const lampShift = travel % 40;
    for (let z = NEAR - lampShift + 40; z < FAR; z += 40) {
      const a = 0.55 * fade(z);
      const r = Math.max(2, 120 / z);
      for (const x of [-EDGE - 2.5, EDGE + 2.5]) glow(sx(x, z), sy(7, z), r * 6, '232, 223, 204', a * 0.5);
    }

    // 앞차 미등
    for (const car of cars) {
      const a = fade(car.z);
      if (a <= 0) continue;
      const y = sy(0.9, car.z);
      const r = Math.max(1.5, 90 / car.z);
      for (const dx of [-0.75, 0.75]) glow(sx(car.x + dx, car.z), y, r * 5, '200, 40, 45', 0.75 * a);
    }

    // 가장자리 어둡게 — 글자가 읽히도록
    const vig = ctx.createRadialGradient(cx, h * 0.45, Math.min(w, h) * 0.2, cx, h * 0.5, Math.max(w, h) * 0.8);
    vig.addColorStop(0, 'rgba(10, 11, 13, 0)');
    vig.addColorStop(1, 'rgba(10, 11, 13, 0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  };

  const step = (dt) => {
    boost *= Math.pow(0.25, dt);
    speed += (BASE_SPEED + boost - speed) * Math.min(1, 3 * dt);
    travel += speed * dt;
    for (const car of cars) {
      car.z += (car.v - speed) * dt;
      if (car.z < 8) car.z += FAR - 20;
      if (car.z > FAR) car.z -= FAR - 20;
    }
  };

  if (reduceMotion) { draw(); addEventListener('resize', draw); return; }

  let last = performance.now();
  let acc = 0;
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    acc += dt;
    if (acc >= 1 / 30) { step(acc); draw(); acc = 0; } // 30fps면 충분
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
