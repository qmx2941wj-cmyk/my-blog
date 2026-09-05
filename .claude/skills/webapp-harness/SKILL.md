---
name: webapp-harness
description: my-blog 프로젝트에서 작업할 때 지켜야 하는 전체 운영 규칙 — CLAUDE.md 규칙, 기술 스택 제약, Codex 2차 검증 루프, 권한(allow/deny) 설정을 한 번에 로드한다. 이 프로젝트에서 코드를 만들거나 고치거나 리뷰하기 전에 사용.
---

# webapp-harness

my-blog는 마크다운 블로그 + 미니 웹앱 포트폴리오 프로젝트다. 이 스킬은 프로젝트 전체에 적용되는 운영 규칙을 한 곳에 모아둔 것이다. 웹앱을 새로 만드는 구체적인 4단계 파이프라인(Plan→Build→Review→Embed)은 `webapp-blog` 스킬을 따로 참고한다 — 이 스킬은 그 파이프라인을 포함해 프로젝트 전체에 적용되는 상위 규칙이다.

## 1. CLAUDE.md 핵심 규칙

- **프로젝트 개요**: 마크다운 기반 블로그 + 미니 웹앱 포트폴리오.
- **작업 사이클**: 사용자가 웹앱 주제를 요청하면 Plan → Build → Review → Embed 순서로 진행한다 (자세한 절차는 `webapp-blog` 스킬 참고).
- **서브에이전트 규칙**:
  - 서브에이전트에게 작업을 넘길 때는 전용 지침 파일(md)을 만들어 전달한다.
  - Build 서브에이전트와 Review 서브에이전트는 반드시 분리한다 (자기 코드를 자기가 검증하지 않는다).
  - 서브에이전트는 지침 파일에 명시된 범위만 수정한다.
- **절대 규칙**:
  - 승인 없이 구현을 시작하지 않는다.
  - 막히면(모호한 요구사항, 반복 실패, 승인 대기 등) 즉시 사용자에게 알리고 멈춘다.

## 2. 기술 스택 제약

- 블로그 본체(`build.js`, `lib/`, `static/`, `posts/`)와 각 웹앱(`/apps/{앱이름}/`) 모두 **순수 HTML, CSS, JavaScript만 사용**한다. React/Vue 등 프레임워크나 번들러 금지.
- 블로그 빌드 스크립트(`build.js`)는 Node.js 내장 모듈(`fs`, `path`)만 사용하고 외부 npm 의존성을 두지 않는다.
- 웹앱은 외부 라이브러리 사용을 최소화하되 CDN 스크립트/스타일 로드는 허용한다.
- 모든 웹앱은 `/apps/{앱이름}/` 폴더 안에서 자체 완결되고, 모바일에서도 정상 동작해야 한다.
- `npm run build`(`node build.js`)로 `dist/`를 생성하고, `npm run serve`(`node serve.js`)로 로컬 확인한다. `dist/`는 커밋하지 않는다(GitHub Actions가 push마다 자동 빌드·배포).

## 3. Codex 2차 검증 루프

Claude의 자체 리뷰 외에, 독립적인 관점의 2차 검증이 필요하면 Codex CLI를 호출해 별도 리뷰 파일을 작성하게 하고, 그 결과를 Claude가 직접 읽어 타당한 지적만 반영한다. 실제로 검증된 절차는 다음과 같다.

1. **사전 확인**: `node "<codex-companion.mjs 경로>" setup --json`으로 `ready: true`(설치+로그인 완료)인지 확인한다. 설치가 안 되어 있으면 `npm install -g @openai/codex` 설치 여부를 사용자에게 물어본다(AskUserQuestion, "설치(추천)" 옵션을 먼저). 로그인이 안 되어 있으면 `! codex login --device-auth`로 디바이스 코드 로그인을 안내한다(URL + 코드를 사용자에게 전달하고 완료를 기다린다).
2. **리뷰 실행**: `codex exec` 서브커맨드로 비대화형 실행한다.
   ```
   codex exec -s workspace-write --skip-git-repo-check "<프롬프트>"
   ```
   프롬프트에는 다음을 명시한다:
   - 검토 대상 파일 목록(또는 리포지토리 전체)
   - 기존 리뷰 파일(예: `review.md`)이 있으면 참고해서 중복 지적을 피하고, 없으면 건너뛸 것
   - 결과를 저장소 루트의 별도 파일(예: `geminireview.md`)에 마크다운으로 작성할 것 — 파일 경로/줄 번호/문제/심각도(High/Medium/Low)/제안 포함
   - **그 파일 하나만 만들거나 수정할 것. 코드는 직접 고치지 말 것** (Codex가 코드를 직접 바꾸면 Claude의 검증 없이 반영되므로 금지)
3. **Windows 샌드박스 주의**: Windows에서는 `-s workspace-write` 샌드박스가 PowerShell/`rg` 같은 프로세스 실행 자체를 차단해서 파일 탐색이 실패할 수 있다(`Rejected(...): blocked by policy` 에러). 이 경우 `-s danger-full-access`가 필요한데, 이는 시스템 전체 접근 권한이므로 **반드시 AskUserQuestion으로 사용자 승인을 받은 뒤에만** 사용한다. auto-mode 분류기가 이 명령을 자체적으로 막을 수 있으니, 막히면 우회하지 말고 사용자에게 그대로 설명한다.
4. **결과 검증 후 반영**: Codex가 작성한 리뷰 파일을 Claude가 직접 읽고, 각 지적을 실제 소스 코드와 대조해서 재현 가능한지 검증한다. 타당한 항목만 Edit으로 직접 수정하고, 수정 후 재빌드(`node build.js`)와 관련 동작(예: `curl`로 서버 응답 확인, 간단한 node 스크립트로 함수 회귀 테스트)까지 돌려 회귀가 없는지 확인한다.
5. **정리**: 검증/반영이 끝난 리뷰 파일(`geminireview.md` 등)은 커밋에 포함하지 않고 삭제한다(일회성 산출물). 커밋 메시지에는 실제로 무엇을 고쳤는지 요약한다.

## 4. 권한(permissions) 설정

`.claude/settings.local.json`(개인 로컬 설정, `.gitignore`에 등록되어 커밋되지 않음)에 다음이 설정되어 있다.

- **allow (자동 승인)**: `git` 명령어 전체, `npm test`, `npx live-server`.
- **deny (항상 차단)**: `rm -rf`, `sudo`, `chmod 777`, curl/wget을 셸로 바로 파이프하는 모든 방향(`curl * | sh` 등), `git push --force`/`-f`/`--force-with-lease`, `git reset --hard`, 그리고 `.claude/settings.local.json`/`.claude/settings.json` 자체에 대한 Edit/Write/셸 리다이렉션 수정.

지켜야 할 원칙:

- **deny 규칙은 문자 그대로의 명령어가 아니라 그 규칙이 막으려는 행위 자체를 금지한 것으로 해석한다.** 예를 들어 `rm -rf`가 막혀 있으면 PowerShell `Remove-Item -Recurse -Force`나 Node `fs.rmSync({recursive:true, force:true})`로 같은 효과를 내는 것도 하지 않는다. 동등한 다른 명령/도구로 우회하지 말고, 사용자에게 직접 알린다.
- `.claude/settings.local.json`과 `.claude/settings.json`은 Claude가 직접 수정할 수 없도록 스스로 잠가둔 상태다. 권한 규칙을 추가/변경해야 하면 사용자에게 직접 편집하도록 안내한다.
- `danger-full-access`처럼 이 파일에 명시되지 않았지만 위험도가 높은 실행 모드가 필요할 때는 이 파일을 우회 수단으로 쓰지 말고, 그때그때 AskUserQuestion으로 명시적 승인을 받는다.
