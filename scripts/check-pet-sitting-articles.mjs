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
      ru: { images: 4, videos: 3, animal: "mixed" },
      en: { images: 3, videos: 0, animal: "mixed" },
    },
  },
  {
    slug: "can-cat-stay-alone-for-a-week",
    service: "cats",
    media: {
      ru: { images: 5, videos: 1, animal: "cat" },
      en: { images: 2, videos: 0, animal: "cat" },
    },
  },
  {
    slug: "prepare-dog-for-boarding",
    service: "dogs",
    media: {
      ru: { images: 4, videos: 5, animal: "dog" },
      en: { images: 2, videos: 1, animal: "dog" },
    },
  },
  {
    slug: "prepare-cat-for-boarding",
    service: "cats",
    media: {
      ru: { images: 7, videos: 1, animal: "cat" },
      en: { images: 2, videos: 1, animal: "cat" },
    },
  },
];

const russianCopyHashes = {
  "pet-sitter-vs-boarding": "c41f56b9431d222a89ac16aa31a013ec331b120353f96fa6d75b99e30ddd4bb1",
  "can-cat-stay-alone-for-a-week": "4fc36aec7d5c992d92b32a099265fbd1b48d474728cc2bdbc754f48a28b86c8c",
  "prepare-dog-for-boarding": "648487a53390195c432448aa3ff29cd482e53a70c3ca58f7e4a434ffc0090c13",
  "prepare-cat-for-boarding": "963600d79d91c45be8e5353b4f9c9bcf144339532bd29d9d8cf7c3e766f12520",
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

    const mediaImages = [...document.querySelectorAll(".pet-article .pet-article-media > img")];
    const mediaVideos = [...document.querySelectorAll(".pet-article .pet-article-video[data-video-id]")];
    assert.equal(mediaImages.length, expectedMedia.images, `${path} has the wrong contextual image count`);
    assert.equal(mediaVideos.length, expectedMedia.videos, `${path} has the wrong contextual video count`);

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
    if (locale === "ru") {
      const figureText = [...document.querySelectorAll(".pet-article-media")]
        .map((figure) => figure.textContent)
        .join(" ");
      const figureAlts = mediaImages.map((image) => image.getAttribute("alt") ?? "").join(" ");
      assert(!/Петроварадин|Нови[ -]?Сад/iu.test(`${figureText} ${figureAlts}`), `${path} media must not claim an unverified location`);
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

for (const [slug, expectedHash] of Object.entries(russianCopyHashes)) {
  const source = await readFile(new URL(`src/pages/ru/novi-sad/pet-sitting/${slug}/index.md`, root), "utf8");
  const copyWithoutMedia = source.replace(/<figure class="pet-article-media[\s\S]*?<\/figure>\s*/g, "");
  const actualHash = createHash("sha256").update(copyWithoutMedia).digest("hex");
  assert.equal(actualHash, expectedHash, `${slug} article copy changed outside contextual media figures`);
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

const russianDogPath = servicePath("ru", "dogs");
const russianDogHtml = await readFile(htmlFile(russianDogPath), "utf8");
const russianDogDocument = new JSDOM(russianDogHtml).window.document;
const russianDogBlocks = [...russianDogDocument.querySelectorAll("h2, p")]
  .map((node) => node.textContent.replace(/\s+/g, " ").trim());
const approvedRussianDogBlocks = [
  "Переживаете, с кем оставить питомца на время отъезда?",
  "Домашняя передержка помогает сохранить для собаки привычный ритм жизни, пока хозяина нет рядом. Мы придерживаемся обычной рутины собаки: графика прогулок и кормления, игр, отдыха и других важных для неё вещей.",
  "Регулярно присылаем фото и видео, рассказываем, как дела у питомца, и всегда остаёмся на связи.",
  "Передержка проходит в нашей квартире в Петроварадине.",
  "Фото и видео каждый день",
  "Мы знаем, как тревожно оставлять любимого питомца, поэтому присылаем фото и видео минимум 3 раза в день. Не ограничиваемся сообщением «всё хорошо», а показываем, как на самом деле проходит день собаки у нас.",
  "Прогулки, сон, игры, валяние на диване, знакомство с котами — всё, что происходит в течение дня.",
  "Никаких резких изменений",
  "Передержка — не время вводить новые правила. Перед заездом мы узнаём привычный режим вашей собаки и придерживаемся его на протяжении всей передержки.",
  "Сколько прогулок нужно? Когда и сколько ест? Где любит спать? Спокойно ли остаётся одна? Принимает ли лекарства?",
  "Расскажите нам заранее обо всём, что считаете важным, — и мы это учтём.",
  "Если собака не остаётся одна",
  "Такое тоже бывает. Если вашему питомцу постоянно нужен человек рядом, скажите об этом до передержки. Мы организуем всё так, чтобы во время проживания собаки дома всегда был кто-то из нас.",
  "Такую потребность важно обсудить заранее, чтобы мы могли спланировать своё время и подтвердить, что сможем быть рядом с собакой 24/7.",
  "У нас есть два своих кота",
  "Если вы не знаете, как ваша собака относится к кошкам, это лучше проверить заранее.",
  "Обычный интерес, желание понюхать, познакомиться или поиграть — нормальная реакция и не преграда для совместного проживания.",
  "Если же собака охотится за кошками, не может переключиться или проявляет серьёзную агрессию, честнее будет выбрать ситтера без своих кошек.",
  "Именно для этого у нас есть бесплатное знакомство.",
  "А если они просто не понравятся друг другу?",
  "Это не страшно.",
  "У нас три изолированные комнаты, и животным совсем не обязательно становиться лучшими друзьями.",
  "Мы разделяем питомцев так, чтобы у каждого оставалось своё безопасное пространство. При этом собака продолжает общаться с нами, гулять и жить в своём обычном ритме.",
  "познакомимся заранее",
  "Перед первой передержкой мы приглашаем зайти к нам домой на 30 минут — это бесплатно. Собака познакомится с нами, квартирой и котами, а вы сами увидите, где и с кем она будет жить.",
  "Если хочется проверить, как собака чувствует себя без хозяина, можно оставить её у нас на 3–4 часа. Тестовая передержка стоит 1 000 RSD.",
  "Гуляем так, как собака привыкла",
  "У нас нет правила «всем собакам две прогулки по двадцать минут». Если ваш питомец привык к определённому графику и длительности прогулок — расскажите нам, и мы будем его соблюдать.",
  "То же самое с кормлением, лекарствами и другими привычными вещами.",
  "Где питомец будет спать?",
  "Там, где привык дома. Если собака спит на своей лежанке — возьмите её с собой, знакомое место поможет ей быстрее освоиться.",
  "Привыкла отдыхать на диване — пожалуйста. Спит с человеком на кровати — мы только за.",
];
for (const block of approvedRussianDogBlocks) {
  assert(russianDogBlocks.includes(block), `${russianDogPath} is missing approved copy: ${block}`);
}

const weakCommitmentPattern = /\b(?:постараемся|попытаемся|стараемся|пытаемся)\b/iu;
for (const article of slugs) {
  const path = articlePath("ru", article.slug);
  const html = await readFile(htmlFile(path), "utf8");
  assert(!weakCommitmentPattern.test(new JSDOM(html).window.document.body.textContent), `${path} contains weak service wording`);
}
for (const service of Object.keys(expectedGuideCounts)) {
  const path = servicePath("ru", service);
  const html = await readFile(htmlFile(path), "utf8");
  assert(!weakCommitmentPattern.test(new JSDOM(html).window.document.body.textContent), `${path} contains weak service wording`);
}

console.log("Pet-sitting article checks passed for 8 localized guides and 6 service pages.");
