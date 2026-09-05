/**
 * 아주 작은 마크다운 → HTML 변환기.
 * 지원 문법: 헤딩, 굵게/기울임, 인라인 코드, 펜스 코드블록,
 * 링크/이미지, 순서/비순서 목록, 인용, 수평선, 문단.
 */

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}

// http(s)/mailto/tel 이외의 스킴(javascript:, data:, vbscript: 등)을 차단한다.
const SAFE_URL_SCHEME = /^(https?:|mailto:|tel:)/i;
function sanitizeUrl(url) {
  const trimmed = (url || "").trim();
  if (SAFE_URL_SCHEME.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return "#";
  return trimmed;
}

function renderInline(text) {
  // 코드/링크/이미지는 완성된 HTML로 만들어 플레이스홀더에 넣어두고,
  // 그 외의 일반 텍스트만 이스케이프 및 굵게/기울임 처리를 적용한다.
  // (전체를 먼저 이스케이프하면 URL이 이중 이스케이프되고, 코드 안의
  // 마크다운 문법이 다시 해석되는 문제가 있었다.)
  const placeholders = [];
  function store(html) {
    placeholders.push(html);
    return `@@${placeholders.length - 1}@@`;
  }

  let working = text;

  // 인라인 코드: `code`
  working = working.replace(/`([^`]+)`/g, (_, code) => store(`<code>${escapeHtml(code)}</code>`));

  // 이미지: ![alt](src)
  working = working.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, title) =>
      store(
        `<img src="${escapeAttr(sanitizeUrl(src))}" alt="${escapeAttr(alt)}"${
          title ? ` title="${escapeAttr(title)}"` : ""
        }>`
      )
  );

  // 링크: [text](url)
  working = working.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href, title) =>
      store(
        `<a href="${escapeAttr(sanitizeUrl(href))}"${
          title ? ` title="${escapeAttr(title)}"` : ""
        }>${escapeHtml(label)}</a>`
      )
  );

  let out = escapeHtml(working);

  // 굵게: **text** 또는 __text__
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // 기울임: *text* 또는 _text_
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/(^|[^\w])_([^_]+)_(?!\w)/g, "$1<em>$2</em>");

  // 플레이스홀더 복원
  out = out.replace(/@@(\d+)@@/g, (_, idx) => placeholders[Number(idx)]);

  return out;
}

function isHr(line) {
  return /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 펜스 코드블록
    const fenceMatch = line.match(/^```(\S*)\s*$/);
    if (fenceMatch) {
      const lang = fenceMatch[1];
      const codeLines = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 닫는 ``` 건너뛰기
      const codeHtml = escapeHtml(codeLines.join("\n"));
      const langClass = lang ? ` class="language-${escapeAttr(lang)}"` : "";
      html.push(`<pre><code${langClass}>${codeHtml}</code></pre>`);
      continue;
    }

    // 빈 줄
    if (!line.trim()) {
      i++;
      continue;
    }

    // 수평선
    if (isHr(line)) {
      html.push("<hr>");
      i++;
      continue;
    }

    // 헤딩
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // 인용
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      html.push(`<blockquote><p>${renderInline(quoteLines.join(" "))}</p></blockquote>`);
      continue;
    }

    // 순서 없는 목록
    if (/^[-*]\s+/.test(line) && !isHr(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    // 순서 있는 목록
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    // 문단 (다음 빈 줄 또는 다음 블록 요소 전까지 이어붙임)
    const paragraphLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !isHr(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    html.push(`<p>${renderInline(paragraphLines.join(" "))}</p>`);
  }

  return html.join("\n");
}

module.exports = { markdownToHtml, escapeHtml };
