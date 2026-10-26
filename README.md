# prnd-web

PRND 앱의 소개 · 개인정보처리방침 · 위치기반서비스 이용약관 정적 사이트. https://prnd.nugabox.com

| 경로 | URL |
| --- | --- |
| `index.html` | `/` — 소개, 요금, 문의(App Store 지원 URL 겸용 `/#support`) |
| `privacy/index.html` | `/privacy/` — 개인정보처리방침 |
| `terms/location/index.html` | `/terms/location/` — 위치기반서비스 이용약관 |
| `assets/` | 공용 CSS, Michroma 폰트(OFL), 브랜드 이미지, 앱 화면 캡처 |

빌드 단계는 없다. 로컬 확인: `python3 -m http.server 8080` 후 http://localhost:8080

## 출처
- 문구·기능·등급: `prnd-app/docs/PRND_SPEC.md`
- 디자인 토큰·화면 캡처: Figma `PRND-App` › Screens(`10:223`)
- 브랜드(워드마크·앱 아이콘·Michroma·히어로): `prnd-app/assets/`
- 법적 문서 틀: `todaytome/app/public/privacy.html`

앱 기능이 바뀌면(특히 외부로 나가는 정보 — 카카오내비 SDK 도입 등) 개인정보처리방침 4항과 버전·날짜를 함께 고친다.

## 배포
`main`에 푸시하면 `.github/workflows/deploy.yml`이 self-hosted 러너(`nugacloud`)에서
`/volume1/Develop/webapps/prnd-web`을 `fetch + reset --hard`로 갱신하고 Mattermost로 알린다.

서버 최초 준비(한 번):
1. `git clone https://github.com/nugabox-labs/prnd-web /volume1/Develop/webapps/prnd-web`
2. 웹 서버에 `prnd.nugabox.com` 가상 호스트를 이 폴더로 연결하고 HTTPS 인증서를 붙인다.
3. 숨김 경로(`/.git`, `/.github`, `/.last_deploy_commit`)는 웹에서 막는다. 404 페이지는 `/404.html`.
4. 저장소 시크릿 `MATTERMOST_WEBHOOK_URL`을 등록한다(없으면 알림만 생략).
