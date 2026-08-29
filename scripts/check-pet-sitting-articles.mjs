import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const slugs = [
  {
    slug: "pet-sitter-vs-boarding",
    service: "main",
    media: { images: 3, videos: 0, animal: "mixed" },
  },
  {
    slug: "can-cat-stay-alone-for-a-week",
    service: "cats",
    media: { images: 2, videos: 0, animal: "cat" },
  },
  {
    slug: "prepare-dog-for-boarding",
    service: "dogs",
    media: { images: 2, videos: 1, animal: "dog" },
  },
  {
    slug: "prepare-cat-for-boarding",
    service: "cats",
    media: { images: 2, videos: 1, animal: "cat" },
  },
];

const servicePath = (locale, service) =>
  `/${locale}/novi-sad/pet-sitting/${service === "main" ? "" : `${service}/`}`;
const articlePath = (locale, slug) => `/${locale}/novi-sad/pet-sitting/${slug}/`;
const htmlFile = (path) => new URL(`dist${path}index.html`, root);

for (const locale of ["ru", "en"]) {
  for (const article of slugs) {
    const path = articlePath(locale, article.slug);
    const counterpartLocale = locale === "ru" ? "en" : "ru";
    const html = await readFile(htmlFile(path), "utf8");
    const dom = new JSDOM(html);
    const document = dom.window.document;

    assert.equal(document.documentElement.lang, locale, `${path} must use the correct lang`);
    assert.equal(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      `https://getmanov.com${path}`,
      `${path} must have its exact canonical`,
    );
    assert.equal(
      document.querySelector(`link[rel="alternate"][hreflang="${counterpartLocale}"]`)?.getAttribute("href"),
      `https://getmanov.com${articlePath(counterpartLocale, article.slug)}`,
      `${path} must link to its localized counterpart`,
    );
    assert(document.querySelector('link[rel="alternate"][hreflang="x-default"]'), `${path} needs x-default`);
    assert(document.querySelector(".article-author"), `${path} needs the shared author trust block`);
    assert(document.querySelector(".article-toc"), `${path} needs the shared table of contents`);
    assert(document.querySelector(".pet-article h1"), `${path} needs a visible H1`);
    assert(
      document.querySelector(`.pet-article a[href="${servicePath(locale, article.service)}"]`),
      `${path} must link to its primary service page`,
    );

    const mediaImages = [...document.querySelectorAll(".pet-article .pet-article-media > img")];
    const mediaVideos = [...document.querySelectorAll(".pet-article .pet-article-video[data-video-id]")];
    assert.equal(mediaImages.length, article.media.images, `${path} has the wrong contextual image count`);
    assert.equal(mediaVideos.length, article.media.videos, `${path} has the wrong contextual video count`);

    for (const image of mediaImages) {
      const src = image.getAttribute("src") ?? "";
      assert(src.endsWith(".webp"), `${path} article images must be WebP: ${src}`);
      assert.equal(image.getAttribute("loading"), "lazy", `${path} article images must be lazy-loaded`);
      const bytes = await readFile(new URL(`public${src}`, root));
      assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${src} must be a genuine WebP`);
      assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${src} must be a genuine WebP`);
    }

    const mediaMarkup = document.querySelector(".pet-article")?.innerHTML ?? "";
    if (article.media.animal === "cat") {
      assert(!mediaMarkup.includes("dog-guest"), `${path} must not use dog media`);
    }
    if (article.media.animal === "dog") {
      assert(!mediaMarkup.includes("cat-guest"), `${path} must not use cat media`);
    }

    assert(!html.includes("chatgpt.com/ru/novi-sad"), `${path} contains a placeholder ChatGPT link`);
    assert(!html.includes("[MEDIA"), `${path} contains a media placeholder`);
    assert(!html.includes("?autoplay="), `${path} must not autoplay video`);
    if (mediaVideos.length) {
      assert(html.includes("www.youtube-nocookie.com/embed/"), `${path} must prepare privacy-enhanced embeds`);
      for (const figure of mediaVideos) {
        assert(figure.querySelector("a[href]"), `${path} video needs a no-JavaScript fallback link`);
      }
    }

    const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((node) => JSON.parse(node.textContent || "{}"));
    const graph = schemas.flatMap((schema) => schema["@graph"] ?? []);
    const articleSchema = graph.find((item) => item["@type"] === "Article");
    const faqSchema = graph.find((item) => item["@type"] === "FAQPage");
    assert.equal(articleSchema?.inLanguage, locale, `${path} Article schema needs its locale`);
    assert(faqSchema?.mainEntity?.length > 0, `${path} needs visible FAQ schema`);
    const visibleText = document.body.textContent.replace(/[‘’]/g, "'");
    for (const question of faqSchema.mainEntity) {
      assert(visibleText.includes(question.name.replace(/[‘’]/g, "'")), `${path} schema question must be visible: ${question.name}`);
    }
  }
}

const expectedGuideCounts = { main: 4, dogs: 2, cats: 3 };
for (const locale of ["ru", "en"]) {
  for (const [service, expectedCount] of Object.entries(expectedGuideCounts)) {
    const path = servicePath(locale, service);
    const html = await readFile(htmlFile(path), "utf8");
    const document = new JSDOM(html).window.document;
    const guideLinks = [...document.querySelectorAll(".guide-section a[href]")];
    assert.equal(guideLinks.length, expectedCount, `${path} has the wrong guide-link count`);
    for (const link of guideLinks) {
      assert(link.getAttribute("href")?.startsWith(`/${locale}/novi-sad/pet-sitting/`), `${path} guide link must stay localized`);
    }
  }
}

console.log("Pet-sitting article checks passed for 8 localized guides and 6 service pages.");
