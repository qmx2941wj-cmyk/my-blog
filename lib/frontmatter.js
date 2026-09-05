/**
 * 마크다운 파일 맨 앞의 `---\nkey: value\n---` 블록을 파싱한다.
 * @param {string} raw - 마크다운 파일 전체 내용
 * @returns {{ data: Record<string, string>, body: string }}
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: raw };
  }

  const [, block, body] = match;
  const data = {};

  for (const line of block.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const sepIndex = line.indexOf(":");
    if (sepIndex === -1) continue;
    const key = line.slice(0, sepIndex).trim();
    let value = line.slice(sepIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, body };
}

module.exports = { parseFrontmatter };
