import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

const ROOT = process.cwd();

// откуда берём "истину" (после твоего переноса в public)
const INPUT_DIRS = [
  "public/case-studies",
  "public/notes",
  "public/tools",
  "public/java-script",
];

// куда кладём md в src/pages
const OUTPUT_BASE = "src/pages";

// layout по умолчанию (если нужно — поменяешь позже)
function frontmatter({ title, description, canonical, layoutDepth }) {
  const layoutPath = "../".repeat(layoutDepth) + "layouts/BaseLayout.astro";
  return `---
layout: ${layoutPath}
title: "${escapeFm(title || "")}"
description: "${escapeFm(description || "")}"
canonical: "${escapeFm(canonical || "")}"
---\n\n`;
}

function escapeFm(s) {
  return String(s).replaceAll('"', '\\"').replaceAll("\n", " ").trim();
}

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function stripJunk(doc) {
  // выкидываем мусор
  doc.querySelectorAll("script, style, noscript").forEach(n => n.remove());
  doc.querySelectorAll('link[rel="stylesheet"]').forEach(n => n.remove());
  doc.querySelectorAll("meta").forEach(n => n.remove());

  // иногда Tilda кладёт inline-css в тексте — вырезаем отдельные блоки позже на уровне markdown
}

function normalizeImageSrc(doc) {
  // 1) images/xxx -> /images/xxx
  doc.querySelectorAll("img").forEach(img => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("images/")) img.setAttribute("src", "/" + src);
    if (src.startsWith("./images/")) img.setAttribute("src", src.replace("./images/", "/images/"));
    // если вдруг абсолютные ссылки на getmanov.com/images/... тоже приводим
    img.setAttribute("src", src.replace(/^https?:\/\/getmanov\.com\/images\//, "/images/"));
  });
}

function pickMain(doc) {
  // пробуем найти main/article, иначе body
  return doc.querySelector("main") || doc.querySelector("article") || doc.body;
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

// сохраняем IMG как HTML (чтобы не потерять src/alt)
turndown.addRule("keepImages", {
  filter: ["img"],
  replacement: function (content, node) {
    const src = node.getAttribute("src") || "";
    const alt = node.getAttribute("alt") || "";
    const title = node.getAttribute("title") || "";
    const titleAttr = title ? ` title="${title}"` : "";
    return `<img src="${src}" alt="${alt}"${titleAttr} />`;
  },
});

// выкидываем пустые ссылки/якоря от Tilda
turndown.addRule("dropEmptyLinks", {
  filter: function (node) {
    return node.nodeName === "A" && !(node.getAttribute("href") || "").trim();
  },
  replacement: function () {
    return "";
  },
});

function cleanupMarkdown(md) {
  // вырезаем “остатки” типа @media… и t_onReady… если они проскочили как текст
  md = md.replace(/^@media[^\n]*\{[\s\S]*?\}\s*$/gm, "");
  md = md.replace(/^t_onReady\([\s\S]*?\);\s*$/gm, "");
  md = md.replace(/^setTimeout\([\s\S]*?\);\s*$/gm, "");
  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function getSlugParts(inputFile) {
  // пример: public/case-studies/seo-case-b2b/index.html
  // -> ["case-studies","seo-case-b2b"]
  const rel = path.relative("public", inputFile);
  const parts = rel.split(path.sep);
  parts.pop(); // index.html
  return parts;
}

function layoutDepthFor(parts) {
  // md лежит в src/pages/<parts...>/index.md
  // чтобы дойти до src/layouts нужно подняться на N уровней:
  // src/pages = базовый уровень, от index.md считаем сколько папок внутри pages
  // пример: src/pages/case-studies/seo-case-b2b/index.md -> 3 раза ../ до src
  // но мы строим путь относительно файла -> "../../../layouts/..."
  return 1 + parts.length; // pages + папки
}

function extractMeta(doc, canonicalFallback) {
  const title =
    doc.querySelector("meta[property='og:title']")?.getAttribute("content") ||
    doc.querySelector("title")?.textContent ||
    doc.querySelector("h1")?.textContent ||
    "";

  const description =
    doc.querySelector("meta[name='description']")?.getAttribute("content") ||
    doc.querySelector("meta[property='og:description']")?.getAttribute("content") ||
    "";

  const canonical =
    doc.querySelector("link[rel='canonical']")?.getAttribute("href") ||
    canonicalFallback ||
    "";

  return { title, description, canonical };
}

function run() {
  // понадобится jsdom
  // ставим: npm i -D jsdom
  let converted = 0;

  for (const dir of INPUT_DIRS) {
    if (!fs.existsSync(dir)) continue;

    const files = walk(dir).filter(f => f.endsWith(".html"));
    for (const f of files) {
      // берём только index.html в папках (чтобы не хватать мусорные .html)
      if (path.basename(f) !== "index.html") continue;

      const html = fs.readFileSync(f, "utf8");
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      stripJunk(doc);
      normalizeImageSrc(doc);

      const parts = getSlugParts(f); // ["case-studies","seo-case-b2b"]
      const outDir = path.join(OUTPUT_BASE, ...parts);
      ensureDir(outDir);

      const canonicalFallback = "https://getmanov.com/" + parts.join("/") + "/";
      const meta = extractMeta(doc, canonicalFallback);

      const main = pickMain(doc);
      let mdBody = turndown.turndown(main.innerHTML);
      mdBody = cleanupMarkdown(mdBody);

      const layoutDepth = layoutDepthFor(parts);
      const md = frontmatter({ ...meta, layoutDepth }) + mdBody;

      const outFile = path.join(outDir, "index.md");
      fs.writeFileSync(outFile, md, "utf8");
      converted++;
    }
  }

  console.log(`OK: converted ${converted} pages`);
}

run();
