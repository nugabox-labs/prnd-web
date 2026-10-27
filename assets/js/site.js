// 상단 헤더: 맨 위의 감시자(.header-sentinel)가 화면에서 사라지면 헤더를 알약으로 줄인다.
// 스크롤 위치를 직접 재지 않아 스크롤할 때마다 코드가 돌지 않는다.
(() => {
  const sentinel = document.querySelector('.header-sentinel');
  const header = document.querySelector('.site-header');
  if (!sentinel || !header) return;
  new IntersectionObserver(([entry]) => header.classList.toggle('is-shrunk', !entry.isIntersecting)).observe(sentinel);
})();
