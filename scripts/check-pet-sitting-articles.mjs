import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const slugs = [
  {
    slug: "pet-sitter-vs-boarding",
    service: "main",
    media: {
      ru: { images: 4, videos: 3, groups: [2, 2, 3], animal: "mixed" },
      en: { images: 3, videos: 0, groups: [], animal: "mixed" },
    },
  },
  {
    slug: "can-cat-stay-alone-for-a-week",
    service: "cats",
    media: {
      ru: { images: 5, videos: 1, groups: [], animal: "cat" },
      en: { images: 2, videos: 0, groups: [], animal: "cat" },
    },
  },
  {
    slug: "prepare-dog-for-boarding",
    service: "dogs",
    media: {
      ru: { images: 4, videos: 5, groups: [], animal: "dog" },
      en: { images: 2, videos: 1, groups: [], animal: "dog" },
    },
  },
  {
    slug: "prepare-cat-for-boarding",
    service: "cats",
    media: {
      ru: { images: 7, videos: 1, groups: [2, 2], animal: "cat" },
      en: { images: 2, videos: 1, groups: [], animal: "cat" },
    },
  },
];

const copyHashes = {
  ru: {
    "pet-sitter-vs-boarding": "c41f56b9431d222a89ac16aa31a013ec331b120353f96fa6d75b99e30ddd4bb1",
    "can-cat-stay-alone-for-a-week": "4fc36aec7d5c992d92b32a099265fbd1b48d474728cc2bdbc754f48a28b86c8c",
    "prepare-dog-for-boarding": "648487a53390195c432448aa3ff29cd482e53a70c3ca58f7e4a434ffc0090c13",
    "prepare-cat-for-boarding": "963600d79d91c45be8e5353b4f9c9bcf144339532bd29d9d8cf7c3e766f12520",
  },
  en: {
    "pet-sitter-vs-boarding": "87d87fbfcad2a86a5269ea6757854f207a3b36cc81a850b0fbb677482585d268",
    "can-cat-stay-alone-for-a-week": "e306abef7d1f3fbc0d27abef7f4f317a257784307272ca3e866447883f1a51b0",
    "prepare-dog-for-boarding": "adde415e61b1cfc9af452b4860c2ddd45949fd3aabb766189a9e2f3b5e224203",
    "prepare-cat-for-boarding": "4abec575e3e1928fd978b95b7607f498dbe0ba2bae70275728e6ba270e0f3e81",
  },
};
const interactionSelectors = {
  "pet-sitter-vs-boarding": '[data-article-decision-tool][data-tool-type="care_comparison"]',
  "can-cat-stay-alone-for-a-week": '[data-cat-care-tool][data-tool-type="cat_care_options"]',
  "prepare-dog-for-boarding": '[data-article-checklist][data-tool-type="dog_preparation_checklist"]',
  "prepare-cat-for-boarding": '[data-article-checklist][data-tool-type="cat_preparation_checklist"]',
};
const placementBounds = {
  ru: {
    "pet-sitter-vs-boarding": ["Четыре основных варианта", "Визиты зооняни: животное остаётся дома", "Домашняя передержка: питомец живёт дома у ситтера", "Зоогостиница"],
    "can-cat-stay-alone-for-a-week": ["Можно ли оставить кошку одну на неделю?", "А если поставить автоматическую кормушку?", "Когда домашняя передержка может оказаться лучше", "Что для кошки хуже: новое место или одиночество?"],
    "prepare-dog-for-boarding": ["Короткий чек-лист перед передержкой", "Расскажите, как собака реально живёт дома", "Если собака никогда не оставалась с чужими — можно сделать пробу", "Не переучивайте собаку специально перед передержкой"],
    "prepare-cat-for-boarding": ["Короткий чек-лист", "Проверьте прививки заранее", "А что с переноской?", "Расскажите ситтеру, какой ваша кошка бывает на самом деле"],
  },
  en: {
    "pet-sitter-vs-boarding": ["The four main options", "Drop-in visits: the pet remains at home", "Home boarding: the pet stays in the sitter's home", "Pet hotels"],
    "can-cat-stay-alone-for-a-week": ["Can you leave a cat alone for a week?", "What if you use an automatic feeder?", "When home boarding may be a better option", "Which is harder for the cat: a new place or being alone?"],
    "prepare-dog-for-boarding": ["A short pre-boarding checklist", "Explain how your dog actually lives at home", "If the dog has never stayed with someone else, try a short visit", "Do not try to retrain the dog specifically for boarding"],
    "prepare-cat-for-boarding": ["A short checklist", "Check vaccinations in advance", "What about the carrier?", "Tell the sitter what your cat is actually like"],
  },
};

const servicePath = (locale, service) =>
  `/${locale}/novi-sad/pet-sitting/${service === "main" ? "" : `${service}/`}`;
const articlePath = (locale, slug) => `/${locale}/novi-sad/pet-sitting/${slug}/`;
const htmlFile = (path) => new URL(`dist${path}index.html`, root);

for (const locale of ["ru", "en"]) {
  for (const article of slugs) {
    const path = articlePath(locale, article.slug);
    const expectedMedia = article.media[locale];
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
    const helper = document.querySelector('[data-article-interaction="helper"]');
    const booking = document.querySelector('[data-article-interaction="booking"]');
    const calendar = booking?.querySelector("[data-pet-calendar]");
    assert(document.querySelector(interactionSelectors[article.slug]), `${path} needs its mapped localized helper`);
    assert(helper, `${path} needs one early helper`);
    assert(booking, `${path} needs one contextual booking block`);
    assert.equal(document.querySelectorAll('[data-article-interaction="helper"]').length, 1, `${path} must not duplicate its helper`);
    assert.equal(document.querySelectorAll('[data-article-interaction="booking"]').length, 1, `${path} must not duplicate its booking block`);
    assert.equal(document.querySelectorAll("[data-pet-calendar]").length, 1, `${path} must render one shared calendar`);
    assert(calendar, `${path} needs the full shared calendar inside its booking block`);
    assert.equal(calendar.classList.contains("availability--compact"), false, `${path} must not use the removed compact variant`);
    const calendarConfig = JSON.parse(calendar.getAttribute("data-pet-calendar"));
    assert.equal(calendarConfig.locale, locale);
    assert.equal(calendarConfig.articleSlug, article.slug);
    assert.equal(calendarConfig.sourcePage, path);
    assert(document.querySelector("#boarding-days.pet-article-billing-faq"), `${path} needs the shared billing FAQ anchor`);

    const headings = [...document.querySelectorAll(".pet-article h1, .pet-article h2")];
    const normalizeApostrophes = (text) => text.replace(/[‘’]/g, "'").trim();
    const heading = (text) => headings.find((node) => normalizeApostrophes(node.textContent) === normalizeApostrophes(text));
    const [helperAfter, helperBefore, bookingAfter, bookingBefore] = placementBounds[locale][article.slug];
    for (const title of [helperAfter, helperBefore, bookingAfter, bookingBefore]) {
      assert(heading(title), `${path} is missing placement boundary: ${title}`);
    }
    assert(heading(helperAfter).compareDocumentPosition(helper) & 4, `${path} helper must follow ${helperAfter}`);
    assert(helper.compareDocumentPosition(heading(helperBefore)) & 4, `${path} helper must precede ${helperBefore}`);
    assert(heading(bookingAfter).compareDocumentPosition(booking) & 4, `${path} booking must follow ${bookingAfter}`);
    assert(booking.compareDocumentPosition(heading(bookingBefore)) & 4, `${path} booking must precede ${bookingBefore}`);

    if (article.slug === "pet-sitter-vs-boarding") {
      assert.equal(helper.querySelectorAll("select").length, 0, `${path} comparison helper must not use dropdowns`);
      assert.equal(helper.querySelectorAll('input[type="radio"]').length, 10, `${path} comparison helper needs all ten visible radio options`);
      for (const [name, count] of [["alone", 3], ["newPlace", 3], ["company", 2], ["care", 2]]) {
        assert.equal(helper.querySelectorAll(`input[type="radio"][name="${name}"]`).length, count, `${path} has the wrong ${name} option count`);
      }
      const optionLabels = [...helper.querySelectorAll(".pet-article-options span")].map((node) => node.textContent.trim());
      const questionLabels = [...helper.querySelectorAll(".pet-article-question legend")].map((node) => node.textContent.trim());
      const expectedOptions = locale === "ru"
        ? ["Да", "Не всегда", "Нет", "Обычно нет", "Да", "Пока не знаем", "Да", "Нет", "Да", "Нет"]
        : ["Yes", "Not always", "No", "Usually not", "Yes", "We do not know yet", "Yes", "No", "Yes", "No"];
      const expectedQuestions = locale === "ru"
        ? ["Питомец спокойно остаётся один?", "Сильно ли он стрессует в новом месте?", "Нужен ли человек рядом большую часть дня?", "Нужны частый контроль или лекарства?"]
        : ["Can your pet stay alone comfortably?", "Does a new place cause significant stress?", "Does your pet need a person nearby for most of the day?", "Does your pet need frequent monitoring or medication?"];
      assert.deepEqual(optionLabels, expectedOptions, `${path} must expose the approved options in order`);
      assert.deepEqual(questionLabels, expectedQuestions, `${path} must preserve the approved question wording`);
      assert.deepEqual(
        [...helper.querySelectorAll('input[type="radio"]')].map((input) => input.value),
        ["yes", "sometimes", "no", "low", "high", "unknown", "yes", "no", "yes", "no"],
        `${path} must preserve the existing recommendation values`,
      );
    }

    const mediaImages = [...document.querySelectorAll(".pet-article .pet-article-media > img")];
    const mediaVideos = [...document.querySelectorAll(".pet-article .pet-article-video[data-video-id]")];
    assert.equal(mediaImages.length, expectedMedia.images, `${path} has the wrong contextual image count`);
    assert.equal(mediaVideos.length, expectedMedia.videos, `${path} has the wrong contextual video count`);
    const mediaGroupSizes = [...document.querySelectorAll(".pet-article-media-group")]
      .map((group) => [...group.children].filter((child) => child.matches(".pet-article-media")).length);
    assert.deepEqual(mediaGroupSizes, expectedMedia.groups, `${path} has the wrong related-media grouping`);

    const imageSources = mediaImages.map((image) => image.getAttribute("src"));
    const videoIds = mediaVideos.map((video) => video.getAttribute("data-video-id"));
    assert.equal(new Set(imageSources).size, imageSources.length, `${path} must not repeat contextual images`);
    assert.equal(new Set(videoIds).size, videoIds.length, `${path} must not repeat contextual videos`);

    for (const image of mediaImages) {
      const src = image.getAttribute("src") ?? "";
      assert(src.endsWith(".webp"), `${path} article images must be WebP: ${src}`);
      assert.equal(image.getAttribute("loading"), "lazy", `${path} article images must be lazy-loaded`);
      const bytes = await readFile(new URL(`public${src}`, root));
      assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", `${src} must be a genuine WebP`);
      assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", `${src} must be a genuine WebP`);
    }

    const mediaMarkup = document.querySelector(".pet-article")?.innerHTML ?? "";
    if (expectedMedia.animal === "cat") {
      assert(!mediaMarkup.includes("dog-guest"), `${path} must not use dog media`);
    }
    if (expectedMedia.animal === "dog") {
      assert(!mediaMarkup.includes("cat-guest"), `${path} must not use cat media`);
    }
    const figureText = [...document.querySelectorAll(".pet-article-media")]
      .map((figure) => figure.textContent)
      .join(" ");
    const figureAlts = mediaImages.map((image) => image.getAttribute("alt") ?? "").join(" ");
    const factualLabels = `${figureText} ${figureAlts}`;
    assert(!/Петроварадин|Нови[ -]?Сад|Petrovaradin|Novi Sad/iu.test(factualLabels), `${path} media must not claim an unverified location`);
    assert(!/у нас дома|in our home/iu.test(factualLabels), `${path} media must not claim an unverified current-home context`);

    assert(!html.includes("chatgpt.com/ru/novi-sad"), `${path} contains a placeholder ChatGPT link`);
    assert(!html.includes("[MEDIA"), `${path} contains a media placeholder`);
    assert(!html.includes("?autoplay="), `${path} must not autoplay video`);
    if (mediaVideos.length) {
      const scriptSources = [...document.querySelectorAll('script[src^="/_astro/"]')]
        .map((script) => script.getAttribute("src"));
      const bundledScripts = await Promise.all(
        scriptSources.map((src) => readFile(new URL(`dist${src}`, root), "utf8")),
      );
      assert(
        bundledScripts.some((source) => source.includes("www.youtube-nocookie.com/embed/")),
        `${path} must prepare privacy-enhanced embeds`,
      );
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

for (const locale of ["ru", "en"]) {
  for (const [slug, expectedHash] of Object.entries(copyHashes[locale])) {
    const source = await readFile(new URL(`src/pages/${locale}/novi-sad/pet-sitting/${slug}/index.mdx`, root), "utf8");
    const copyWithoutInteractionsOrMedia = source
      .replace(/^import PetSittingArticleInteraction[^\n]*\n\s*/m, "")
      .replace(/^<PetSittingArticleInteraction[^\n]*\/>\n\s*/gm, "")
      .replace(/<div class="pet-article-media-group[^"]*">[\s\S]*?<\/div>\s*/g, "")
      .replace(/<figure class="pet-article-media[\s\S]*?<\/figure>\s*/g, "");
    const actualHash = createHash("sha256").update(copyWithoutInteractionsOrMedia).digest("hex");
    assert.equal(actualHash, expectedHash, `${locale}/${slug} article prose changed outside component and media insertions`);
  }
}

const moneyPageCases = [
  { locale: "ru", service: "main", h1: "Домашняя передержка собак и кошек в Нови‑Саде", hero: "/images/pet-sitting/main-hero.webp" },
  { locale: "ru", service: "dogs", h1: "Передержка собак в Нови‑Саде", hero: "/images/pet-sitting/dog-guest-02.webp" },
  { locale: "ru", service: "cats", h1: "Передержка кошек в Нови‑Саде", hero: "/images/pet-sitting/cats-hero.webp" },
  { locale: "en", service: "main", h1: "Home pet boarding for dogs and cats in Novi Sad", hero: "/images/pet-sitting/main-hero.webp" },
  { locale: "en", service: "dogs", h1: "Dog boarding in Novi Sad", hero: "/images/pet-sitting/dog-guest-02.webp" },
  { locale: "en", service: "cats", h1: "Cat boarding in Novi Sad", hero: "/images/pet-sitting/cats-hero.webp" },
];
const expectedMoneyPageSections = [
  "pet-hero",
  "early-media",
  "availability",
  "pricing-section",
  "faq-section",
  "final-cta",
];
const removedMoneyPageSelectors = [
  ".routine-section",
  ".resident-section",
  ".intro-section",
  ".species-intro",
  ".dog-cats-section",
  ".dog-trial",
  ".cat-safe-space",
  ".cat-arrival",
  ".related-section",
  ".guide-section",
];
const requiredMoneyPageFaqs = {
  ru: {
    main: [
      "Как считаются сутки передержки?",
      "Кто вы и с кем будет жить мой питомец?",
      "Как вы сохраняете привычный режим питомца?",
      "Как всё устроено дома?",
      "А если мой питомец не подружится с вашими котами?",
      "А нормально вообще оставлять животное там, где уже есть другие животные?",
      "Сколько животных у вас бывает одновременно?",
      "Можно сначала приехать познакомиться?",
      "А можно оставить питомца на пробу?",
      "Что взять с собой?",
      "Будете присылать фото и видео?",
      "Что если у моего питомца какой-то очень специфический режим?",
      "А если что-нибудь пойдёт не так?",
    ],
    dogs: [
      "Как считаются сутки передержки?",
      "Кто вы и с кем будет жить мой питомец?",
      "Моя собака любит гоняться за кошками. Вы её возьмёте?",
      "А если собака не подружится с вашими котами?",
      "Моя собака никогда не оставалась с чужими. Что делать?",
      "Она вообще не умеет оставаться одна.",
      "Сколько раз вы будете гулять?",
      "Можно привезти свой корм?",
      "Можно давать лекарства?",
      "Можно собаке на диван или кровать?",
      "Можно сначала приехать познакомиться?",
      "Можно ли оставить собаку на пробу?",
      "Что взять с собой?",
      "Будете присылать фото и видео?",
      "Что если что-то неожиданное случится, пока меня нет?",
    ],
    cats: [
      "Как считаются сутки передержки?",
      "Кто вы и с кем будет жить мой питомец?",
      "Какие нужны прививки?",
      "А если моя кошка вообще не любит других кошек?",
      "А если она спрячется и не будет выходить?",
      "Нужно ли знакомить её с вашими котами?",
      "Можно привезти свой лоток и наполнитель?",
      "Можно привезти привычный корм?",
      "Что если у неё особый режим?",
      "Можно давать лекарства?",
      "Можно ли ей на диван или кровать?",
      "Нужно ли заранее привозить кошку знакомиться?",
      "Что взять с собой?",
      "Будете присылать фото и видео?",
      "А если кошке внезапно станет плохо?",
    ],
  },
  en: {
    main: [
      "How are boarding days calculated?",
      "Who are you, and who will my pet stay with?",
      "How do you keep my pet's normal routine?",
      "Where will my pet stay?",
      "What if my pet does not get along with your cats?",
      "Is it okay that other animals already live in the home?",
      "How many guest pets do you host at once?",
      "Can we meet you first?",
      "Can I leave my pet for a short trial stay?",
      "What should I bring?",
      "Will you send photos and videos?",
      "What if my pet has an unusual routine?",
      "What happens if something goes wrong?",
    ],
    dogs: [
      "How are boarding days calculated?",
      "Who are you, and who will my pet stay with?",
      "My dog likes chasing cats. Will you take them?",
      "What if my dog does not get along with your cats?",
      "My dog has never stayed with strangers before. What should I do?",
      "My dog cannot stay alone.",
      "How often will you walk my dog?",
      "Can I bring their normal food?",
      "Can you give medication?",
      "Can my dog sleep on the sofa or bed?",
      "Can we meet you first?",
      "Can I leave my dog for a trial stay?",
      "What should I bring?",
      "Will you send photos and videos?",
      "What happens in an emergency?",
    ],
    cats: [
      "How are boarding days calculated?",
      "Who are you, and who will my pet stay with?",
      "Which vaccinations are required?",
      "My cat really does not like other cats. Is that a problem?",
      "What if my cat hides and refuses to come out?",
      "Does my cat have to meet your cats?",
      "Can I bring their own litter box and litter?",
      "Can I bring their normal food?",
      "What if my cat has a particular routine?",
      "Can you give medication?",
      "Can they sleep on the sofa or bed?",
      "Should I bring my cat for an introduction first?",
      "What should I bring?",
      "Will you send photos and videos?",
      "What happens if my cat suddenly becomes ill?",
    ],
  },
};
const preservedMoneyPageFacts = {
  "ru:main": [
    "У каждого питомца свои привычки, и мы не меняем их просто потому, что хозяин уехал.",
    "Двора и балкона нет.",
    "Пабло очень дружелюбный и любопытный.",
    "Свит более пугливая",
    "Кошку приносить на знакомство не рекомендуем",
    "Корм, миски, поводок или переноску, лекарства, игрушки, любимую лежанку",
  ],
  "ru:dogs": [
    "Передержка — не время вводить новые правила.",
    "сможем быть рядом с собакой 24/7",
    "Обычный интерес, желание понюхать, познакомиться или поиграть",
    "Тестовая передержка стоит 1 000 RSD.",
    "У нас нет правила «всем собакам две прогулки по двадцать минут».",
    "Если собака спит на своей лежанке",
    "То же самое с кормлением, лекарствами",
  ],
  "ru:cats": [
    "В квартире три изолированные комнаты.",
    "Наши коты Пабло и Свит",
    "Передержка — не время вводить новые правила.",
    "Саму кошку приносить на знакомство не рекомендуем",
    "оставить кошку тестово на несколько часов",
    "Привозите привычный корм, миски, лоток, наполнитель, игрушки",
    "Можно давать лекарства?",
  ],
  "en:main": [
    "Every pet has different habits",
    "There is no garden or balcony.",
    "Pablo is very friendly and curious.",
    "Sweet is more cautious",
    "Food, bowls, lead, carrier, medication, toys",
  ],
  "en:dogs": [
    "not a particularly good time to suddenly introduce a completely new set of rules",
    "one of us is home while the dog is staying with us",
    "Normal curiosity, sniffing, wanting to meet them",
    "a few hours for 1,000 RSD",
    "There is no rule here that every dog gets exactly two twenty-minute walks.",
    "If your dog sleeps in their own bed at home",
  ],
  "en:cats": [
    "There are three separate rooms in the apartment.",
    "Pablo is very friendly and curious.",
    "We are not going to deliberately change your cat's habits",
    "do not recommend bringing your cat for a short introduction",
    "Trial stay: 1,000 RSD.",
    "litter box, usual litter, toys and medication",
  ],
};

for (const page of moneyPageCases) {
  const path = servicePath(page.locale, page.service);
  const html = await readFile(htmlFile(path), "utf8");
  const document = new JSDOM(html).window.document;
  const pageRoot = document.querySelector(".pet-page");
  assert(pageRoot, path + " needs the shared money-page root");
  assert.equal(document.querySelector("h1")?.textContent.trim(), page.h1, path + " H1 changed");
  assert.equal(document.querySelector(".pet-hero img")?.getAttribute("src"), page.hero, path + " hero asset changed without a confirmed couple photo");

  const sectionOrder = [...pageRoot.querySelectorAll(":scope > section")].map((section) =>
    section.className.split(/\s+/)[0],
  );
  assert.deepEqual(sectionOrder, expectedMoneyPageSections, path + " has the wrong simplified section order");
  for (const selector of removedMoneyPageSelectors) {
    assert.equal(pageRoot.querySelector(selector), null, path + " must not render removed money-page block " + selector);
  }

  const heroActions = [...document.querySelectorAll(".pet-hero .pet-actions a")];
  assert.equal(heroActions.length, 2, path + " needs exactly two hero actions");
  assert.equal(heroActions[0].getAttribute("href"), "#dates");
  assert.equal(heroActions[1].getAttribute("href"), "https://t.me/ya_kushka");
  assert.equal(heroActions[0].textContent.trim(), page.locale === "ru" ? "Проверить даты" : "Check available dates");
  assert.equal(heroActions[1].textContent.trim(), page.locale === "ru" ? "Написать Ане в Telegram" : "Message Anna on Telegram");

  const proof = document.querySelector(".early-media");
  assert.equal(proof?.querySelector("h2")?.textContent.trim(), page.locale === "ru" ? "Фото и видео каждый день" : "Photos and videos every day");
  assert(
    proof?.textContent.includes(page.locale === "ru" ? "минимум 3 раза в день" : "at least three times a day"),
    path + " must preserve the three-updates-per-day commitment",
  );
  assert.equal(proof?.querySelectorAll(".pet-media").length, 1, path + " needs one proof gallery");

  const finalActions = [...document.querySelectorAll(".final-cta .pet-actions a")];
  assert.equal(finalActions.length, 2, path + " needs two compact final actions");
  assert.equal(finalActions[0].getAttribute("href"), "#dates");
  assert.equal(finalActions[1].getAttribute("href"), "https://t.me/ya_kushka");

  const details = [...document.querySelectorAll(".faq-list details")];
  const visibleQuestions = details.map((item) => item.querySelector("summary")?.textContent.trim());
  assert.deepEqual(visibleQuestions, requiredMoneyPageFaqs[page.locale][page.service], path + " FAQ topics changed");
  assert(details[0].hasAttribute("open"), path + " should open the billing FAQ");
  assert(details.slice(1).every((item) => !item.hasAttribute("open")), path + " should collapse secondary FAQs");

  const visibleFaq = new Map(details.map((item) => [
    item.querySelector("summary")?.textContent.replace(/\s+/g, " ").trim(),
    item.querySelector("p")?.textContent.replace(/\s+/g, " ").trim(),
  ]));
  const schemas = [...document.querySelectorAll("script[type=\"application/ld+json\"]")]
    .map((node) => JSON.parse(node.textContent || "{}"));
  const faqSchema = schemas
    .flatMap((schema) => Array.isArray(schema) ? schema : schema["@graph"] ?? [schema])
    .find((item) => item["@type"] === "FAQPage");
  const schemaFaq = new Map(faqSchema.mainEntity.map((item) => [
    item.name.replace(/\s+/g, " ").trim(),
    item.acceptedAnswer.text.replace(/\s+/g, " ").trim(),
  ]));
  assert.deepEqual(schemaFaq, visibleFaq, path + " visible FAQ and FAQPage schema must match");

  const normalizedBody = document.body.textContent.replace(/\s+/g, " ");
  for (const fact of preservedMoneyPageFacts[page.locale + ":" + page.service]) {
    assert(normalizedBody.includes(fact), path + " lost approved service information: " + fact);
  }
}

const weakCommitmentPattern = /\b(?:постараемся|попытаемся|стараемся|пытаемся)\b/iu;
for (const article of slugs) {
  const path = articlePath("ru", article.slug);
  const html = await readFile(htmlFile(path), "utf8");
  assert(!weakCommitmentPattern.test(new JSDOM(html).window.document.body.textContent), `${path} contains weak service wording`);
}
for (const service of ["main", "dogs", "cats"]) {
  const path = servicePath("ru", service);
  const html = await readFile(htmlFile(path), "utf8");
  assert(!weakCommitmentPattern.test(new JSDOM(html).window.document.body.textContent), `${path} contains weak service wording`);
}

const analyticsSources = await Promise.all([
  "PetSittingCalendar.astro",
  "PetSittingComparisonHelper.astro",
  "CatCareOptionsHelper.astro",
  "PetSittingChecklist.astro",
].map((file) => readFile(new URL(`src/components/${file}`, root), "utf8")));
const analyticsSource = analyticsSources.join("\n");
for (const eventName of [
  "pet_sitting_article_availability_open",
  "pet_sitting_article_enquiry_start",
  "pet_sitting_article_tool_start",
  "pet_sitting_article_tool_result",
  "pet_sitting_article_checklist_interaction",
]) {
  assert(analyticsSource.includes(eventName), `Article analytics event must remain wired: ${eventName}`);
}

console.log("Pet-sitting article checks passed for 8 localized guides and 6 service pages.");
