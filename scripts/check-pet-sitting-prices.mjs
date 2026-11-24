import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const route = (locale, slug = "") => `/${locale}/novi-sad/pet-sitting/${slug ? `${slug}/` : ""}`;
const locales = ["ru", "en", "sr"];
const languageTags = { ru: "ru", en: "en", sr: "sr-Latn" };
const titles = {
  ru: "Цены на передержку и петситтинг в Нови-Саде — 2026",
  en: "Pet Sitting and Boarding Prices in Novi Sad (2026)",
  sr: "Cene čuvanja pasa i mačaka u Novom Sadu (2026)",
};
const h1s = {
  ru: "Сколько стоит передержка и присмотр за животными в Нови-Саде в 2026 году?",
  en: "How Much Does Pet Sitting and Boarding Cost in Novi Sad in 2026?",
  sr: "Koliko košta čuvanje pasa i mačaka u Novom Sadu u 2026. godini?",
};
const sourceUrls = [
  "https://www.catplace.rs/cenovnik/",
  "https://darvin.rs/usluge-i-cene/",
  "https://www.hotelzapsens.rs/cenovnik/",
  "https://www.halooglasi.com/kucni-ljubimci/cuvanje-macaka/novi-sad",
  "https://dogwalkerns.wixsite.com/dwns/cene",
  "https://cuvanjeljubimaca.rs/usluge/cuvanje-i-setanje-pasa-novi-sad-milica-timotijevic/",
];

function html(path) {
  return readFile(new URL(`dist${path}index.html`, root), "utf8");
}

for (const locale of locales) {
  const path = route(locale, "prices");
  const markup = await html(path);
  const document = new JSDOM(markup).window.document;
  const canonical = `https://getmanov.com${path}`;
  assert.equal(document.documentElement.lang, languageTags[locale], `${path} needs its localized document language`);
  assert.equal(document.querySelector("title")?.textContent, titles[locale], `${path} needs its supplied title`);
  assert.equal(document.querySelector(".pet-article h1")?.textContent.trim(), h1s[locale], `${path} needs its supplied H1`);
  assert.equal(document.querySelector('link[rel="canonical"]')?.href, canonical, `${path} needs a self canonical`);
  assert.equal(document.querySelector('meta[name="robots"]')?.content, "index,follow,max-image-preview:large", `${path} must remain indexable`);

  for (const targetLocale of locales) {
    const languageTag = languageTags[targetLocale];
    assert.equal(
      document.querySelector(`link[rel="alternate"][hreflang="${languageTag}"]`)?.href,
      `https://getmanov.com${route(targetLocale, "prices")}`,
      `${path} needs the reciprocal ${languageTag} alternate`,
    );
    assert.equal(
      document.querySelector(`.pet-article__locale a[hreflang="${languageTag}"]`)?.getAttribute("href"),
      route(targetLocale, "prices"),
      `${path} language switcher must lead to the equivalent article`,
    );
  }
  assert.equal(
    document.querySelector('link[rel="alternate"][hreflang="x-default"]')?.href,
    `https://getmanov.com${route("en", "prices")}`,
    `${path} needs the existing English x-default convention`,
  );
  assert.equal(document.querySelector('meta[property="og:title"]')?.content, titles[locale]);
  assert.equal(document.querySelector('meta[property="og:description"]')?.content, document.querySelector('meta[name="description"]')?.content);
  assert.equal(document.querySelector('meta[property="article:published_time"]')?.content, "2026-11-22");
  assert.equal(document.querySelector('meta[property="article:modified_time"]')?.content, "2026-11-22");

  const article = document.querySelector(".pet-article");
  assert(article, `${path} must use the shared article template`);
  assert((article.textContent.match(/\S+/g) ?? []).length > 1800, `${path} must preserve the full supplied guide`);
  assert.equal(article.querySelectorAll("table").length, 4, `${path} must preserve all four comparison tables`);
  assert(document.querySelector(".article-toc"), `${path} must keep the shared article navigation`);
  assert(document.querySelector(".article-author"), `${path} must keep the shared author block`);
  assert(article.querySelector(".pet-article__related nav a"), `${path} must use the related-guides pattern`);
  assert.equal(article.querySelectorAll(".pet-article__related nav a").length, 4, `${path} should point to the four relevant existing guides`);
  assert(article.querySelector(`.pet-article__related a[href="${route(locale, "pet-sitter-vs-boarding")}"]`));
  assert(article.querySelector(`.pet-article__related a[href="${route(locale, "can-cat-stay-alone-for-a-week")}"]`));
  assert(article.querySelector(`.pet-article__related a[href="${route(locale, "prepare-dog-for-boarding")}"]`));
  assert(article.querySelector(`.pet-article__related a[href="${route(locale, "prepare-cat-for-boarding")}"]`));

  const bodyLinks = [...article.querySelectorAll("a[href]")].map((anchor) => anchor.getAttribute("href"));
  for (const service of ["", "dogs", "cats", "home-visits"]) {
    const pathToService = route(locale, service);
    assert(bodyLinks.includes(pathToService), `${path} must link to localized ${service || "main boarding"}`);
  }
  assert(bodyLinks.filter((href) => href === route(locale, "home-visits")).length >= 2, `${path} needs contextual home-visit links for cat and dog prices`);
  for (const url of sourceUrls) assert(bodyLinks.includes(url), `${path} must preserve source ${url}`);

  const graphScript = document.querySelector('script[type="application/ld+json"]');
  assert(graphScript, `${path} needs JSON-LD`);
  const graph = JSON.parse(graphScript.textContent || "{}")["@graph"];
  assert(Array.isArray(graph), `${path} needs the shared connected schema graph`);
  const findType = (type) => graph.filter((entity) => entity["@type"] === type);
  assert.equal(findType("WebPage").length, 1);
  assert.equal(findType("Article").length, 1);
  assert.equal(findType("BreadcrumbList").length, 1);
  assert.equal(findType("Service").length, 0, `${path} must not create a new service entity`);
  assert.equal(findType("Offer").length, 0, `${path} must not claim a product offer`);
  assert.equal(findType("AggregateOffer").length, 0, `${path} must not claim aggregate pricing`);
  assert.equal(findType("AggregateRating").length, 0, `${path} must not invent ratings`);
  const schemaArticle = findType("Article")[0];
  assert.equal(schemaArticle.inLanguage, languageTags[locale]);
  assert.equal(schemaArticle.datePublished, "2026-11-22");
  assert.equal(schemaArticle.dateModified, "2026-11-22");
  assert.deepEqual(schemaArticle.author, { "@id": "https://getmanov.com/#ivan-getmanov" });
  const faq = findType("FAQPage")[0];
  assert.equal(faq?.mainEntity?.length, 6, `${path} must expose only the six visible supplied price FAQs`);
  const visibleQuestions = new Set([...article.querySelectorAll("h3")].map((heading) => heading.textContent.trim()));
  for (const item of faq.mainEntity) assert(visibleQuestions.has(item.name), `${path} FAQ schema question must be visible: ${item.name}`);
  assert(!JSON.stringify(graph).includes('"streetAddress"'), `${path} schema must not expose a home address`);
  assert(!JSON.stringify(graph).includes('"latitude"'), `${path} schema must not expose coordinates`);
}

for (const locale of locales) {
  const moneyPages = ["", "dogs", "cats"].map((kind) => route(locale, kind));
  for (const path of moneyPages) {
    const document = new JSDOM(await html(path)).window.document;
    assert(document.querySelector(`.useful-guides a[href="${route(locale, "prices")}"]`), `${path} needs a lower-page contextual pricing-guide link`);
  }
  const homeVisits = new JSDOM(await html(route(locale, "home-visits"))).window.document;
  assert(homeVisits.querySelector(`.guides-section a[href="${route(locale, "prices")}"]`), `${locale} home visits needs its pricing-guide link in the existing guides area`);
  for (const slug of ["pet-sitter-vs-boarding", "can-cat-stay-alone-for-a-week"]) {
    const support = new JSDOM(await html(route(locale, slug))).window.document;
    assert(support.querySelector(`.pet-article a[href="${route(locale, "prices")}"]`), `${locale}/${slug} needs a contextual pricing-guide link`);
  }
}

const newCatVideoIds = ["I3BhAy-cihk", "NxRSlW0QHEM", "D5RhmfSyBcw", "zvSrI_TzmTk"];
for (const locale of locales) {
  const catPage = new JSDOM(await html(route(locale, "cats"))).window.document;
  for (const videoId of newCatVideoIds) {
    assert(
      catPage.querySelector(`[data-embed-url="https://www.youtube-nocookie.com/embed/${videoId}"]`),
      `${locale} cat page must include the new ${videoId} video`,
    );
  }
}

const layout = await readFile(new URL("src/layouts/PetSittingArticleLayout.astro", root), "utf8");
assert.match(layout, /\.pet-article table\s*\{[^}]*overflow-x:\s*auto/s, "Responsive comparison tables must scroll inside the article on narrow screens");
assert.match(layout, /\.pet-article table\s*\{[^}]*max-width:\s*100%/s, "Comparison tables must not widen the page");

const sitemapFiles = (await readdir(new URL("dist/", root))).filter((name) => /^sitemap.*\.xml$/.test(name));
const sitemapText = (await Promise.all(sitemapFiles.map((name) => readFile(new URL(`dist/${name}`, root), "utf8")))).join("\n");
for (const locale of locales) assert(sitemapText.includes(`https://getmanov.com${route(locale, "prices")}`), `${locale} pricing article must be in the sitemap`);

const viberLogo = await readFile(new URL("public/images/viber-icon.svg", root), "utf8");
assert.match(viberLogo, /fill="#7360F2"/i, "Use the official Viber brand icon asset");
const messagingPageSlugs = [
  "",
  "dogs",
  "cats",
  "home-visits",
  "pet-sitter-vs-boarding",
  "can-cat-stay-alone-for-a-week",
  "prepare-dog-for-boarding",
  "prepare-cat-for-boarding",
  "prices",
];
for (const locale of locales) {
  for (const slug of messagingPageSlugs) {
    const path = route(locale, slug);
    const document = new JSDOM(await html(path)).window.document;
    const viberLinks = [...document.querySelectorAll('.pet-messaging-links a[aria-label*="Viber"]')];
    if (locale === "ru") {
      assert.equal(viberLinks.length, 0, `${path} must not add messaging links to the Russian UI`);
      continue;
    }
    assert(viberLinks.length > 0, `${path} needs the localized Viber contact icon`);
    for (const link of viberLinks) {
      assert.equal(link.querySelector("img.viber-logo")?.getAttribute("src"), "/images/viber-icon.svg", `${path} must use the real Viber logo`);
    }
  }
}

console.log("Pet-sitting pricing guide checks passed for RU, EN, and SR routes.");
