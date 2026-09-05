const fs = require("fs");
const path = require("path");
const { parseFrontmatter } = require("./lib/frontmatter");
const { markdownToHtml, escapeHtml } = require("./lib/markdown");

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, "posts");
const STATIC_DIR = path.join(ROOT, "static");
const DIST_DIR = path.join(ROOT, "dist");
const APPS_DIR = path.join(ROOT, "apps");
const SITE_TITLE = "My Blog";

function slugify(filename) {
  return filename
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return escapeHtml(dateStr || "");
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function loadPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const seenSlugs = new Map();

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = slugify(file);

      if (!slug) {
        throw new Error(`빌드 실패: "${file}"에서 만들어진 slug가 비어 있습니다. 파일명에 영문/숫자를 포함해주세요.`);
      }
      if (seenSlugs.has(slug)) {
        throw new Error(`빌드 실패: "${file}"와 "${seenSlugs.get(slug)}"의 slug가 "${slug}"로 충돌합니다.`);
      }
      seenSlugs.set(slug, file);

      return {
        slug,
        title: escapeHtml(data.title || slug),
        date: data.date || "",
        contentHtml: markdownToHtml(body),
      };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function pageShell({ title, bodyHtml, assetPrefix }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${assetPrefix}style.css">
<script src="${assetPrefix}theme.js"></script>
</head>
<body>
<header class="site-header">
  <div class="site-header__inner">
    <a class="site-title" href="${assetPrefix}index.html">${SITE_TITLE}</a>
    <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="다크 모드로 전환">🌓</button>
  </div>
</header>
<main>
${bodyHtml}
</main>
<footer class="site-footer">${SITE_TITLE}</footer>
</body>
</html>
`;
}

function renderIndexPage(posts) {
  const items = posts
    .map(
      (post) => `  <li>
    <a class="post-list__title" href="posts/${post.slug}.html">${post.title}</a>
    <span class="post-list__date">${formatDate(post.date)}</span>
  </li>`
    )
    .join("\n");

  const bodyHtml = posts.length
    ? `<ul class="post-list">\n${items}\n</ul>`
    : `<p>아직 작성된 글이 없습니다.</p>`;

  return pageShell({ title: SITE_TITLE, bodyHtml, assetPrefix: "" });
}

function renderPostPage(post) {
  const bodyHtml = `<article>
  <a class="back-link" href="../index.html">&larr; 목록으로</a>
  <header class="post-header">
    <span class="post-date">${formatDate(post.date)}</span>
    <h1>${post.title}</h1>
  </header>
  <div class="post-content">
${post.contentHtml}
  </div>
</article>`;

  return pageShell({
    title: `${post.title} - ${SITE_TITLE}`,
    bodyHtml,
    assetPrefix: "../",
  });
}

function copyStaticAssets() {
  for (const file of ["style.css", "theme.js"]) {
    fs.copyFileSync(path.join(STATIC_DIR, file), path.join(DIST_DIR, file));
  }
}

function copyDirRecursive(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyApps() {
  if (!fs.existsSync(APPS_DIR)) return;
  copyDirRecursive(APPS_DIR, path.join(DIST_DIR, "apps"));
}

function build() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST_DIR, "posts"), { recursive: true });

  const posts = loadPosts();

  fs.writeFileSync(path.join(DIST_DIR, "index.html"), renderIndexPage(posts));
  for (const post of posts) {
    fs.writeFileSync(
      path.join(DIST_DIR, "posts", `${post.slug}.html`),
      renderPostPage(post)
    );
  }

  copyStaticAssets();
  copyApps();

  console.log(`Built ${posts.length} post(s) into ${path.relative(ROOT, DIST_DIR)}/`);
}

build();
