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

const russianCopyHashes = {
  "pet-sitter-vs-boarding": "c41f56b9431d222a89ac16aa31a013ec331b120353f96fa6d75b99e30ddd4bb1",
  "can-cat-stay-alone-for-a-week": "4fc36aec7d5c992d92b32a099265fbd1b48d474728cc2bdbc754f48a28b86c8c",
  "prepare-dog-for-boarding": "648487a53390195c432448aa3ff29cd482e53a70c3ca58f7e4a434ffc0090c13",
  "prepare-cat-for-boarding": "963600d79d91c45be8e5353b4f9c9bcf144339532bd29d9d8cf7c3e766f12520",
};
const interactionSelectors = {
  "pet-sitter-vs-boarding": '[data-article-decision-tool][data-tool-type="care_comparison"]',
  "can-cat-stay-alone-for-a-week": '[data-cat-care-tool][data-tool-type="cat_care_options"]',
  "prepare-dog-for-boarding": '[data-article-checklist][data-tool-type="dog_preparation_checklist"]',
  "prepare-cat-for-boarding": '[data-article-checklist][data-tool-type="cat_preparation_checklist"]',
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
    if (locale === "ru") {
      assert(document.querySelector(interactionSelectors[article.slug]), `${path} needs its mapped interactive tool`);
      assert(document.querySelector(`[data-article-interactions="${article.slug}"]`));
      const compactCalendar = document.querySelector("[data-pet-calendar].availability--compact");
      assert(compactCalendar, `${path} needs the shared compact calendar`);
      const compactConfig = JSON.parse(compactCalendar.getAttribute("data-pet-calendar"));
      assert.equal(compactConfig.articleSlug, article.slug);
      assert.equal(compactConfig.sourcePage, path);
      assert(document.querySelector("#boarding-days.pet-article-billing-faq"), `${path} needs the shared billing FAQ anchor`);
    } else {
      assert.equal(document.querySelector("[data-article-interactions]"), null, `${path} should not receive unrequested EN interaction copy`);
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

for (const [slug, expectedHash] of Object.entries(russianCopyHashes)) {
  const source = await readFile(new URL(`src/pages/ru/novi-sad/pet-sitting/${slug}/index.md`, root), "utf8");
  const copyWithoutMedia = source
    .replace(/<div class="pet-article-media-group[^"]*">[\s\S]*?<\/div>\s*/g, "")
    .replace(/<figure class="pet-article-media[\s\S]*?<\/figure>\s*/g, "");
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
assert.equal(russianDogDocument.querySelectorAll(".faq-list details").length, 11, `${russianDogPath} should preserve all FAQs plus billing`);
assert(russianDogDocument.querySelector("#boarding-days"), `${russianDogPath} should preserve the shared billing FAQ`);

const russianMainPath = servicePath("ru", "main");
const russianMainHtml = await readFile(htmlFile(russianMainPath), "utf8");
const russianMainDocument = new JSDOM(russianMainHtml).window.document;
const russianMainBlocks = [...russianMainDocument.querySelectorAll("h2, p")]
  .map((node) => node.textContent.replace(/\s+/g, " ").trim());
const approvedRussianMainBlocks = [
  "Не знаете, с кем оставить питомца на время отъезда?",
  "Домашняя передержка помогает питомцу чувствовать себя комфортно и сохранить привычные для него вещи, даже когда вас нет рядом. Мы заранее узнаём о его характере, рутине и потребностях и учитываем их на протяжении всего времени с нами.",
  "Питомец будет жить с нами в квартире в Петроварадине.",
  "Как питомцы живут у нас",
  "Для нас это важная часть передержки. Когда оставляешь питомца у других людей, сообщение «всё хорошо» — это одно. А когда видишь, как он ест, спит, гуляет, валяется на диване или уже освоился и занимается своими делами, — совсем другое.",
  "Поэтому мы присылаем фото и видео минимум 3 раза в день и всегда остаёмся на связи.",
  "У каждого питомца свои привычки, и мы не меняем их просто потому, что хозяин уехал.",
  "Если собака привыкла гулять три раза в день — гуляем три. Если привыкла спать на кровати — спит на кровати. Если кошке нужны определённый лоток и наполнитель — привозите их с собой.",
  "Если питомцу нужно много внимания или, наоборот, хочется побыть отдельно и чтобы его никто не трогал, — мы обеспечим это.",
  "Мы подстраиваем передержку под питомца, а не питомца под передержку.",
  "Мы живём в квартире в Петроварадине. У нас три изолированные комнаты, поэтому, если питомцам нужно отдельное пространство, мы спокойно их разделяем.",
  "Двора и балкона нет. С собаками гуляем на улице по привычному для них графику.",
  "У нас нет запретов на диваны и кровати, а кошкам можно забираться на столы и шкафы.",
  "У нас живут свои кот и кошка, обоим по четыре года. Они привыкли к гостям: у нас уже оставались на передержке и собаки, и другие кошки.",
  "Вашему питомцу совершенно не обязательно с ними дружить. Если ему комфортнее жить отдельно, мы разделим животных и выделим каждому своё пространство.",
  "Познакомимся заранее",
  "Перед первой передержкой можно прийти к нам домой — это бесплатно. Вы познакомитесь с нами, и увидите, где будет жить питомец.",
  "Собаку можно взять с собой — она всё понюхает, осмотрится, познакомится с нами и котами, а мы посмотрим, как животные друг на друга реагируют.",
  "Кошку приносить на знакомство не рекомендуем: короткий визит в незнакомое пространство скорее станет для неё лишним стрессом и не покажет, как она будет чувствовать себя во время полноценной передержки.",
  "Если хочется проверить, как собака чувствует себя без хозяина, можно оставить её у нас на 3–4 часа. Тестовая передержка стоит 1 000 RSD.",
  "Что взять с собой",
  "Всё, что помогает питомцу чувствовать себя привычно в новом месте.",
  "Корм, миски, поводок или переноску, лекарства, игрушки, любимую лежанку — если она ему нужна. Для кошки рекомендуем привезти привычные лоток и наполнитель.",
  "Если у питомца есть особенный ритуал, режим или странная привычка — обязательно расскажите нам. Мы это учтём.",
];
for (const block of approvedRussianMainBlocks) {
  assert(russianMainBlocks.includes(block), `${russianMainPath} is missing approved copy: ${block}`);
}

const approvedRussianMainFaq = new Map([
  ["А если мой питомец не подружится с вашими котами?", "Ничего страшного. Дружить с нашими котами необязательно: если питомцу комфортнее отдельно, мы разделим животных и выделим ему своё спокойное пространство."],
  ["А нормально вообще оставлять животное там, где уже есть другие животные?", "Да, если у каждого достаточно пространства и никого не заставляют общаться. Наши коты привыкли к гостям: иногда животные знакомятся и проводят время вместе, иногда просто игнорируют друг друга. Оба варианта нормальны."],
  ["Сколько животных у вас бывает одновременно?", "Максимум два гостевых питомца одновременно."],
  ["Можно сначала приехать познакомиться?", "Да. Перед первой передержкой можно бесплатно прийти к нам домой примерно на полчаса, познакомиться с нами и посмотреть квартиру."],
  ["А можно оставить питомца на пробу?", "Если речь о собаке — да. Можно оставить её у нас на 3–4 часа и посмотреть, как она чувствует себя без хозяина. Тестовая передержка стоит 1 000 RSD. Для кошек тестовый визит не рекомендуем: короткое пребывание в незнакомом месте скорее добавит стресса и мало скажет о том, как пройдёт полноценная передержка."],
  ["Будете присылать фото и видео?", "Да. Присылаем фото и видео минимум 3 раза в день и всегда остаёмся на связи."],
  ["Что если у моего питомца какой-то очень специфический режим?", "Расскажите нам. Мы не ждём, что все животные одинаковые. Если это что-то адекватное и выполнимое, сохраняем его обычный режим."],
  ["А если что-нибудь пойдёт не так?", "Мы точно не будем молча ждать вашего возвращения. Разберёмся в ситуации, сразу свяжемся с вами и вместе решим, что делать. Если вдруг случится срочная ситуация со здоровьем и ждать ответа будет опасно для животного, сделаем необходимое в моменте, при необходимости обратимся к ветеринару и сразу же сообщим вам."],
]);
const visibleRussianMainFaq = new Map(
  [...russianMainDocument.querySelectorAll(".faq-list details")].map((details) => [
    details.querySelector("summary")?.textContent.replace(/\s+/g, " ").trim(),
    details.querySelector("p")?.textContent.replace(/\s+/g, " ").trim(),
  ]),
);
for (const [question, answer] of approvedRussianMainFaq) {
  assert.equal(visibleRussianMainFaq.get(question), answer, `${russianMainPath} has the wrong FAQ answer: ${question}`);
}
assert.equal(visibleRussianMainFaq.size, 9, `${russianMainPath} should preserve all main FAQs plus billing`);
const russianMainSchemas = [...russianMainDocument.querySelectorAll('script[type="application/ld+json"]')]
  .map((node) => JSON.parse(node.textContent || "{}"));
const russianMainFaqSchema = russianMainSchemas
  .flatMap((schema) => Array.isArray(schema) ? schema : schema["@graph"] ?? [schema])
  .find((item) => item["@type"] === "FAQPage");
const schemaRussianMainFaq = new Map(
  russianMainFaqSchema.mainEntity.map((item) => [
    item.name.replace(/\s+/g, " ").trim(),
    item.acceptedAnswer.text.replace(/\s+/g, " ").trim(),
  ]),
);
assert.deepEqual(schemaRussianMainFaq, visibleRussianMainFaq, `${russianMainPath} visible FAQ and FAQPage schema must match`);

const russianCatPath = servicePath("ru", "cats");
const russianCatHtml = await readFile(htmlFile(russianCatPath), "utf8");
const russianCatDocument = new JSDOM(russianCatHtml).window.document;
const russianCatBlocks = [...russianCatDocument.querySelectorAll("h2, p, summary")]
  .map((node) => node.textContent.replace(/\s+/g, " ").trim());
const approvedRussianCatBlocks = [
  "Не знаете, с кем оставить котика во время отъезда?",
  "На домашней передержке питомец остаётся под присмотром и получает столько внимания и личного пространства, сколько ему нужно.",
  "Мы не торопим знакомство, даём кошке возможность спрятаться, привыкнуть к новым запахам, поспать в одиночестве — столько, сколько нужно. А привычные корм и наполнитель помогают сохранить знакомую часть домашней рутины.",
  "Фото и видео каждый день",
  "Мы знаем, как тревожно оставлять любимого питомца, поэтому присылаем фото и видео минимум 3 раза в день. Не ограничиваемся сообщением «всё хорошо», а показываем, как на самом деле проходит день кошки у нас.",
  "Сон, питание, игры, валяние на диване, знакомство с котами — всё, что происходит в течение дня.",
  "Если кошка не дружит с другими — это нормально",
  "У нас живут свои кот и кошка, но вашему питомцу совершенно не обязательно с ними общаться.",
  "В квартире три изолированные комнаты. Если котику спокойнее жить отдельно, мы выделим ему своё безопасное пространство и организуем всё так, чтобы животные не пересекались.",
  "Сохраняем привычный режим, как дома",
  "Передержка — не время вводить новые правила. Перед заездом мы узнаём о рутине вашей кошки и придерживаемся её всё время, пока питомец живёт у нас.",
  "Привозите привычный корм, миски, лоток, наполнитель, игрушки — всё это поможет кошке чувствовать себя спокойнее в новом месте.",
  "Если в первые дни кошка захочет спрятаться и не выходить, поставим миски и лоток рядом и дадим столько времени на адаптацию, сколько потребуется.",
  "Наши коты будут рады познакомиться, но если ваша кошка выберет побыть одной, мы не будем настаивать на знакомстве и выделим каждому своё пространство.",
  "Познакомимся заранее",
  "Перед первой передержкой приглашаем вас зайти к нам домой примерно на 30 минут — это бесплатно. Вы познакомитесь с нами, увидите квартиру и условия, в которых будет жить питомец, познакомитесь с нашими котами.",
  "Саму кошку приносить на знакомство не рекомендуем: короткий визит в незнакомое пространство скорее станет для неё лишним стрессом и не покажет, как она будет чувствовать себя во время полноценной передержки.",
  "Можно также оставить кошку тестово на несколько часов — это стоит 1 000 RSD.",
  "Как считаются сутки передержки?",
  "Это нормально. Если питомцу спокойнее жить отдельно, мы выделим ему отдельную комнату и организуем всё так, чтобы животные не пересекались.",
  "Не будем её вытаскивать или заставлять общаться. Поставим рядом миски и лоток и дадим столько времени на адаптацию, сколько ей потребуется.",
  "Да, и мы рекомендуем так делать. Знакомые запахи и привычный наполнитель помогают кошке спокойнее освоиться в новом месте.",
  "Привозите привычный корм и расскажите, когда и сколько питомец ест. Мы будем придерживаться его обычного режима и не дадим ничего нового без согласования с вами.",
  "Да, у нас нет никаких ограничений.",
  "Нужны действующая комплексная прививка и прививка от бешенства. Перед передержкой попросим прислать фото ветпаспорта.",
  "Сразу свяжемся с вами, расскажем, что происходит, и вместе решим, что делать дальше. Не будем ждать вашего возвращения, если ситуацию нужно решать сейчас.",
  "Сразу свяжемся с вами. Если ситуация срочная, действуем в интересах питомца и при необходимости обращаемся к ветеринару, не дожидаясь вашего возвращения.",
  "Да. Мы всегда остаёмся на связи и присылаем фото и видео минимум 3 раза в день — даже если котик пока предпочитает проводить время в укрытии.",
];
for (const block of approvedRussianCatBlocks) {
  assert(russianCatBlocks.includes(block), `${russianCatPath} is missing approved or preserved copy: ${block}`);
}
assert.equal(russianCatDocument.querySelectorAll(".faq-list details").length, 10, `${russianCatPath} should preserve all cat FAQs plus billing`);

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
