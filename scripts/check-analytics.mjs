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
  ...(await Promise.all(["ru", "en", "sr"].map((locale) =>
    htmlFilesBelow(path.join(distRoot, locale, "novi-sad", "pet-sitting")),
  ))).flat(),
];
const isPetSittingPage = (file) => /[\\/]dist[\\/](ru|en|sr)[\\/]novi-sad[\\/]pet-sitting[\\/]/.test(file);

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
  if (isPetSittingPage(file)) {
    assert.equal(
      (html.match(/pet_sitting_direct_contact_click/g) ?? []).length,
      1,
      `${relativePath} must contain one shared pet-sitting messaging click handler`,
    );
  }
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

async function trackedMessagingClick(file, pageUrl, selector, expected) {
  const html = await readFile(file, "utf8");
  const dom = new JSDOM(html, { runScripts: "dangerously", url: pageUrl });
  const link = dom.window.document.querySelector(selector);
  assert(link, `${selector} must exist on ${pageUrl}`);
  link.addEventListener("click", (event) => event.preventDefault());
  link.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));

  const events = dom.window.dataLayer
    .map((entry) => Array.from(entry))
    .filter((entry) => entry[0] === "event" && entry[1] === "pet_sitting_direct_contact_click");
  assert.equal(events.length, 1, `Messaging click must fire once on ${pageUrl}`);
  const parameters = events[0][2];
  assert.deepEqual(Object.keys(parameters).sort(), ["cta_location", "locale", "messaging_platform", "service_type", "source_page"]);
  assert.equal(parameters.source_page, new URL(pageUrl).pathname);
  assert.equal(parameters.locale, expected.locale);
  assert.equal(parameters.service_type, expected.service_type);
  assert.equal(parameters.messaging_platform, expected.messaging_platform);
  assert(parameters.cta_location);
  for (const forbidden of ["target_url", "cta_text", "telegram_username", "phone", "date_from", "date_to", "optional_comment", "latitude", "longitude"]) {
    assert.equal(forbidden in parameters, false, `Messaging events must not send ${forbidden}`);
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

await trackedMessagingClick(
  path.join(distRoot, "ru", "novi-sad", "pet-sitting", "home-visits", "index.html"),
  "https://getmanov.com/ru/novi-sad/pet-sitting/home-visits/",
  'a[data-home-telegram][data-cta-location="hero"]',
  { locale: "ru", service_type: "home_visits", messaging_platform: "telegram" },
);

await trackedMessagingClick(
  path.join(distRoot, "en", "novi-sad", "pet-sitting", "prices", "index.html"),
  "https://getmanov.com/en/novi-sad/pet-sitting/prices/",
  'a[href^="https://wa.me/"]',
  { locale: "en", service_type: "boarding", messaging_platform: "whatsapp" },
);

await trackedMessagingClick(
  path.join(distRoot, "sr", "novi-sad", "pet-sitting", "can-cat-stay-alone-for-a-week", "index.html"),
  "https://getmanov.com/sr/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/",
  'a[href^="viber:"]',
  { locale: "sr", service_type: "boarding", messaging_platform: "viber" },
);

console.log(`Analytics checks passed for ${requestedPages.length} requested public pages.`);
