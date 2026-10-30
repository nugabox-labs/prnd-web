# prnd-web

PRND 앱의 소개 · 개인정보처리방침 · 위치기반서비스 이용약관 정적 사이트. https://prnd.nugabox.com

| 경로 | URL |
| --- | --- |
| `index.html` | `/` — 소개, 기능, 화면 슬라이더(`assets/js/slider.js`), 요금, 출시 안내(App Store 출시 예정 · Play Store 출시 준비 중) |
| `privacy/index.html` | `/privacy/` — 개인정보처리방침 |
| `terms/location/index.html` | `/terms/location/` — 위치기반서비스 이용약관 |
| `assets/` | 공용 CSS·JS, Michroma 폰트(OFL), 브랜드 이미지, 앱 화면 캡처 |

빌드 단계는 없다. 로컬 확인: `python3 -m http.server 8080` 후 http://localhost:8080

## 헤더 · 워드마크
- 헤더는 link.nugabox.com(`linkbox/components/site/SiteHeader.tsx`)과 같은 방식: 맨 위에서는 전체 너비·배경 없음, 스크롤하면 가운데 알약(반투명·블러)으로 줄어든다. `assets/js/site.js`가 맨 위 감시자로 `.is-shrunk`만 붙인다. 모바일(680px 이하)은 오른쪽 버튼을 숨긴다.
- 헤더·마무리 로고는 `assets/img/PRND-wordmark-wide.svg` — 앱 워드마크 글리프를 글자 사이 +46(글자 높이 90 기준) 넓히고 여백 없이 잘라 같은 높이에서 더 크게 보인다. 원본은 `PRND-wordmark-transparent.svg`.
- CSS·JS 링크에는 `?v=` 버전을 붙인다. 고치면 네 페이지의 버전을 함께 올린다.

## 아이콘
`assets/img/favicon.svg`가 원본이다 — 워드마크(Michroma)의 P·R 글리프를 같은 색 외곽선으로 굵게, 검정 둥근 사각형 위에.

| 파일 | 용도 |
| --- | --- |
| `assets/img/prnd-icon-1024.jpg`, `prnd-icon-512.jpg` | 다른 서비스 등록용(정사각, 모서리는 각 서비스가 둥글게 처리) · og:image |
| `assets/img/prnd-icon-rounded-512.png` | 모서리까지 둥근 투명 배경 PNG |
| `assets/img/favicon.png`, `/favicon.ico`, `apple-touch-icon.png` | 브라우저·홈 화면 |

소개 페이지 문구에는 특정 제조사·지도 서비스 이름을 쓰지 않는다(추상적으로 "차", "내비게이션"). 개인정보처리방침·약관은 법적 고지라 위치를 받는 사업자(카카오모빌리티)를 이름으로 적는다.

화면 캡처(`assets/screens/`)는 Figma `PRND-App` Screens에서 주행 중 `10:400`, 목적지 `10:539`, 충전 `96:1682`(2026-10-29 내 주변 충전소 지도판), 여정 `57:906`, 내비게이션 선택 `79:1410`, 설정 `11:521`을 그대로 내보낸 것이다. 슬라이더·히어로는 `<img>` 대신 배경 이미지 div로 넣고(끌어서 저장 방지) 393:852 비율로 위에서부터 자른다. 슬라이더는 초당 28px로 쉬지 않고 흐른다(마우스를 올려도 멈추거나 떠오르지 않음). 터치로 밀면 민 방향으로 딱 한 장씩 0.42초에 맞춰 넘어가고, 2.5초 쉰 뒤 다시 흐른다. 폰 그림자는 옅게 둔다 — 진하면 겹쳐 띠 전체가 검게 뭉쳐 배경 도로를 가린다.

배경은 `assets/js/road.js`가 캔버스로 그리는 밤 도로(차선·가로등)다. 동영상 파일이 없어 용량이 들지 않고, 30fps로 그리며 탭이 숨으면 멈춘다. 진하기는 `site.css`의 `.road-bg` opacity(소개 0.6, 문서 0.35).

## 출처
- 문구·기능·등급: `prnd-app/docs/PRND_SPEC.md`
- 디자인 토큰·화면 캡처: Figma `PRND-App` › Screens(`10:223`)
- 브랜드(워드마크·앱 아이콘·Michroma·히어로): `prnd-app/assets/`
- 법적 문서 틀: `todaytome/app/public/privacy.html`

앱 기능이 바뀌면(특히 기기 밖으로 나가는 정보) 개인정보처리방침 1·4항과 날짜를 함께 고친다.

## 배포
`main`에 푸시하면 `.github/workflows/deploy.yml`이 self-hosted 러너(`nugacloud`)에서
`/volume1/Develop/webapps/prnd-web`을 `fetch + reset --hard`로 갱신하고 Mattermost로 알린다.

서버 최초 준비(한 번):
1. `git clone https://github.com/nugabox-labs/prnd-web /volume1/Develop/webapps/prnd-web`
2. 웹 서버에 `prnd.nugabox.com` 가상 호스트를 이 폴더로 연결하고 HTTPS 인증서를 붙인다.
3. 숨김 경로(`/.git`, `/.github`, `/.last_deploy_commit`)는 웹에서 막는다. 404 페이지는 `/404.html`.
4. 저장소 시크릿 `MATTERMOST_WEBHOOK_URL`을 등록한다(없으면 알림만 생략).
