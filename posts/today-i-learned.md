---
title: 오늘 배운 것
date: 2026-09-05
---

클로드 코드로 이 블로그를 직접 만들어보면서, HTML과 CSS와 JavaScript가 각각 어떤 역할을 맡고 있는지 조금 더 분명하게 정리할 수 있었습니다.

## HTML: 문서의 뼈대

HTML은 페이지에 **어떤 내용이 어떤 구조로 들어가는지**를 정의합니다. 이 블로그에서는 마크다운 글이 `<h1>`, `<p>`, `<ul>`, `<pre><code>` 같은 태그로 변환되어 하나의 문서 구조를 이룹니다. HTML 자체는 색이나 배치를 신경 쓰지 않고, 오직 "이건 제목이다", "이건 목록이다" 같은 의미만 담당합니다.

## CSS: 보이는 방식을 결정

같은 HTML이라도 CSS에 따라 완전히 다르게 보일 수 있습니다. 이 블로그에서 CSS가 맡은 역할은 이런 것들이었습니다.

- 라이트/다크 테마 색상을 CSS 변수(`--color-bg`, `--color-text` 등)로 관리하기
- `@media (prefers-color-scheme: dark)`로 시스템 다크모드 설정에 자동으로 반응하기
- `@media (max-width: 600px)`로 모바일 화면에서 여백과 글자 크기를 조정하기
- 코드블록에 모노스페이스 폰트와 가로 스크롤을 적용해 긴 코드가 레이아웃을 깨지 않게 하기

## JavaScript: 상호작용과 상태 관리

JavaScript는 페이지가 **사용자의 행동에 반응하도록** 만듭니다. 이 블로그에서는 `theme.js` 하나가 그 역할을 합니다.

```javascript
function toggleTheme() {
  var next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}
```

버튼 클릭이라는 이벤트를 감지하고, `data-theme` 속성을 바꿔 CSS가 다른 색상 변수를 쓰게 만들고, 그 선택을 `localStorage`에 저장해서 새로고침해도 유지되게 합니다. HTML과 CSS만으로는 "지금 상태를 기억했다가 다음에도 적용하는" 동작을 할 수 없고, 이 부분이 JavaScript의 역할이었습니다.

## 정리

한 문장으로 정리하면, HTML은 **무엇을 보여줄지**, CSS는 **어떻게 보여줄지**, JavaScript는 **어떻게 반응할지**를 담당한다는 걸 이번에 직접 만들어보며 다시 확인할 수 있었습니다.
