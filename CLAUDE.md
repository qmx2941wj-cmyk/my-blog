# my-blog

마크다운(.md) 파일을 읽어 정적 블로그 웹사이트로 변환하는 프로젝트입니다.

## 구조 및 명령어

- `posts/*.md`: 글 원본 (프론트매터로 `title`, `date` 지정)
- `build.js` (+ `lib/frontmatter.js`, `lib/markdown.js`): `posts/`를 스캔해 `dist/`에 정적 HTML 생성. Node 내장 모듈만 사용, 외부 npm 의존성 없음
- `static/style.css`, `static/theme.js`: 빌드 시 `dist/`로 그대로 복사되는 공통 스타일/다크모드 스크립트
- `npm run build` (또는 `node build.js`): 사이트 빌드
- `npm run serve` (또는 `node serve.js`): `dist/`를 `http://localhost:4000`으로 로컬 서빙 (빌드 결과 확인용)
- 새 글 추가 시 `posts/`에 `.md` 파일만 넣고 다시 빌드하면 목록에 자동 반영됨

## 기술 스택

- 순수 HTML, CSS, JavaScript만 사용 (React, Vue 등 프레임워크 및 빌드 도구 금지)
- 외부 런타임 의존성 없이 브라우저에서 바로 동작하는 것을 지향
- 마크다운 파싱이 꼭 필요하면 CDN 없이 동작 가능한 최소 구현을 직접 작성하거나, 정적 빌드 스크립트(Node.js 등)에서만 라이브러리를 사용하고 결과물은 순수 HTML/CSS/JS로 출력

## 디자인 원칙

- 깔끔하고 가독성 좋은 타이포그래피 중심 레이아웃 (본문 폭 제한, 넉넉한 줄간격/여백)
- 다크 모드 지원 필수 — `prefers-color-scheme` 대응 + 사용자가 수동으로 토글 가능하게, 선택은 `localStorage`에 저장
- 모바일 반응형 필수 — 작은 화면에서도 여백/폰트 크기/네비게이션이 깨지지 않도록 확인
- 색상은 CSS 변수(커스텀 프로퍼티)로 라이트/다크 테마를 분리 관리

## 작업 시 유의사항

- 새 기능을 추가할 때 프레임워크나 번들러를 끌어오지 말 것 — 항상 vanilla JS로 구현
- UI를 변경한 뒤에는 브라우저에서 라이트/다크 모드, 데스크톱/모바일 뷰포트를 직접 확인할 것
- 불필요한 추상화나 설정 없이 파일 구조를 단순하게 유지 (예: `index.html`, `style.css`, `script.js`, 글 콘텐츠용 마크다운 파일들)
