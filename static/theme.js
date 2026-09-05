(function () {
  var STORAGE_KEY = "theme";
  var root = document.documentElement;

  function applyStoredTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage 접근 불가 (예: 브라우저 설정) — 시스템 기본값을 그대로 사용
    }
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
  }

  function currentTheme() {
    var explicit = root.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    var prefersDark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  function syncButtonState(button) {
    var isDark = currentTheme() === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // 저장 실패 시 이번 세션에서만 테마 유지
    }
    var button = document.querySelector("[data-theme-toggle]");
    if (button) syncButtonState(button);
  }

  applyStoredTheme();

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.querySelector("[data-theme-toggle]");
    if (button) {
      syncButtonState(button);
      button.addEventListener("click", toggleTheme);
    }
  });
})();
