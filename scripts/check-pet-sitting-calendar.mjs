import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { petSittingUnavailablePeriods } from "../src/data/pet-sitting-availability.mjs";
import { billableStayDays, isDateUnavailable } from "../src/lib/pet-sitting-calendar.mjs";

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
  { path: "ru/novi-sad/pet-sitting/index.html", locale: "ru" },
  { path: "ru/novi-sad/pet-sitting/dogs/index.html", locale: "ru" },
  { path: "ru/novi-sad/pet-sitting/cats/index.html", locale: "ru" },
  { path: "en/novi-sad/pet-sitting/index.html", locale: "en" },
  { path: "en/novi-sad/pet-sitting/dogs/index.html", locale: "en" },
  { path: "en/novi-sad/pet-sitting/cats/index.html", locale: "en" },
];

assert.equal(billableStayDays("2026-08-29", "2026-08-30"), 2);
assert.equal(billableStayDays("2026-08-29", "2026-09-05"), 7);
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
  assert.deepEqual(config.unavailablePeriods, petSittingUnavailablePeriods, `${page.path} should use shared unavailable dates`);
  for (const key of blockedDates) {
    assert.equal(isDateUnavailable(key, config.unavailablePeriods), true, `${key} should be blocked on ${page.path}`);
  }
}

console.log(`Pet-sitting calendar checks passed for ${pages.length} pages.`);
