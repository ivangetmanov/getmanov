import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { petSittingUnavailablePeriods } from "../src/data/pet-sitting-availability.mjs";
import { billableStayDays, isDateUnavailable, rangeHasUnavailable } from "../src/lib/pet-sitting-calendar.mjs";
import {
  calculatePetSittingQuote,
  formatRussianStayDuration,
  petSittingBusiness,
  russianDayForm,
} from "../src/lib/pet-sitting-business.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const blockedDates = [
  "2026-08-29",
  "2026-08-30",
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
  "2026-09-05",
  "2026-09-06",
];
const pages = [
  { path: "ru/novi-sad/pet-sitting/index.html", locale: "ru", kind: "main" },
  { path: "ru/novi-sad/pet-sitting/dogs/index.html", locale: "ru", kind: "dogs" },
  { path: "ru/novi-sad/pet-sitting/cats/index.html", locale: "ru", kind: "cats" },
  { path: "en/novi-sad/pet-sitting/index.html", locale: "en", kind: "main" },
  { path: "en/novi-sad/pet-sitting/dogs/index.html", locale: "en", kind: "dogs" },
  { path: "en/novi-sad/pet-sitting/cats/index.html", locale: "en", kind: "cats" },
  { path: "ru/novi-sad/pet-sitting/pet-sitter-vs-boarding/index.html", locale: "ru", kind: "main", articleSlug: "pet-sitter-vs-boarding" },
  { path: "ru/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/index.html", locale: "ru", kind: "cats", articleSlug: "can-cat-stay-alone-for-a-week" },
  { path: "ru/novi-sad/pet-sitting/prepare-dog-for-boarding/index.html", locale: "ru", kind: "dogs", articleSlug: "prepare-dog-for-boarding" },
  { path: "ru/novi-sad/pet-sitting/prepare-cat-for-boarding/index.html", locale: "ru", kind: "cats", articleSlug: "prepare-cat-for-boarding" },
  { path: "en/novi-sad/pet-sitting/pet-sitter-vs-boarding/index.html", locale: "en", kind: "main", articleSlug: "pet-sitter-vs-boarding" },
  { path: "en/novi-sad/pet-sitting/can-cat-stay-alone-for-a-week/index.html", locale: "en", kind: "cats", articleSlug: "can-cat-stay-alone-for-a-week" },
  { path: "en/novi-sad/pet-sitting/prepare-dog-for-boarding/index.html", locale: "en", kind: "dogs", articleSlug: "prepare-dog-for-boarding" },
  { path: "en/novi-sad/pet-sitting/prepare-cat-for-boarding/index.html", locale: "en", kind: "cats", articleSlug: "prepare-cat-for-boarding" },
];
const articleToolTypes = {
  "pet-sitter-vs-boarding": "care_comparison",
  "can-cat-stay-alone-for-a-week": "cat_care_options",
  "prepare-dog-for-boarding": "dog_preparation_checklist",
  "prepare-cat-for-boarding": "cat_preparation_checklist",
};

assert.equal(billableStayDays("2026-08-29", "2026-08-30"), 2);
assert.equal(billableStayDays("2026-08-29", "2026-09-05"), 7);
assert.equal(billableStayDays("2026-09-08", "2026-09-10"), 2);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-08-30", 1).total, 4000);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-08-30", 2).total, 6000);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-09-05", 1).total, 10500);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-09-05", 2).total, 17500);
assert.deepEqual(
  calculatePetSittingQuote("2026-09-07", "2026-09-21", 1),
  { billableDays: 14, quantity: 1, dailyRate: null, total: null, individualPricing: true },
);
const russianDurationExamples = new Map([
  [1, "1 день передержки"],
  [2, "2 дня передержки"],
  [4, "4 дня передержки"],
  [5, "5 дней передержки"],
  [11, "11 дней передержки"],
  [14, "14 дней передержки"],
  [21, "21 день передержки"],
  [22, "22 дня передержки"],
  [25, "25 дней передержки"],
]);
for (const [days, expected] of russianDurationExamples) {
  assert.equal(formatRussianStayDuration(days), expected);
  assert.equal(`${days} ${russianDayForm(days)} передержки`, expected);
}
assert.equal(isDateUnavailable("2026-08-28", petSittingUnavailablePeriods), false);
assert.equal(isDateUnavailable("2026-09-07", petSittingUnavailablePeriods), false);
assert.equal(rangeHasUnavailable("2026-08-28", "2026-08-29", petSittingUnavailablePeriods), true);
assert.equal(rangeHasUnavailable("2026-09-07", "2026-09-10", petSittingUnavailablePeriods), false);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(?:astro|mjs|js|ts)$/.test(entry.name)) files.push(path);
  }
  return files;
}
const dateSourceDeclarations = [];
for (const file of await sourceFiles(`${projectRoot}src`)) {
  const source = await readFile(file, "utf8");
  if (/export const petSittingUnavailablePeriods\s*=/.test(source)) dateSourceDeclarations.push(file);
}
assert.deepEqual(dateSourceDeclarations, [`${projectRoot}src/data/pet-sitting-availability.mjs`]);

for (const key of blockedDates) {
  assert.equal(isDateUnavailable(key, petSittingUnavailablePeriods), true, `${key} should be unavailable`);
}

const fullCalendarMarkup = new Map();
for (const page of pages) {
  const html = await readFile(`${projectRoot}dist/${page.path}`, "utf8");
  const dom = new JSDOM(html);
  const calendar = dom.window.document.querySelector("[data-pet-calendar]");
  assert.ok(calendar, `${page.path} should contain a pet-sitting calendar`);
  assert.equal(dom.window.document.querySelectorAll("[data-pet-calendar]").length, 1, `${page.path} should contain exactly one calendar`);

  const config = JSON.parse(calendar.getAttribute("data-pet-calendar"));
  assert.equal(config.locale, page.locale, `${page.path} should use the correct locale`);
  assert.equal(config.pageKind, page.kind, `${page.path} should use the correct page kind`);
  const expectedSourcePage = page.articleSlug
    ? `/${page.path.replace(/index\.html$/, "")}`
    : petSittingBusiness.pagePaths[page.locale][page.kind];
  assert.equal(config.sourcePage, expectedSourcePage);
  assert.equal(config.articleSlug, page.articleSlug ?? "");
  assert.equal(config.toolType, page.articleSlug ? articleToolTypes[page.articleSlug] : "full_enquiry");
  assert.deepEqual(config.unavailablePeriods, petSittingUnavailablePeriods, `${page.path} should use shared unavailable dates`);
  for (const key of blockedDates) {
    assert.equal(isDateUnavailable(key, config.unavailablePeriods), true, `${key} should be blocked on ${page.path}`);
  }

  assert.ok(calendar.querySelector("[data-enquiry-submit][disabled]"), `${page.path} should have a disabled enquiry button initially`);
  assert.ok(calendar.querySelector('input[name="website"]'), `${page.path} should include a honeypot field`);
  assert.ok(calendar.querySelector("[data-inquiry-details]:not([hidden])"), `${page.path} should expose the complete enquiry form`);
  assert.equal(calendar.querySelector("[data-compact-enquiry-open]"), null, `${page.path} must not contain the removed compact disclosure`);
  assert.equal(calendar.classList.contains("availability--compact"), false, `${page.path} must use the full shared calendar`);
  assert.equal(calendar.querySelector('input[type="time"]'), null, `${page.path} must remain date-only`);
  const priceHelp = calendar.querySelector('[data-inquiry-price-help][href="#boarding-days"]');
  assert.ok(priceHelp, `${page.path} needs the boarding-day explanation link`);
  assert.equal(
    priceHelp.textContent.trim(),
    page.locale === "en" ? "How are boarding days calculated?" : "Как считаются сутки?",
  );

  const boardingDaysFaq = dom.window.document.querySelector(page.articleSlug ? "#boarding-days" : "#boarding-days[open]");
  const expectedFaqQuestion = page.locale === "en"
    ? "How are boarding days calculated?"
    : "Как считаются сутки передержки?";
  const expectedFaqAnswer = page.locale === "en"
    ? "We charge by 24-hour periods starting from the check-in time.\n\nFor example, if your pet arrives on September 8 at 9:00 AM and is picked up on September 10 at 9:00 AM, that is 2 boarding days.\n\nIf pick-up is later than the original check-in time, the next billable period begins.\n\nWe confirm the exact check-in and pick-up times before the stay."
    : "Оплата считается за каждые 24 часа с момента заезда.\n\nНапример, если питомца привезли 8 сентября в 09:00 и забрали 10 сентября в 09:00 — это 2 суток.\n\nЕсли питомца забирают позже времени заезда, начинается следующий оплачиваемый период.\n\nТочное время заезда и выезда мы согласуем перед передержкой.";
  assert.equal(boardingDaysFaq?.querySelector("summary")?.textContent.trim(), expectedFaqQuestion);
  assert.equal(boardingDaysFaq?.querySelector("p")?.textContent.trim(), expectedFaqAnswer);

  const schemas = [...dom.window.document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => JSON.parse(node.textContent || "{}"));
  const schemaItems = schemas.flatMap((schema) => Array.isArray(schema) ? schema : schema["@graph"] ?? [schema]);
  const faqSchema = schemaItems.find((schema) => schema["@type"] === "FAQPage");
  const schemaQuestion = faqSchema?.mainEntity?.find((item) => item.name === expectedFaqQuestion);
  assert.equal(schemaQuestion?.acceptedAnswer?.text, expectedFaqAnswer, `${page.path} FAQ schema must match the visible answer`);
  const selectedAnimal = calendar.querySelector('select[name="animal"] option[selected]')?.value;
  assert.equal(selectedAnimal, page.kind === "cats" ? "cat" : "dog", `${page.path} should have the correct species default`);
  const channels = [...calendar.querySelectorAll("[data-direct-contact]")].map((link) => link.dataset.channel);
  assert.deepEqual(channels, page.locale === "en" ? ["telegram", "whatsapp", "viber"] : ["telegram"]);
  if (page.locale === "en") {
    assert.ok(calendar.querySelector('a[href^="https://wa.me/381628426881"]'));
    assert.ok(calendar.querySelector('a[href^="viber://chat?number=%2B381628426881"]'));
  }
  const normalizedCalendar = calendar.cloneNode(true);
  normalizedCalendar.setAttribute("data-pet-calendar", "");
  const parityKey = `${page.locale}:${page.kind}`;
  if (page.articleSlug) {
    assert.equal(
      normalizedCalendar.outerHTML,
      fullCalendarMarkup.get(parityKey),
      `${page.path} calendar markup must exactly match its ${page.locale}/${page.kind} money page`,
    );
  } else {
    fullCalendarMarkup.set(parityKey, normalizedCalendar.outerHTML);
  }

  assert.equal(html.includes("PET_SITTING_TELEGRAM_BOT_TOKEN"), false);
  assert.equal(html.includes("PET_SITTING_TELEGRAM_CHAT_ID"), false);
  if (!page.articleSlug && page.kind === "main") {
    assert.equal(dom.window.document.querySelector(".pet-hero img")?.getAttribute("src"), "/images/pet-sitting/main-hero.webp");
  }
}

const calendarSource = await readFile(`${projectRoot}src/components/PetSittingCalendar.astro`, "utf8");
assert.match(calendarSource, /Estimated price: \$\{formatRsd\(quote\.total, 'en'\)\} RSD/);
assert.match(calendarSource, /Предварительная стоимость: \$\{formatRsd\(quote\.total, 'ru'\)\} RSD/);
assert.doesNotMatch(calendarSource, /Estimated total:/);
assert.doesNotMatch(calendarSource, /Итого:/);

console.log(`Pet-sitting calendar checks passed for ${pages.length} full shared instances.`);
