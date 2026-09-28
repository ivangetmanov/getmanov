import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const distRoot = path.resolve("dist");
const measurementId = "G-Q9Y8XEE6EF";

async function htmlFilesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? htmlFilesBelow(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => file.endsWith(".html"));
}

const requestedPages = [
  path.join(distRoot, "index.html"),
  ...(await htmlFilesBelow(path.join(distRoot, "notes"))),
  ...(await htmlFilesBelow(path.join(distRoot, "tools"))),
];

for (const file of requestedPages) {
  const html = await readFile(file, "utf8");
  const relativePath = path.relative(distRoot, file);

  assert.equal(
    (html.match(new RegExp(`googletagmanager\\.com/gtag/js\\?id=${measurementId}`, "g")) ?? []).length,
    1,
    `${relativePath} must load the existing GA4 tag exactly once`,
  );
  assert.equal(
    (html.match(new RegExp(`gtag\\('config', '${measurementId}'\\)`, "g")) ?? []).length,
    1,
    `${relativePath} must configure the existing GA4 stream exactly once`,
  );
  assert.equal(
    (html.match(/session_saver_cta_click/g) ?? []).length,
    1,
    `${relativePath} must contain one shared Session Saver event handler`,
  );
  assert.equal(
    (html.match(/chrome_store_click/g) ?? []).length,
    1,
    `${relativePath} must contain one shared Chrome Store event handler`,
  );
}

async function trackedClick(file, pageUrl, selector, eventName) {
  const html = await readFile(file, "utf8");
  const dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: pageUrl,
  });
  const link = dom.window.document.querySelector(selector);
  assert(link, `${selector} must exist on ${pageUrl}`);
  link.addEventListener("click", (event) => event.preventDefault());
  link.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));

  const events = dom.window.dataLayer
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === "event" && entry[1] === eventName);
  assert.equal(events.length, 1, `${eventName} must fire exactly once on ${pageUrl}`);
  for (const parameter of ["source_page", "cta_location", "cta_text", "target_url"]) {
    assert(events[0][2][parameter], `${eventName} must include ${parameter}`);
  }
}

await trackedClick(
  path.join(distRoot, "notes", "export-long-chatgpt-chats", "index.html"),
  "https://getmanov.com/notes/export-long-chatgpt-chats/",
  'article a[href="/tools/session-saver/"]',
  "session_saver_cta_click",
);

await trackedClick(
  path.join(distRoot, "tools", "session-saver", "index.html"),
  "https://getmanov.com/tools/session-saver/",
  'a[data-cta-location="hero_install"]',
  "chrome_store_click",
);

console.log(`Analytics checks passed for ${requestedPages.length} requested public pages.`);
