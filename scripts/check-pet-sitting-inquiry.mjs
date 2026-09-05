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
  serviceType: "home_visit",
  dateFrom: "2026-09-12",
  dateTo: "2026-09-14",
  animal: "cat",
  quantity: 2,
  visitsPerDay: 2,
  dogWalk: false,
  neighborhood: "Liman",
  specialCare: "",
  notes: "Food, water, litter box and play.",
  telegramUsername: "@test_user",
  website: "",
  locale: "en",
  sourcePage: "/en/novi-sad/pet-sitting/home-visits/",
};
const homeVisitPrepared = preparePetSittingInquiry(validHomeVisitPayload);
assert.equal(homeVisitPrepared.ok, true);
assert.equal(homeVisitPrepared.inquiry.serviceType, "home_visit");
assert.equal(homeVisitPrepared.inquiry.neighborhood, "Liman");
assert.equal(homeVisitPrepared.inquiry.visitsPerDay, 2);
assert.equal(homeVisitPrepared.inquiry.dogWalk, false);
assert.equal(homeVisitPrepared.inquiry.quote.perVisit, 1500);
assert.equal(homeVisitPrepared.inquiry.quote.visitCount, 6);
assert.equal(homeVisitPrepared.inquiry.quote.total, 9000);
const onePetHomeVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, quantity: 1 });
assert.equal(onePetHomeVisit.inquiry.quote.total, homeVisitPrepared.inquiry.quote.total, "One and two pets must have the same base price");
const homeVisitNotification = buildPetSittingTelegramMessage(homeVisitPrepared.inquiry, "2026-09-04T12:00:00.000Z");
assert.match(homeVisitNotification, /New home-visit pet-sitting request/);
assert.match(homeVisitNotification, /Service type: home_visit/);
assert.match(homeVisitNotification, /Approximate neighborhood: Liman/);
assert.match(homeVisitNotification, /Area pricing: confirm from neighborhood; extended area adds 500 RSD per visit/);
assert.match(homeVisitNotification, /Visits per day: 2/);
assert.match(homeVisitNotification, /Medication \/ special care: not provided/);
assert.match(homeVisitNotification, /Base price: 9,000 RSD \(1,500 RSD × 6\)/);
assert.doesNotMatch(homeVisitNotification, /Estimated price/);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, sourcePage: "/en/novi-sad/pet-sitting/" }),
  { ok: false, error: "invalid_source" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, neighborhood: "" }),
  { ok: false, error: "missing_neighborhood" },
);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, visitsPerDay: 4 }),
  { ok: false, error: "invalid_visit_frequency" },
);
const threeDailyVisits = preparePetSittingInquiry({ ...validHomeVisitPayload, visitsPerDay: 3 });
assert.equal(threeDailyVisits.ok, true);
assert.equal(threeDailyVisits.inquiry.quote.visitCount, 9);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, dogWalk: true }),
  { ok: false, error: "invalid_dog_walk" },
);
const dogHomeVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, animal: "dog", dogWalk: true });
assert.equal(dogHomeVisit.ok, true);
assert.equal(dogHomeVisit.inquiry.dogWalk, true);
assert.equal(dogHomeVisit.inquiry.quote.perVisit, 2000);
assert.equal(dogHomeVisit.inquiry.quote.total, 12000);
const customCareVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, specialCare: "One tablet with food." });
assert.equal(customCareVisit.ok, true);
assert.equal(customCareVisit.inquiry.quote.total, 9000);
assert.match(buildPetSittingTelegramMessage(customCareVisit.inquiry), /Base price: 9,000 RSD \(1,500 RSD × 6\); special care to confirm/);
const threePetVisit = preparePetSittingInquiry({ ...validHomeVisitPayload, quantity: 3 });
assert.equal(threePetVisit.ok, true);
assert.equal(threePetVisit.inquiry.quote.total, null);
assert.match(buildPetSittingTelegramMessage(threePetVisit.inquiry), /confirm individually \(more than 2 pets\); base rate 1,500 RSD per visit/);
assert.deepEqual(
  preparePetSittingInquiry({ ...validHomeVisitPayload, animal: "other" }),
  { ok: false, error: "invalid_pet" },
);

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
  assert.match(homeVisitTelegramBody.text, /Care details: Food, water, litter box and play\./);

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
