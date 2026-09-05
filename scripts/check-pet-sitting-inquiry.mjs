import assert from "node:assert/strict";
import { handler } from "../netlify/functions/pet-sitting-inquiry.mjs";
import { buildPetSittingTelegramMessage, preparePetSittingInquiry } from "../src/lib/pet-sitting-inquiry.mjs";

const validPayload = {
  arrival: "2026-09-07",
  departure: "2026-09-09",
  pet: "dog",
  quantity: 1,
  flexible: false,
  telegramUsername: "@test_user",
  website: "",
  locale: "en",
  pageKind: "dogs",
  sourcePage: "/en/novi-sad/pet-sitting/dogs/",
};

const prepared = preparePetSittingInquiry(validPayload);
assert.equal(prepared.ok, true);
assert.equal(prepared.inquiry.quote.billableDays, 2);
assert.equal(prepared.inquiry.quote.total, 4000);
const notification = buildPetSittingTelegramMessage(prepared.inquiry, "2026-08-29T18:00:00.000Z");
assert.match(notification, /New pet boarding enquiry/);
assert.match(notification, /Estimated price: 4,000 RSD/);
assert.match(notification, /Source: https:\/\/getmanov\.com\/en\/novi-sad\/pet-sitting\/dogs\//);
assert.match(notification, /Submitted: 2026-08-29T18:00:00\.000Z/);

const articlePrepared = preparePetSittingInquiry({
  ...validPayload,
  locale: "ru",
  pageKind: "cats",
  pet: "cat",
  sourcePage: "/ru/novi-sad/pet-sitting/prepare-cat-for-boarding/",
});
assert.equal(articlePrepared.ok, true);
assert.equal(articlePrepared.inquiry.sourcePage, "/ru/novi-sad/pet-sitting/prepare-cat-for-boarding/");
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, sourcePage: "/ru/novi-sad/pet-sitting/not-a-real-article/" }),
  { ok: false, error: "invalid_source" },
);

const russianPrepared = preparePetSittingInquiry({
  ...validPayload,
  arrival: "2026-09-07",
  departure: "2026-09-11",
  locale: "ru",
  sourcePage: "/ru/novi-sad/pet-sitting/dogs/",
});
assert.equal(russianPrepared.ok, true);
const russianNotification = buildPetSittingTelegramMessage(russianPrepared.inquiry);
assert.match(russianNotification, /Срок: 4 дня передержки/);

assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, telegramUsername: "bad" }),
  { ok: false, error: "invalid_telegram" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, arrival: "", departure: "" }),
  { ok: false, error: "missing_dates" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, arrival: "2026-09-05", departure: "2026-09-08" }),
  { ok: false, error: "unavailable_dates" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validPayload, website: "spam.example" }),
  { ok: true, ignored: true },
);

const validHomeVisitPayload = {
  service_type: "home_visit",
  date_from: "2026-09-12",
  date_to: "2026-09-14",
  pet_type: "cat_and_dog",
  visits_per_day: 2,
  dog_walk: false,
  service_zone: "green",
  approximate_location: { latitude: 45.25541, longitude: 19.84462 },
  telegram_username: "@test_user",
  optional_comment: "Food, water, litter box and play.",
  website: "",
  locale: "en",
  sourcePage: "/en/novi-sad/pet-sitting/home-visits/",
};
const homeVisitPrepared = preparePetSittingInquiry(validHomeVisitPayload);
assert.equal(homeVisitPrepared.ok, true);
assert.equal(homeVisitPrepared.inquiry.serviceType, "home_visit");
assert.equal(homeVisitPrepared.inquiry.animal, "cat_and_dog");
assert.equal(homeVisitPrepared.inquiry.visitsPerDay, 2);
assert.equal(homeVisitPrepared.inquiry.dogWalk, false);
assert.equal(homeVisitPrepared.inquiry.serviceZone, "green");
assert.deepEqual(homeVisitPrepared.inquiry.approximateLocation, { latitude: 45.255, longitude: 19.845 });
assert.equal(homeVisitPrepared.inquiry.quote.perVisit, 1500);
assert.equal(homeVisitPrepared.inquiry.quote.visitCount, 6);
assert.equal(homeVisitPrepared.inquiry.quote.total, 9000);
const homeVisitNotification = buildPetSittingTelegramMessage(homeVisitPrepared.inquiry, "2026-09-04T12:00:00.000Z");
assert.match(homeVisitNotification, /New home-visit pet-sitting request/);
assert.match(homeVisitNotification, /Service type: home_visit/);
assert.match(homeVisitNotification, /Pet: cat and dog/);
assert.match(homeVisitNotification, /Service zone: green/);
assert.match(homeVisitNotification, /Approximate location: 45.255, 19.845/);
assert.match(homeVisitNotification, /Visits per day: 2/);
assert.match(homeVisitNotification, /Comment: Food, water, litter box and play\./);
assert.match(homeVisitNotification, /Estimated price: 9,000 RSD \(1,500 RSD × 6\)/);
assert.doesNotMatch(homeVisitNotification, /Number of pets|Medication \/ special care/);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, sourcePage: "/en/novi-sad/pet-sitting/" }),
  { ok: false, error: "invalid_source" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, approximate_location: undefined }),
  { ok: false, error: "missing_location" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, visits_per_day: 4 }),
  { ok: false, error: "invalid_visit_frequency" },
);
const threeDailyVisits = preparePetSittingInquiry({ ...validHomeVisitPayload, visits_per_day: 3 });
assert.equal(threeDailyVisits.ok, true);
assert.equal(threeDailyVisits.inquiry.quote.visitCount, 9);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, pet_type: "cat", dog_walk: true }),
  { ok: false, error: "invalid_dog_walk" },
);
const dogHomeVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, pet_type: "dog", dog_walk: true });
assert.equal(dogHomeVisit.ok, true);
assert.equal(dogHomeVisit.inquiry.dogWalk, true);
assert.equal(dogHomeVisit.inquiry.quote.perVisit, 2000);
assert.equal(dogHomeVisit.inquiry.quote.total, 12000);
const yellowDogVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, pet_type: "dog", dog_walk: true, service_zone: "yellow" });
assert.equal(yellowDogVisit.inquiry.quote.perVisit, 2500);
assert.equal(yellowDogVisit.inquiry.quote.total, 15000);
const outsideVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, service_zone: "outside" });
assert.equal(outsideVisit.inquiry.quote.total, null);
assert.match(buildPetSittingTelegramMessage(outsideVisit.inquiry), /Estimated price: confirm after contact/);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, pet_type: "other" }),
  { ok: false, error: "invalid_pet" },
);
const fallbackHomeVisitPayload = {
  service_type: "home_visit",
  date_from: "2026-09-12",
  date_to: "2026-09-14",
  pet_type: "dog",
  visits_per_day: 1,
  dog_walk: false,
  service_zone: "",
  neighborhood: "Petrovaradin",
  optional_comment: "Two dogs; one needs medication.",
  telegram_username: "@test_user",
  website: "",
  locale: "en",
  sourcePage: "/en/novi-sad/pet-sitting/home-visits/",
};
const fallbackHomeVisit = preparePetSittingInquiry(fallbackHomeVisitPayload);
assert.equal(fallbackHomeVisit.ok, true);
assert.equal(fallbackHomeVisit.inquiry.quote, null);
assert.match(buildPetSittingTelegramMessage(fallbackHomeVisit.inquiry), /Approximate location: Petrovaradin/);

const originalToken = process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
const originalChatId = process.env.PET_SITTING_TELEGRAM_CHAT_ID;
const originalFetch = globalThis.fetch;
const fetchCalls = [];
process.env.PET_SITTING_TELEGRAM_BOT_TOKEN = "test-only-bot-token";
process.env.PET_SITTING_TELEGRAM_CHAT_ID = "test-only-chat-id";
globalThis.fetch = async (url, options) => {
  fetchCalls.push({ url: String(url), options });
  return { ok: true, status: 200 };
};

try {
  const accepted = await handler({ httpMethod: "POST", body: JSON.stringify(validPayload) });
  assert.equal(accepted.statusCode, 200);
  assert.deepEqual(JSON.parse(accepted.body), { ok: true });
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].url, /test-only-bot-token\/sendMessage$/);
  const telegramBody = JSON.parse(fetchCalls[0].options.body);
  assert.equal(telegramBody.chat_id, "test-only-chat-id");
  assert.equal("parse_mode" in telegramBody, false);
  assert.match(telegramBody.text, /Customer Telegram: @test_user/);

  const acceptedHomeVisit = await handler({ httpMethod: "POST", body: JSON.stringify(validHomeVisitPayload) });
  assert.equal(acceptedHomeVisit.statusCode, 200);
  assert.equal(fetchCalls.length, 2);
  const homeVisitTelegramBody = JSON.parse(fetchCalls[1].options.body);
  assert.match(homeVisitTelegramBody.text, /Service type: home_visit/);
  assert.match(homeVisitTelegramBody.text, /Visits per day: 2/);
  assert.match(homeVisitTelegramBody.text, /Comment: Food, water, litter box and play\./);

  const invalidUsername = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, telegramUsername: "bad" }),
  });
  assert.equal(invalidUsername.statusCode, 400);
  assert.equal(fetchCalls.length, 2);

  const missingDates = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, arrival: "", departure: "" }),
  });
  assert.equal(missingDates.statusCode, 400);
  assert.equal(fetchCalls.length, 2);

  const honeypot = await handler({
    httpMethod: "POST",
    body: JSON.stringify({ ...validPayload, website: "spam.example" }),
  });
  assert.equal(honeypot.statusCode, 200);
  assert.equal(fetchCalls.length, 2);

  delete process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
  delete process.env.PET_SITTING_TELEGRAM_CHAT_ID;
  const unavailable = await handler({ httpMethod: "POST", body: JSON.stringify(validPayload) });
  assert.equal(unavailable.statusCode, 503);
} finally {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.PET_SITTING_TELEGRAM_BOT_TOKEN;
  else process.env.PET_SITTING_TELEGRAM_BOT_TOKEN = originalToken;
  if (originalChatId === undefined) delete process.env.PET_SITTING_TELEGRAM_CHAT_ID;
  else process.env.PET_SITTING_TELEGRAM_CHAT_ID = originalChatId;
}

console.log("Pet-sitting enquiry checks passed.");
