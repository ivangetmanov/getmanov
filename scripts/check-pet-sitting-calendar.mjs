import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { petSittingUnavailablePeriods } from "../src/data/pet-sitting-availability.mjs";
import { billableStayDays, isDateUnavailable } from "../src/lib/pet-sitting-calendar.mjs";
import { calculatePetSittingQuote, petSittingBusiness } from "../src/lib/pet-sitting-business.mjs";

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
];

assert.equal(billableStayDays("2026-08-29", "2026-08-30"), 2);
assert.equal(billableStayDays("2026-08-29", "2026-09-05"), 7);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-08-30", 1).total, 4000);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-08-30", 2).total, 6000);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-09-05", 1).total, 10500);
assert.equal(calculatePetSittingQuote("2026-08-29", "2026-09-05", 2).total, 17500);
assert.deepEqual(
  calculatePetSittingQuote("2026-09-07", "2026-09-21", 1),
  { billableDays: 14, quantity: 1, dailyRate: null, total: null, individualPricing: true },
);
assert.equal(isDateUnavailable("2026-08-28", petSittingUnavailablePeriods), false);
assert.equal(isDateUnavailable("2026-09-07", petSittingUnavailablePeriods), false);

for (const key of blockedDates) {
  assert.equal(isDateUnavailable(key, petSittingUnavailablePeriods), true, `${key} should be unavailable`);
}

for (const page of pages) {
  const html = await readFile(`${projectRoot}dist/${page.path}`, "utf8");
  const dom = new JSDOM(html);
  const calendar = dom.window.document.querySelector("[data-pet-calendar]");
  assert.ok(calendar, `${page.path} should contain a pet-sitting calendar`);

  const config = JSON.parse(calendar.getAttribute("data-pet-calendar"));
  assert.equal(config.locale, page.locale, `${page.path} should use the correct locale`);
  assert.equal(config.pageKind, page.kind, `${page.path} should use the correct page kind`);
  assert.equal(config.sourcePage, petSittingBusiness.pagePaths[page.locale][page.kind]);
  assert.deepEqual(config.unavailablePeriods, petSittingUnavailablePeriods, `${page.path} should use shared unavailable dates`);
  for (const key of blockedDates) {
    assert.equal(isDateUnavailable(key, config.unavailablePeriods), true, `${key} should be blocked on ${page.path}`);
  }

  assert.ok(calendar.querySelector("[data-enquiry-submit][disabled]"), `${page.path} should have a disabled enquiry button initially`);
  assert.ok(calendar.querySelector('input[name="website"]'), `${page.path} should include a honeypot field`);
  const selectedAnimal = calendar.querySelector('select[name="animal"] option[selected]')?.value;
  assert.equal(selectedAnimal, page.kind === "cats" ? "cat" : "dog", `${page.path} should have the correct species default`);
  const channels = [...calendar.querySelectorAll("[data-direct-contact]")].map((link) => link.dataset.channel);
  assert.deepEqual(channels, page.locale === "en" ? ["telegram", "whatsapp", "viber"] : ["telegram"]);
  if (page.locale === "en") {
    assert.ok(calendar.querySelector('a[href^="https://wa.me/381628426881"]'));
    assert.ok(calendar.querySelector('a[href^="viber://chat?number=%2B381628426881"]'));
  }

  assert.equal(html.includes("PET_SITTING_TELEGRAM_BOT_TOKEN"), false);
  assert.equal(html.includes("PET_SITTING_TELEGRAM_CHAT_ID"), false);
  if (page.kind === "main") {
    assert.equal(dom.window.document.querySelector(".pet-hero img")?.getAttribute("src"), "/images/pet-sitting/main-hero.webp");
  }
}

console.log(`Pet-sitting calendar checks passed for ${pages.length} pages.`);
