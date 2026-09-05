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

function renderInline(text) {
  let out = escapeHtml(text);

  // 인라인 코드: `code`
  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${code}</code>`);

  // 이미지: ![alt](src)
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, alt, src, title) =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${
        title ? ` title="${escapeAttr(title)}"` : ""
      }>`
  );

  // 링크: [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g,
    (_, label, href, title) =>
      `<a href="${escapeAttr(href)}"${
        title ? ` title="${escapeAttr(title)}"` : ""
      }>${label}</a>`
  );

  // 굵게: **text** 또는 __text__
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  // 기울임: *text* 또는 _text_
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/(^|[^\w])_([^_]+)_(?!\w)/g, "$1<em>$2</em>");

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

module.exports = { markdownToHtml };
