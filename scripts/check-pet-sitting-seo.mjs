import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { petSittingSchemaIds } from "../src/lib/pet-sitting-seo.mjs";

const projectRoot = new URL("../", import.meta.url);
const locales = ["ru", "en"];
const serviceKinds = ["main", "dogs", "cats", "homeVisits"];
const servicePath = (locale, kind) => `/${locale}/novi-sad/pet-sitting/${kind === "main" ? "" : kind === "homeVisits" ? "home-visits/" : `${kind}/`}`;
const articlePath = (locale, slug) => `/${locale}/novi-sad/pet-sitting/${slug}/`;
const absolute = (path) => new URL(path, "https://getmanov.com").href;

function frontmatterValue(source, key) {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const rawValue = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"))?.[1]?.trim();
  if (!rawValue) return undefined;
  const quote = rawValue[0];
  return (quote === '"' || quote === "'") && rawValue.at(-1) === quote
    ? rawValue.slice(1, -1)
    : rawValue;
}

async function discoverSupportArticles(locale) {
  const directory = new URL(`src/pages/${locale}/novi-sad/pet-sitting/`, projectRoot);
  const entries = await readdir(directory, { withFileTypes: true });
  const articles = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sourceUrl = new URL(`${entry.name}/index.mdx`, directory);
    let source;
    try {
      source = await readFile(sourceUrl, "utf8");
    } catch {
      continue;
    }
    articles.push({
      locale,
      slug: entry.name,
      path: articlePath(locale, entry.name),
      source,
      headline: frontmatterValue(source, "headline"),
      description: frontmatterValue(source, "description"),
      heroImage: frontmatterValue(source, "heroImage"),
      heroImageWidth: Number(frontmatterValue(source, "heroImageWidth")),
      heroImageHeight: Number(frontmatterValue(source, "heroImageHeight")),
      datePublished: frontmatterValue(source, "datePublished"),
      dateModified: frontmatterValue(source, "dateModified"),
      servicePath: frontmatterValue(source, "servicePath"),
    });
  }
  return articles.sort((first, second) => first.slug.localeCompare(second.slug));
}

const discoveredByLocale = Object.fromEntries(await Promise.all(
  locales.map(async (locale) => [locale, await discoverSupportArticles(locale)]),
));
assert.deepEqual(
  discoveredByLocale.ru.map(({ slug }) => slug),
  discoveredByLocale.en.map(({ slug }) => slug),
  "Every discovered support article needs a localized counterpart",
);
const articles = locales.flatMap((locale) => discoveredByLocale[locale]);
assert(articles.length > 0, "At least one pet-sitting support article must be discovered from the source tree");

async function renderedDocument(path) {
  const html = await readFile(new URL(`dist${path}index.html`, projectRoot), "utf8");
  return { html, document: new JSDOM(html).window.document };
}

function schemaGraph(document, path) {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  assert.equal(scripts.length, 1, `${path} should expose one cohesive JSON-LD block`);
  const schema = JSON.parse(scripts[0].textContent || "{}");
  assert.equal(schema["@context"], "https://schema.org", `${path} needs the Schema.org context`);
  assert(Array.isArray(schema["@graph"]), `${path} needs a connected @graph`);
  const ids = schema["@graph"].map((item) => item["@id"]).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, `${path} must not duplicate entity @id values`);
  return schema["@graph"];
}

const hasType = (item, type) => Array.isArray(item?.["@type"])
  ? item["@type"].includes(type)
  : item?.["@type"] === type;
const entitiesOfType = (graph, type) => graph.filter((item) => hasType(item, type));
const entityOfType = (graph, type, path) => {
  const matches = entitiesOfType(graph, type);
  assert.equal(matches.length, 1, `${path} should contain exactly one ${type} entity`);
  return matches[0];
};

function validateAbsoluteSchemaUrls(value, path, parentKey = "") {
  if (Array.isArray(value)) {
    value.forEach((item) => validateAbsoluteSchemaUrls(item, path, parentKey));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (["@id", "url", "contentUrl", "item"].includes(key) && typeof child === "string") {
      assert.match(child, /^https:\/\//, `${path} schema ${key} must be an absolute HTTPS URL`);
    }
    validateAbsoluteSchemaUrls(child, path, key || parentKey);
  }
}

function validatePrivacyAndEntityTypes(graph, path) {
  const serialized = JSON.stringify(graph);
  for (const privateProperty of ["streetAddress", "postalCode", "geo", "latitude", "longitude"]) {
    assert(!serialized.includes(`"${privateProperty}"`), `${path} must not expose private residential ${privateProperty}`);
  }
  assert.equal(entitiesOfType(graph, "LocalBusiness").length, 0, `${path} must not force a LocalBusiness entity`);
  assert.equal(entitiesOfType(graph, "Offer").length, 0, `${path} must not flatten tiered pricing into an Offer`);
  assert.equal(entitiesOfType(graph, "AggregateOffer").length, 0, `${path} must not flatten tiered pricing into an AggregateOffer`);
  validateAbsoluteSchemaUrls(graph, path);
}

function validateHead(document, path, locale, expectedCounterpart, expectedImage, width, height, pageType) {
  const title = document.querySelector("title")?.textContent;
  const description = document.querySelector('meta[name="description"]')?.content;
  const canonicalUrl = absolute(path);
  assert.equal(document.documentElement.lang, locale, `${path} needs the correct document language`);
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1, `${path} needs one canonical`);
  assert.equal(document.querySelector('link[rel="canonical"]')?.href, canonicalUrl, `${path} needs a self-referencing canonical`);
  assert.equal(document.querySelector('meta[name="robots"]')?.content, "index,follow,max-image-preview:large", `${path} must be indexable with large image previews`);
  const expectedAlternates = {
    ru: locale === "ru" ? canonicalUrl : absolute(expectedCounterpart),
    en: locale === "en" ? canonicalUrl : absolute(expectedCounterpart),
    "x-default": locale === "en" ? canonicalUrl : absolute(expectedCounterpart),
  };
  for (const [hreflang, href] of Object.entries(expectedAlternates)) {
    assert.equal(document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`)?.href, href, `${path} has the wrong ${hreflang} alternate`);
  }
  assert.equal(document.querySelector('meta[property="og:type"]')?.content, pageType, `${path} has the wrong Open Graph type`);
  assert.equal(document.querySelector('meta[property="og:title"]')?.content, title, `${path} Open Graph title must match its unique title`);
  assert.equal(document.querySelector('meta[property="og:description"]')?.content, description, `${path} Open Graph description must match its description`);
  assert.equal(document.querySelector('meta[property="og:url"]')?.content, canonicalUrl, `${path} Open Graph URL must match canonical`);
  assert.equal(document.querySelector('meta[property="og:image"]')?.content, expectedImage, `${path} needs its preferred Open Graph image`);
  assert.equal(document.querySelector('meta[property="og:image:secure_url"]')?.content, expectedImage, `${path} needs its secure preferred image`);
  assert.equal(document.querySelector('meta[property="og:image:width"]')?.content, String(width), `${path} needs the real preferred-image width`);
  assert.equal(document.querySelector('meta[property="og:image:height"]')?.content, String(height), `${path} needs the real preferred-image height`);
  assert.equal(document.querySelector('meta[name="twitter:image"]')?.content, expectedImage, `${path} needs the same preferred social image`);
  assert.equal(document.querySelector('meta[name="twitter:card"]')?.content, "summary_large_image", `${path} needs a large-image social card`);
  assert(document.querySelector('meta[property="og:image:alt"]')?.content, `${path} needs preferred-image alt text`);
  return { title, description, canonicalUrl };
}

function validateCommonGraph(graph, path, head, expectedImage, width, height) {
  validatePrivacyAndEntityTypes(graph, path);
  const website = entityOfType(graph, "WebSite", path);
  const webPage = entityOfType(graph, "WebPage", path);
  const image = entityOfType(graph, "ImageObject", path);
  const breadcrumb = entityOfType(graph, "BreadcrumbList", path);
  assert.equal(website["@id"], petSittingSchemaIds.website, `${path} should reuse the site entity`);
  assert.equal(webPage["@id"], `${head.canonicalUrl}#webpage`);
  assert.equal(webPage.url, head.canonicalUrl);
  assert.equal(webPage.name, head.title);
  assert.equal(webPage.description, head.description);
  assert.deepEqual(webPage.isPartOf, { "@id": petSittingSchemaIds.website });
  assert.deepEqual(webPage.primaryImageOfPage, { "@id": image["@id"] });
  assert.deepEqual(webPage.breadcrumb, { "@id": breadcrumb["@id"] });
  assert.equal(image.url, expectedImage);
  assert.equal(image.contentUrl, expectedImage);
  assert.equal(image.width, width);
  assert.equal(image.height, height);
  assert.equal(image.representativeOfPage, true);
  assert.equal(breadcrumb.itemListElement.at(-1)?.item, head.canonicalUrl, `${path} breadcrumb must end at canonical`);
  assert.deepEqual(breadcrumb.itemListElement.map((item) => item.position), breadcrumb.itemListElement.map((_, index) => index + 1));
  return { webPage, image, breadcrumb };
}

function validateVisibleFaq(graph, document, path) {
  const faq = entityOfType(graph, "FAQPage", path);
  const normalizeFaqText = (text) => text?.replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();
  const visibleDetails = [...document.querySelectorAll(".faq-list details, details.pet-article-billing-faq")];
  const visibleFaq = new Map(visibleDetails.map((details) => [
    normalizeFaqText(details.querySelector("summary")?.textContent),
    normalizeFaqText(details.querySelector("p")?.textContent),
  ]));
  for (const heading of document.querySelectorAll(".pet-article h3, .pet-article h4")) {
    if (heading.nextElementSibling?.tagName !== "P") continue;
    visibleFaq.set(
      normalizeFaqText(heading.textContent),
      normalizeFaqText(heading.nextElementSibling.textContent),
    );
  }
  for (const question of faq.mainEntity) {
    const name = normalizeFaqText(question.name);
    const answer = normalizeFaqText(question.acceptedAnswer.text);
    assert.equal(visibleFaq.get(name), answer, `${path} FAQ schema must exactly match the visible answer for: ${name}`);
  }
  if (document.querySelector(".faq-list")) {
    assert.equal(faq.mainEntity.length, visibleDetails.length, `${path} FAQ schema must cover every visible money-page FAQ`);
  }
}

const renderedMoneyPages = new Map();
const auditedGraphs = [];
const serviceSignatures = new Map();
const allTitles = [];
const allDescriptions = [];
const allCanonicalUrls = [];
for (const locale of locales) {
  for (const kind of serviceKinds) {
    const path = servicePath(locale, kind);
    const { document } = await renderedDocument(path);
    renderedMoneyPages.set(`${locale}:${kind}`, document);
    const counterpart = servicePath(locale === "ru" ? "en" : "ru", kind);
    const hero = document.querySelector(".pet-hero img, .hv-hero img");
    const expectedImage = absolute(hero?.getAttribute("src"));
    const width = Number(hero?.getAttribute("width"));
    const height = Number(hero?.getAttribute("height"));
    const head = validateHead(document, path, locale, counterpart, expectedImage, width, height, "website");
    const graph = schemaGraph(document, path);
    auditedGraphs.push(graph);
    const { webPage, image } = validateCommonGraph(graph, path, head, expectedImage, width, height);
    assert.equal(webPage.inLanguage, locale, `${path} WebPage language must match the document`);
    const service = entityOfType(graph, "Service", path);
    assert.equal(service["@id"], petSittingSchemaIds.services[kind], `${path} needs its stable service entity`);
    assert.equal(service.description, head.description);
    assert.deepEqual(service.image, { "@id": image["@id"] });
    assert.deepEqual(service.subjectOf, { "@id": webPage["@id"] });
    assert.deepEqual(webPage.mainEntity, { "@id": service["@id"] });
    assert.deepEqual(service.provider, [
      { "@id": petSittingSchemaIds.anna },
      { "@id": petSittingSchemaIds.ivan },
    ]);
    assert.deepEqual(
      new Set(service.areaServed.map((area) => area.name)),
      kind === "homeVisits" ? new Set(["Novi Sad"]) : new Set(["Novi Sad", "Petrovaradin"]),
    );
    assert.deepEqual(new Set(entitiesOfType(graph, "Person").map((person) => person["@id"])), new Set([petSittingSchemaIds.ivan, petSittingSchemaIds.anna]));
    const ivan = graph.find((entity) => entity["@id"] === petSittingSchemaIds.ivan);
    const anna = graph.find((entity) => entity["@id"] === petSittingSchemaIds.anna);
    assert(ivan && hasType(ivan, "Person"), `${path} needs the shared Ivan Person entity`);
    assert.equal(ivan.name, "Ivan Getmanov");
    assert.deepEqual(ivan.alternateName, ["Иван", "Ваня"]);
    assert(anna && hasType(anna, "Person"), `${path} needs the shared Anna Person entity`);
    assert.equal(anna.name, "Anna Iakushko");
    assert.equal(anna.alternateName, "Аня");
    const oldAnnaFragment = ["#anna", "pet-sitter"].join("-");
    assert(!JSON.stringify(graph).includes(oldAnnaFragment), `${path} must not reference Anna's retired entity ID`);
    const signature = {
      "@type": service["@type"],
      "@id": service["@id"],
      provider: service.provider,
      areaServed: service.areaServed,
      image: service.image,
    };
    if (serviceSignatures.has(kind)) {
      assert.deepEqual(signature, serviceSignatures.get(kind), `${path} must describe the shared ${kind} Service consistently across locales`);
    } else {
      serviceSignatures.set(kind, signature);
    }
    const bodyText = document.body.textContent;
    if (locale === "ru") {
      assert.match(bodyText, /Аня и Ваня/, `${path} should use the conversational RU pair wording`);
      assert.doesNotMatch(bodyText, /Аня и Иван/, `${path} should not use the formal name in the visible RU pair wording`);
    } else {
      assert.match(bodyText, /Anna and Ivan/, `${path} should retain the English pair wording`);
      assert.doesNotMatch(bodyText, /Anna and Vanya/);
    }
    if (kind === "main") {
      const expectedHeroAlt = locale === "ru" ? "Аня с нашим котом" : "Anna holding one of our cats";
      assert.equal(hero.getAttribute("alt"), expectedHeroAlt, `${path} needs image-grounded hero alt text`);
      assert.equal(document.querySelector('meta[property="og:image:alt"]')?.content, expectedHeroAlt);
      assert.equal(document.querySelector('meta[name="twitter:image:alt"]')?.content, expectedHeroAlt);
      const capacityQuestion = locale === "ru"
        ? "Сколько животных у вас бывает одновременно?"
        : "How many guest pets do you host at once?";
      const expectedCapacityAnswer = locale === "ru"
        ? "Одновременно берём максимум двух гостевых животных — и только от одних хозяев. То есть к вашему питомцу не подселим незнакомое животное другого клиента."
        : "We host no more than two guest pets at once, and only from the same owners. We won’t place an unfamiliar animal from another client with your pet.";
      const capacityDetails = [...document.querySelectorAll(".faq-list details")]
        .find((details) => details.querySelector("summary")?.textContent.trim() === capacityQuestion);
      assert.equal(capacityDetails?.querySelector("p")?.textContent.trim(), expectedCapacityAnswer);
      const faq = entityOfType(graph, "FAQPage", path);
      assert.equal(
        faq.mainEntity.find((item) => item.name === capacityQuestion)?.acceptedAnswer?.text,
        expectedCapacityAnswer,
        `${path} capacity policy must match in visible copy and FAQ schema`,
      );
    }
    if (kind === "homeVisits") {
      assert.equal(service["@id"], petSittingSchemaIds.services.homeVisits);
      assert.notEqual(service["@id"], petSittingSchemaIds.services.main);
      assert(document.querySelector('form[data-home-form]'), `${path} needs the home-visit enquiry form`);
      assert(document.querySelector('img[src="/images/pet-sitting/home-visits-area.svg"]'), `${path} needs the static service-area visual`);
      assert(document.body.textContent.includes("Novi Sad") || document.body.textContent.includes("Нови-Сад"));
      assert(document.querySelector(`a[href="${servicePath(locale, "main")}"]`), `${path} must link back to boarding`);
      assert(!document.querySelector('[data-pet-calendar]'), `${path} must not reuse the boarding calendar`);
    }
    validateVisibleFaq(graph, document, path);
    allTitles.push(head.title);
    allDescriptions.push(head.description);
    allCanonicalUrls.push(head.canonicalUrl);
  }
}

for (const article of articles) {
  const { document } = await renderedDocument(article.path);
  const counterpart = articlePath(article.locale === "ru" ? "en" : "ru", article.slug);
  const expectedImage = absolute(article.heroImage);
  const head = validateHead(
    document,
    article.path,
    article.locale,
    counterpart,
    expectedImage,
    article.heroImageWidth,
    article.heroImageHeight,
    "article",
  );
  const graph = schemaGraph(document, article.path);
  auditedGraphs.push(graph);
  const { webPage, image } = validateCommonGraph(
    graph,
    article.path,
    head,
    expectedImage,
    article.heroImageWidth,
    article.heroImageHeight,
  );
  const articleEntity = entityOfType(graph, "Article", article.path);
  assert.equal(webPage.inLanguage, article.locale, `${article.path} WebPage language must match the document`);
  assert.equal(entitiesOfType(graph, "Service").length, 0, `${article.path} must not be marked as a Service page`);
  assert.equal(articleEntity.headline, document.querySelector(".pet-article h1")?.textContent.trim(), `${article.path} Article headline must match the visible H1`);
  assert.equal(articleEntity.headline, article.headline);
  assert.equal(articleEntity.description, article.description);
  assert.equal(articleEntity.inLanguage, article.locale);
  assert.equal(articleEntity.datePublished, article.datePublished);
  assert.equal(articleEntity.dateModified, article.dateModified);
  assert.equal(document.querySelector('meta[property="article:published_time"]')?.content, article.datePublished);
  assert.equal(document.querySelector('meta[property="article:modified_time"]')?.content, article.dateModified);
  assert.deepEqual(articleEntity.mainEntityOfPage, { "@id": webPage["@id"] });
  assert.deepEqual(webPage.mainEntity, { "@id": articleEntity["@id"] });
  assert.deepEqual(articleEntity.image, { "@id": image["@id"] });
  assert.deepEqual(articleEntity.author, { "@id": petSittingSchemaIds.ivan });
  assert.deepEqual(articleEntity.publisher, { "@id": petSittingSchemaIds.ivan });
  assert.deepEqual(new Set(entitiesOfType(graph, "Person").map((person) => person["@id"])), new Set([petSittingSchemaIds.ivan]));
  const ivan = graph.find((entity) => entity["@id"] === petSittingSchemaIds.ivan);
  assert.equal(ivan?.name, "Ivan Getmanov");
  assert.deepEqual(ivan?.alternateName, ["Иван", "Ваня"]);
  const bodyText = document.body.textContent;
  if (article.locale === "ru") assert.doesNotMatch(bodyText, /Аня и Иван/);
  else assert.doesNotMatch(bodyText, /Anna and Vanya/);
  const kind = article.servicePath.endsWith("/dogs/") ? "dogs" : article.servicePath.endsWith("/cats/") ? "cats" : "main";
  assert.deepEqual(articleEntity.about, { "@id": petSittingSchemaIds.services[kind] });
  assert(document.querySelector(`a[href="${article.servicePath}"]`), `${article.path} must link to its relevant money page`);
  assert(document.querySelector(`.pet-article img[src="${article.heroImage}"]`), `${article.path} preferred image must be visible in the article`);
  assert.equal(entitiesOfType(graph, "VideoObject").length, 0, `${article.path} must not invent incomplete VideoObject metadata`);
  validateVisibleFaq(graph, document, article.path);
  allTitles.push(head.title);
  allDescriptions.push(head.description);
  allCanonicalUrls.push(head.canonicalUrl);
}

for (const locale of locales) {
  for (const article of discoveredByLocale[locale]) {
    const linkedFromMoneyPage = serviceKinds.some((kind) =>
      renderedMoneyPages.get(`${locale}:${kind}`)?.querySelector(`a[href="${article.path}"]`),
    );
    assert(linkedFromMoneyPage, `${article.path} must be linked from at least one localized money page`);
  }
}

assert.equal(new Set(allTitles).size, allTitles.length, "Every audited pet-sitting page needs a unique title and og:title");
assert.equal(new Set(allDescriptions).size, allDescriptions.length, "Every audited pet-sitting page needs a unique description and og:description");
assert.equal(new Set(allCanonicalUrls).size, allCanonicalUrls.length, "Every audited pet-sitting page needs a unique canonical and og:url");

const definedEntityIds = new Set(auditedGraphs.flatMap((graph) => graph.map((entity) => entity["@id"]).filter(Boolean)));
function validateEntityReferences(value) {
  if (Array.isArray(value)) return value.forEach(validateEntityReferences);
  if (!value || typeof value !== "object") return;
  if (typeof value["@id"] === "string") {
    assert(definedEntityIds.has(value["@id"]), `Unresolved pet-sitting entity reference: ${value["@id"]}`);
  }
  Object.values(value).forEach(validateEntityReferences);
}
auditedGraphs.forEach(validateEntityReferences);

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const item = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
    if (entry.isDirectory()) files.push(...await filesBelow(item));
    else files.push(item);
  }
  return files;
}

const privatePhoneDigits = ["381", "628", "426", "881"].join("");
for (const file of await filesBelow(new URL("dist/", projectRoot))) {
  const contents = await readFile(file);
  assert.equal(contents.includes(Buffer.from(privatePhoneDigits)), false, `Private phone number leaked into ${file.pathname}`);
}

console.log(`Pet-sitting SEO checks passed for 8 money pages and ${articles.length} discovered localized support articles.`);
